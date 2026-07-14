import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ALERT_SUBSCRIBERS_COLLECTION, ALERT_EMAIL_LOGS_COLLECTION } from "@/lib/alerts";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(user.length - 1, 3))}@${domain}`;
}

function displayStatus(s: { status: string; confirmed: boolean }): "active" | "pending" | "unsubscribed" | "bounced" {
  if (s.status === "unsubscribed") return "unsubscribed";
  if (s.status === "bounced") return "bounced";
  if (!s.confirmed) return "pending";
  return "active";
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const alertType = searchParams.get("type") || "";
  const status = searchParams.get("status") || ""; // active | pending | unsubscribed | bounced
  const language = searchParams.get("language") || "";
  const search = searchParams.get("search") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 25;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    const subscribers = db.collection(ALERT_SUBSCRIBERS_COLLECTION);
    const logs = db.collection(ALERT_EMAIL_LOGS_COLLECTION);

    const now = Date.now();
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const d7 = new Date(now - 7 * 86400000);
    const d14 = new Date(now - 14 * 86400000);
    const d30 = new Date(now - 30 * 86400000);

    const [
      totalActive, pendingConfirmation, unsubscribedCount, bouncedCount,
      newToday, new7d, new7dPrevious, new30d,
      everConfirmed, everSent, everSentAndOpened,
      emailsSent30d,
      lastSentLog,
      byTypeAgg,
      growthAgg,
    ] = await Promise.all([
      subscribers.countDocuments({ status: "active", confirmed: true }),
      subscribers.countDocuments({ confirmed: false, status: { $ne: "unsubscribed" } }),
      subscribers.countDocuments({ status: "unsubscribed" }),
      subscribers.countDocuments({ status: "bounced" }),
      subscribers.countDocuments({ created_at: { $gte: today } }),
      subscribers.countDocuments({ created_at: { $gte: d7 } }),
      subscribers.countDocuments({ created_at: { $gte: d14, $lt: d7 } }),
      subscribers.countDocuments({ created_at: { $gte: d30 } }),
      subscribers.countDocuments({ confirmed: true }),
      subscribers.countDocuments({ emails_sent_count: { $gt: 0 } }),
      subscribers.countDocuments({ emails_sent_count: { $gt: 0 }, last_opened_at: { $exists: true, $ne: null } }),
      logs.countDocuments({ status: "sent", sent_at: { $gte: d30 } }),
      logs.find({ status: "sent" }).sort({ sent_at: -1 }).limit(1).toArray(),
      subscribers.aggregate([{ $group: { _id: "$alert_type", count: { $sum: 1 } } }]).toArray(),
      subscribers.aggregate([
        { $match: { created_at: { $gte: d30 } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
    ]);

    const totalSignupsEver = await subscribers.countDocuments({});
    const confirmationRate = totalSignupsEver > 0 ? Math.round((everConfirmed / totalSignupsEver) * 1000) / 10 : 0;
    const unsubscribeRate = everConfirmed > 0 ? Math.round((unsubscribedCount / everConfirmed) * 1000) / 10 : 0;
    const openRate = everSent > 0 ? Math.round((everSentAndOpened / everSent) * 1000) / 10 : 0;
    const new7dTrend = new7dPrevious > 0 ? Math.round(((new7d - new7dPrevious) / new7dPrevious) * 1000) / 10 : (new7d > 0 ? 100 : 0);

    const lastSendAt = (lastSentLog[0]?.sent_at as Date | undefined) || null;
    const hoursSinceLastSend = lastSendAt ? (now - new Date(lastSendAt).getTime()) / 3600000 : null;

    // 3-state health: never sent -> red; sent before but stale (>72h) despite active subs -> yellow; otherwise green.
    let health: "green" | "yellow" | "red";
    if (!lastSendAt) health = "red";
    else if (totalActive > 0 && hoursSinceLastSend! > 72) health = "yellow";
    else health = "green";

    // Baseline count before the 30-day window, to build a cumulative growth curve.
    const baselineCount = await subscribers.countDocuments({ created_at: { $lt: d30 } });
    const growthByDay = new Map((growthAgg as unknown as { _id: string; count: number }[]).map((r) => [r._id, r.count]));
    let running = baselineCount;
    const growth: { date: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      running += growthByDay.get(key) || 0;
      growth.push({ date: key, total: running });
    }

    const query: Record<string, unknown> = {};
    if (alertType) query.alert_type = alertType;
    if (language) query.language = language;
    if (status === "pending") { query.confirmed = false; query.status = { $ne: "unsubscribed" }; }
    else if (status === "active") { query.confirmed = true; query.status = "active"; }
    else if (status === "unsubscribed" || status === "bounced") { query.status = status; }
    if (search) query.email = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.$gte = new Date(dateFrom);
      if (dateTo) range.$lte = new Date(`${dateTo}T23:59:59.999Z`);
      query.created_at = range;
    }

    const [rows, total] = await Promise.all([
      subscribers.find(query).sort({ created_at: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      subscribers.countDocuments(query),
    ]);

    const subscriberRows = rows.map((s) => ({
      id: s._id.toString(),
      emailMasked: maskEmail(s.email),
      alertType: s.alert_type,
      filters: s.filters || {},
      language: s.language || "fr",
      status: displayStatus(s as unknown as { status: string; confirmed: boolean }),
      createdAt: s.created_at,
      emailsSentCount: s.emails_sent_count || 0,
      lastEmailSentAt: s.last_email_sent_at || null,
    }));

    return NextResponse.json({
      kpis: {
        totalActive,
        pendingConfirmation,
        unsubscribedCount,
        bouncedCount,
        newToday,
        new7d,
        new7dTrend,
        new30d,
        emailsSent30d,
        confirmationRate,
        unsubscribeRate,
        openRate,
        byType: Object.fromEntries((byTypeAgg as unknown as { _id: string; count: number }[]).map((r) => [r._id, r.count])),
      },
      health,
      lastSendAt,
      hoursSinceLastSend,
      growth,
      subscribers: subscriberRows,
      pagination: { page, pageSize, total },
    });
  } finally {
    await client.close();
  }
}

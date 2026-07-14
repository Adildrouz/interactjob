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

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const alertType = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
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
    const d30 = new Date(now - 30 * 86400000);
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

    const [
      totalActive, pendingConfirmation, unsubscribedCount, bouncedCount,
      newToday, new7d, new30d,
      everConfirmed, everSent, everSentAndOpened,
      emailsSentThisMonth,
      recentSends,
      byTypeAgg,
    ] = await Promise.all([
      subscribers.countDocuments({ status: "active", confirmed: true }),
      subscribers.countDocuments({ confirmed: false, status: { $ne: "unsubscribed" } }),
      subscribers.countDocuments({ status: "unsubscribed" }),
      subscribers.countDocuments({ status: "bounced" }),
      subscribers.countDocuments({ created_at: { $gte: today } }),
      subscribers.countDocuments({ created_at: { $gte: d7 } }),
      subscribers.countDocuments({ created_at: { $gte: d30 } }),
      subscribers.countDocuments({ confirmed: true }),
      subscribers.countDocuments({ emails_sent_count: { $gt: 0 } }),
      subscribers.countDocuments({ emails_sent_count: { $gt: 0 }, last_opened_at: { $exists: true, $ne: null } }),
      logs.countDocuments({ status: "sent", sent_at: { $gte: monthStart } }),
      logs.countDocuments({ status: "sent", sent_at: { $gte: d7 } }),
      subscribers.aggregate([
        { $group: { _id: "$alert_type", count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const totalSignupsEver = await subscribers.countDocuments({});
    const confirmationRate = totalSignupsEver > 0 ? Math.round((everConfirmed / totalSignupsEver) * 1000) / 10 : 0;
    const unsubscribeRate = everConfirmed > 0 ? Math.round((unsubscribedCount / everConfirmed) * 1000) / 10 : 0;
    const openRate = everSent > 0 ? Math.round((everSentAndOpened / everSent) * 1000) / 10 : 0;

    // Health check: active+confirmed subscribers exist, but nothing sent in 7 days.
    const healthWarning = totalActive > 0 && recentSends === 0;

    // Subscribers table (masked emails — never expose full addresses in the admin list view either)
    const query: Record<string, unknown> = {};
    if (alertType) query.alert_type = alertType;
    if (status) query.status = status;

    const [rows, total] = await Promise.all([
      subscribers.find(query).sort({ created_at: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      subscribers.countDocuments(query),
    ]);

    const subscriberRows = rows.map((s) => ({
      id: s._id.toString(),
      emailMasked: maskEmail(s.email),
      alertType: s.alert_type,
      filters: s.filters || {},
      status: s.status,
      confirmed: s.confirmed,
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
        new30d,
        emailsSentThisMonth,
        confirmationRate,
        unsubscribeRate,
        openRate,
        byType: Object.fromEntries((byTypeAgg as unknown as { _id: string; count: number }[]).map((r) => [r._id, r.count])),
      },
      healthWarning,
      subscribers: subscriberRows,
      pagination: { page, pageSize, total },
    });
  } finally {
    await client.close();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ALERT_EMAIL_LOGS_COLLECTION } from "@/lib/alerts";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// GET /api/admin/alerts/logs — send history: date, alert type, offers
// included, success/failure, error reasons. Grouped per send (one log row
// per subscriber per digest), newest first.
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 50;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const logs = client.db("interactjob").collection(ALERT_EMAIL_LOGS_COLLECTION);

    const query: Record<string, unknown> = {};
    if (statusFilter) query.status = statusFilter;

    const [rows, total, byDay] = await Promise.all([
      logs.find(query).sort({ sent_at: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      logs.countDocuments(query),
      logs.aggregate([
        { $match: { sent_at: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } },
            sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $ne: ["$status", "sent"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray(),
    ]);

    return NextResponse.json({
      logs: rows.map((l) => ({
        id: l._id.toString(),
        subscriberId: l.subscriber_id?.toString(),
        alertType: l.alert_type,
        offersIncluded: l.offers_included || [],
        sentAt: l.sent_at,
        status: l.status,
        errorReason: l.error_reason || null,
      })),
      byDay,
      pagination: { page, pageSize, total },
    });
  } finally {
    await client.close();
  }
}

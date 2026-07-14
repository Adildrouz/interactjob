import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ALERT_EMAIL_LOGS_COLLECTION } from "@/lib/alerts";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

interface BatchGroup {
  _id: { runId: string; alertType: string };
  firstSentAt: Date;
  recipients: number;
  sentCount: number;
  failedCount: number;
  offersArrays: string[][];
}

// GET /api/admin/alerts/logs — send history grouped into batches (one row
// per sending run + alert type — a single cron run can cover offres/concours/
// remote separately, each with its own set of matched offers per subscriber).
// Runs before the run_id field existed fall back to a day+type synthetic key.
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const alertType = searchParams.get("type") || "";
  const statusFilter = searchParams.get("status") || ""; // ok | partial | failed
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 20;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const logs = client.db("interactjob").collection(ALERT_EMAIL_LOGS_COLLECTION);

    const match: Record<string, unknown> = {};
    if (alertType) match.alert_type = alertType;
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.$gte = new Date(dateFrom);
      if (dateTo) range.$lte = new Date(`${dateTo}T23:59:59.999Z`);
      match.sent_at = range;
    }

    const groupStage = {
      $group: {
        _id: {
          runId: {
            $ifNull: ["$run_id", { $concat: [{ $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } }, "_legacy"] }],
          },
          alertType: "$alert_type",
        },
        firstSentAt: { $min: "$sent_at" },
        recipients: { $sum: 1 },
        sentCount: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $ne: ["$status", "sent"] }, 1, 0] } },
        offersArrays: { $push: "$offers_included" },
      },
    };

    const allBatches = (await logs.aggregate([
      { $match: match },
      groupStage,
      { $sort: { firstSentAt: -1 } },
    ]).toArray()) as unknown as BatchGroup[];

    const filtered = allBatches.filter((b) => {
      if (!statusFilter) return true;
      if (statusFilter === "ok") return b.failedCount === 0;
      if (statusFilter === "failed") return b.sentCount === 0;
      if (statusFilter === "partial") return b.sentCount > 0 && b.failedCount > 0;
      return true;
    });

    const total = filtered.length;
    const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

    const batches = pageRows.map((b) => {
      const uniqueOffers = new Set(b.offersArrays.flat()).size;
      const status = b.failedCount === 0 ? "ok" : b.sentCount === 0 ? "failed" : "partial";
      return {
        runId: b._id.runId,
        alertType: b._id.alertType,
        sentAt: b.firstSentAt,
        recipients: b.recipients,
        uniqueOffers,
        sentCount: b.sentCount,
        failedCount: b.failedCount,
        status,
      };
    });

    const byDay = await logs.aggregate([
      { $match: { sent_at: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } },
          sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $ne: ["$status", "sent"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    return NextResponse.json({
      batches,
      byDay,
      pagination: { page, pageSize, total },
    });
  } finally {
    await client.close();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { ALERT_EMAIL_LOGS_COLLECTION, ALERT_SUBSCRIBERS_COLLECTION } from "@/lib/alerts";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(user.length - 1, 3))}@${domain}`;
}

// GET /api/admin/alerts/logs/detail?runId=...&alertType=... — per-subscriber
// breakdown for one batch row: who got it, which offers, and why it failed
// for any recipient that didn't succeed.
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId") || "";
  const alertType = searchParams.get("alertType") || "";
  if (!runId || !alertType) return NextResponse.json({ error: "runId et alertType requis" }, { status: 400 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    const logs = db.collection(ALERT_EMAIL_LOGS_COLLECTION);
    const subscribers = db.collection(ALERT_SUBSCRIBERS_COLLECTION);

    const isLegacy = runId.endsWith("_legacy");
    const match: Record<string, unknown> = isLegacy
      ? {
          alert_type: alertType,
          run_id: { $in: [null, undefined] },
          sent_at: {
            $gte: new Date(`${runId.replace("_legacy", "")}T00:00:00.000Z`),
            $lte: new Date(`${runId.replace("_legacy", "")}T23:59:59.999Z`),
          },
        }
      : { run_id: runId, alert_type: alertType };

    const rows = await logs.find(match).sort({ sent_at: 1 }).toArray();
    const subscriberIds = rows.map((r) => r.subscriber_id).filter(Boolean);
    const subDocs = await subscribers
      .find({ _id: { $in: subscriberIds.map((id) => (typeof id === "string" ? new ObjectId(id) : id)) } }, { projection: { email: 1 } })
      .toArray();
    const emailById = new Map(subDocs.map((s) => [s._id.toString(), s.email as string]));

    return NextResponse.json({
      recipients: rows.map((r) => ({
        id: r._id.toString(),
        emailMasked: maskEmail(emailById.get(r.subscriber_id?.toString()) || ""),
        offersIncluded: r.offers_included || [],
        status: r.status,
        errorReason: r.error_reason || null,
        sentAt: r.sent_at,
      })),
    });
  } finally {
    await client.close();
  }
}

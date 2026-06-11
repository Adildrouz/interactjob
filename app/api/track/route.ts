import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

/**
 * POST /api/track — non-blocking page view + unique visitor counter.
 * Body: { url: string, sessionId: string }
 * Deduplication: one view per sessionId per URL (client-enforced via sessionStorage).
 * Collections:
 *   page_views   — { url, date (YYYY-MM-DD), count }  for page-level aggregation
 *   visitor_days — { session_id, date }                for unique visitor count
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ ok: false }, { status: 500 });

  let url = "";
  let sessionId = "";
  try {
    const body = await req.json();
    url = String(body?.url || "").slice(0, 200);
    sessionId = String(body?.sessionId || "").slice(0, 64);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!url || !sessionId) return NextResponse.json({ error: "url + sessionId required" }, { status: 400 });

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    await Promise.all([
      // Increment raw page view count for this URL today
      db.collection("page_views").updateOne(
        { url, date },
        { $inc: { count: 1 }, $set: { last_view: new Date() } },
        { upsert: true }
      ),
      // Register unique visitor session for today (upsert = idempotent)
      db.collection("visitor_days").updateOne(
        { session_id: sessionId, date },
        { $setOnInsert: { session_id: sessionId, date, first_seen: new Date() } },
        { upsert: true }
      ),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  } finally {
    await client.close();
  }
}

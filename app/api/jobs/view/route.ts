import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

/**
 * POST /api/jobs/view — increment the view counter of a job page.
 * Body: { jobId }. Deduplication is done client-side (once per session).
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ ok: false }, { status: 500 });

  let jobId = "";
  try {
    jobId = String((await req.json())?.jobId || "").slice(0, 100);
  } catch { /* ignore */ }
  if (!jobId) return NextResponse.json({ error: "jobId requis" }, { status: 400 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db("interactjob").collection("jobviews").updateOne(
      { job_id: jobId },
      { $inc: { views: 1 }, $set: { last_view: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  } finally {
    await client.close();
  }
}

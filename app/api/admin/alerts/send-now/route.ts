import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { runAlertsSenderOnce } from "@/lib/alertsSender";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// POST /api/admin/alerts/send-now — manually trigger a full sending pass
// immediately (same matching/digest logic as agent/alerts-sender.js),
// instead of waiting for the next Railway cron run. Useful for testing or
// pushing an urgent offer out right away.
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    const result = await runAlertsSenderOnce(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur inconnue" }, { status: 500 });
  } finally {
    await client.close();
  }
}

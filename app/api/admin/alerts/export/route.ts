import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ALERT_SUBSCRIBERS_COLLECTION } from "@/lib/alerts";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/admin/alerts/export — full CSV export of subscribers (real
// emails, not masked — this is an authenticated admin-only download, not
// the list view, so unmasked is appropriate here).
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const subscribers = client.db("interactjob").collection(ALERT_SUBSCRIBERS_COLLECTION);
    const rows = await subscribers.find({}).sort({ created_at: -1 }).toArray();

    const header = ["email", "alert_type", "secteur", "ville", "keywords", "status", "confirmed", "created_at", "emails_sent_count", "last_email_sent_at"];
    const lines = [header.join(",")];

    for (const s of rows) {
      lines.push([
        csvEscape(s.email),
        csvEscape(s.alert_type),
        csvEscape(s.filters?.secteur || ""),
        csvEscape(s.filters?.ville || ""),
        csvEscape((s.filters?.keywords || []).join("; ")),
        csvEscape(s.status),
        csvEscape(s.confirmed),
        csvEscape(s.created_at?.toISOString?.() || s.created_at),
        csvEscape(s.emails_sent_count || 0),
        csvEscape(s.last_email_sent_at?.toISOString?.() || s.last_email_sent_at || ""),
      ].join(","));
    }

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="alertes-abonnes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } finally {
    await client.close();
  }
}

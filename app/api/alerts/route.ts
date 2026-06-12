import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { sendEmail } from "@/lib/mailer";

/**
 * POST /api/alerts — subscribe to job alerts by email.
 * Body: { email: string, city?: string, sector?: string, keyword?: string }
 * Stores in "job_alerts" collection (upsert by email+criteria) and sends a confirmation.
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  let body: { email?: string; city?: string; sector?: string; keyword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const email = String(body.email || "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const city = String(body.city || "").trim().slice(0, 60);
  const sector = String(body.sector || "").trim().slice(0, 60);
  const keyword = String(body.keyword || "").trim().slice(0, 100);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    await db.collection("job_alerts").updateOne(
      { email, city, sector, keyword },
      {
        $setOnInsert: { email, city, sector, keyword, created_at: new Date(), active: true },
        $set: { updated_at: new Date() },
      },
      { upsert: true }
    );

    const criteria = [keyword, sector, city].filter(Boolean).join(" · ") || "Toutes les offres";
    sendEmail({
      to: email,
      subject: "🔔 Alerte emploi activée — InteractJob.ma",
      text: `Bonjour,

Votre alerte emploi est activée sur InteractJob.ma :

📌 Critères : ${criteria}

Vous recevrez les nouvelles offres correspondantes par email.

En attendant, consultez les offres du moment :
👉 https://www.interactjob.ma/offres

Rejoignez aussi notre chaîne WhatsApp pour les alertes quotidiennes :
📲 https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j

L'équipe InteractJob.ma
Pour vous désinscrire : https://www.interactjob.ma/api/unsubscribe?email=${encodeURIComponent(email)}`,
    }).catch((e) => console.error("alerts: confirmation email failed:", e));

    return NextResponse.json({ ok: true });
  } finally {
    await client.close();
  }
}

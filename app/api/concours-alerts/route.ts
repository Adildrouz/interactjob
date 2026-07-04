import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { sendEmail } from "@/lib/mailer";

/**
 * POST /api/concours-alerts — subscribe to public-sector concours alerts by email.
 * Body: { email: string, sector?: string }
 * Stores in "concours_alerts" collection (upsert by email+sector) and sends a confirmation.
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  let body: { email?: string; sector?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const email = String(body.email || "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const sector = String(body.sector || "").trim().slice(0, 60);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    await db.collection("concours_alerts").updateOne(
      { email, sector },
      {
        $setOnInsert: { email, sector, created_at: new Date(), active: true },
        $set: { updated_at: new Date() },
      },
      { upsert: true }
    );

    const criteria = sector || "Tous les concours";
    sendEmail({
      to: email,
      subject: "🔔 Alerte concours activée — InteractJob.ma",
      text: `Bonjour,

Votre alerte concours de la fonction publique est activée sur InteractJob.ma :

📌 Secteur : ${criteria}

Vous recevrez les nouveaux concours correspondants par email.

En attendant, consultez les concours du moment :
👉 https://www.interactjob.ma/concours

Pendant que vous préparez votre candidature, pensez à vérifier votre CV gratuitement :
👉 https://www.interactjob.ma/cv-checker

L'équipe InteractJob.ma
Pour vous désinscrire : https://www.interactjob.ma/api/unsubscribe?email=${encodeURIComponent(email)}`,
    }).catch((e) => console.error("concours-alerts: confirmation email failed:", e));

    return NextResponse.json({ ok: true });
  } finally {
    await client.close();
  }
}

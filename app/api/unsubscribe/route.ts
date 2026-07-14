import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import crypto from "crypto";
import { ALERT_SUBSCRIBERS_COLLECTION } from "@/lib/alerts";
import { trackServerEvent } from "@/lib/trackServerEvent";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  if (!email || !email.includes("@")) {
    return new NextResponse("Email invalide.", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return new NextResponse("Erreur serveur.", { status: 500 });

  const normalizedEmail = email.toLowerCase();

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    // This link is sent in the new unified alert_subscribers emails, the
    // legacy job_alerts/concours_alerts emails (kept updated until fully
    // migrated), and employer marketing emails alike — unsubscribe
    // everywhere the address could be subscribed, not just one collection.
    // A single email can have several docs (one per distinct criteria
    // combo), hence updateMany.
    await Promise.all([
      db.collection(ALERT_SUBSCRIBERS_COLLECTION).updateMany(
        { email: normalizedEmail },
        { $set: { status: "unsubscribed", unsubscribed_at: new Date() } }
      ),
      db.collection("job_alerts").updateMany(
        { email: normalizedEmail },
        { $set: { active: false, unsubscribed_at: new Date() } }
      ),
      db.collection("concours_alerts").updateMany(
        { email: normalizedEmail },
        { $set: { active: false, unsubscribed_at: new Date() } }
      ),
      db.collection("employers").updateOne(
        { email: normalizedEmail },
        { $set: { status: "unsubscribed" } }
      ),
    ]);

    // Pseudonymous id — never store the raw email in tool_events.
    const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 24);
    await trackServerEvent("email_alerts", "alert_unsubscribed", { subscriberId: emailHash });

    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2>Désinscription confirmée</h2>
      <p>L'adresse <strong>${email}</strong> ne recevra plus d'emails d'InteractJob.ma.</p>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } finally {
    await client.close();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ALERT_SUBSCRIBERS_COLLECTION } from "@/lib/alerts";
import { trackServerEvent } from "@/lib/trackServerEvent";

function page(title: string, message: string, ok: boolean) {
  return `<!DOCTYPE html><html lang="fr"><body style="font-family:Arial,sans-serif;padding:40px;text-align:center;background:#F0F8FF;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #D0E4F0;">
      <h2 style="color:${ok ? "#00347A" : "#DC2626"};margin-top:0;">${title}</h2>
      <p style="color:#374151;">${message}</p>
      <a href="https://www.interactjob.ma" style="display:inline-block;margin-top:16px;background:#00C2CB;color:#fff;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;">Retour au site</a>
    </div>
  </body></html>`;
}

// GET /api/alerts/confirm?email=...&token=... — double opt-in confirmation link.
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase().trim();
  const token = req.nextUrl.searchParams.get("token") || "";

  if (!email || !token) {
    return new NextResponse(page("Lien invalide", "Ce lien de confirmation est incomplet.", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return new NextResponse(page("Erreur serveur", "Réessayez plus tard.", false), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db("interactjob").collection(ALERT_SUBSCRIBERS_COLLECTION);

    const result = await col.findOneAndUpdate(
      { email, confirm_token: token },
      { $set: { confirmed: true, confirmed_at: new Date(), confirm_token: null } }
    );

    if (!result) {
      return new NextResponse(
        page("Lien invalide ou déjà utilisé", "Cette alerte est peut-être déjà confirmée, ou le lien a expiré.", false),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const subscriberId = (result as { _id?: { toString(): string } })._id?.toString();
    const sourcePage = (result as { source_page?: string }).source_page;
    await trackServerEvent("email_alerts", "alert_confirmed", { subscriberId, metadata: { alert_type: (result as { alert_type?: string }).alert_type } });
    if (sourcePage === "application_form" || sourcePage === "spontaneous_application") {
      await trackServerEvent("email_alerts", "alert_optin_confirmed", { subscriberId, metadata: { source_page: sourcePage } });
    }

    return new NextResponse(
      page("✅ Alerte confirmée !", `L'adresse <strong>${email}</strong> recevra désormais les nouvelles offres correspondant à vos critères.`, true),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } finally {
    await client.close();
  }
}

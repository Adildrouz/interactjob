import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// Deliberately Adil's own inbox, not the generic contact@ alias — this
// button exists specifically to verify the alerts system reaches him.
const TEST_RECIPIENT = "adil.drouz@gmail.com";
const NAVY = "#00347A";
const TURQUOISE = "#00C2CB";

// POST /api/admin/alerts/test-send — send a single branded test email to
// verify SMTP credentials + template rendering are working end to end.
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const now = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" });
  const subject = "🧪 Test — Système d'alertes InteractJob.ma";
  const text = `Ceci est un email de test envoyé depuis le dashboard admin (${now}).\n\nSi vous recevez ce message, le système d'envoi d'alertes (SMTP, template, dashboard) fonctionne correctement.`;
  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#F0F8FF;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">
    <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
      <span style="color:#fff;font-size:20px;font-weight:800;">InteractJob<span style="color:${TURQUOISE};">.ma</span></span>
    </div>
    <div style="background:#fff;border:1px solid #D0E4F0;border-top:none;border-radius:0 0 16px 16px;padding:28px;">
      <p style="font-size:15px;color:#1F2937;margin:0 0 8px;">🧪 Email de test</p>
      <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
        Envoyé depuis le dashboard <strong>Alertes Email</strong> le ${now}.<br>
        Si vous recevez ce message, le système d'envoi (SMTP, template, tracking) fonctionne correctement.
      </p>
    </div>
  </div>
</body></html>`;

  try {
    await sendEmail({ to: TEST_RECIPIENT, subject, text, html });
    return NextResponse.json({ ok: true, to: TEST_RECIPIENT });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Échec de l'envoi" }, { status: 500 });
  }
}

import crypto from "crypto";
import type { AlertFilters, AlertType } from "@/types/alerts";

export const ALERT_SUBSCRIBERS_COLLECTION = "alert_subscribers";
export const ALERT_EMAIL_LOGS_COLLECTION = "alert_email_logs";

const BASE_URL = "https://www.interactjob.ma";
const NAVY = "#00347A";
const TURQUOISE = "#00C2CB";

export function generateConfirmToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function describeFilters(alertType: AlertType, filters: AlertFilters): string {
  if (alertType === "concours") return filters.secteur || "Tous les concours";
  const parts = [...(filters.keywords || []), filters.secteur, filters.ville].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Toutes les offres";
}

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#F0F8FF;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
      <span style="color:#fff;font-size:20px;font-weight:800;">InteractJob<span style="color:${TURQUOISE};">.ma</span></span>
    </div>
    <div style="background:#fff;border:1px solid #D0E4F0;border-top:none;border-radius:0 0 16px 16px;padding:28px;">
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:16px;">
      InteractJob.ma — La plateforme d'emploi #1 au Maroc
    </p>
  </div>
</body>
</html>`;
}

export function buildConfirmationEmail(opts: {
  alertType: AlertType;
  criteria: string;
  confirmUrl: string;
  unsubscribeUrl: string;
  contextNote?: string;
}): { subject: string; text: string; html: string } {
  const { alertType, criteria, confirmUrl, unsubscribeUrl, contextNote } = opts;
  const label = alertType === "concours" ? "concours de la fonction publique" : alertType === "remote" ? "offres remote" : "offres d'emploi";
  const intro = contextNote || `Une dernière étape pour activer votre alerte ${label} sur InteractJob.ma :`;

  const subject = "Confirmez votre alerte emploi — InteractJob.ma";

  const text = `Bonjour,

${intro}

📌 Critères : ${criteria}

Confirmez votre adresse en cliquant sur ce lien :
${confirmUrl}

Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email — aucune alerte ne sera envoyée sans confirmation.

L'équipe InteractJob.ma
Se désinscrire : ${unsubscribeUrl}`;

  const html = emailShell(`
    <p style="font-size:15px;color:#1F2937;margin:0 0 16px;">Bonjour,</p>
    <p style="font-size:15px;color:#1F2937;line-height:1.6;margin:0 0 20px;">
      ${intro}
    </p>
    <div style="background:#F0F8FF;border-radius:10px;padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:${NAVY};font-weight:700;">📌 Critères</p>
      <p style="margin:4px 0 0;font-size:14px;color:#374151;">${criteria}</p>
    </div>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${confirmUrl}" style="display:inline-block;background:${TURQUOISE};color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
        ✅ Confirmer mon alerte
      </a>
    </div>
    <p style="font-size:12px;color:#9CA3AF;line-height:1.5;margin:0;">
      Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email — aucune alerte ne sera envoyée sans confirmation.
    </p>
  `);

  return { subject, text, html };
}

export function unsubscribeUrl(email: string, token?: string | null): string {
  const params = new URLSearchParams({ email });
  if (token) params.set("token", token);
  return `${BASE_URL}/api/unsubscribe?${params.toString()}`;
}

export function confirmUrl(email: string, token: string): string {
  return `${BASE_URL}/api/alerts/confirm?${new URLSearchParams({ email, token }).toString()}`;
}

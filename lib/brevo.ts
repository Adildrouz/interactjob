/**
 * Brevo (Sendinblue) integration — contact sync + weekly campaigns
 *
 * List IDs are created once manually in the Brevo dashboard, then stored
 * as env vars: BREVO_LIST_CANDIDATS_ID and BREVO_LIST_EMPLOYEURS_ID
 */

const BREVO_API_URL = "https://api.brevo.com/v3";
const SITE_URL = "https://www.interactjob.ma";

function headers() {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY is not set");
  return {
    "api-key": key,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function brevoPost(path: string, body: object) {
  const res = await fetch(`${BREVO_API_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Brevo ${path} → ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Contact management ────────────────────────────────────────────────────────

export async function addCandidateToBrevo(
  email: string,
  firstName: string,
  lastName: string,
  city?: string,
  position?: string
) {
  const listId = parseInt(process.env.BREVO_LIST_CANDIDATS_ID || "0");
  if (!listId) {
    console.warn("[brevo] BREVO_LIST_CANDIDATS_ID not set — skipping");
    return;
  }
  try {
    await brevoPost("/contacts", {
      email,
      attributes: {
        PRENOM: firstName,
        NOM: lastName,
        VILLE: city || "",
        POSTE: position || "",
        SOURCE: "candidature-form",
      },
      listIds: [listId],
      updateEnabled: true,
    });
    console.log(`[brevo] ✓ Candidat ajouté: ${email}`);
  } catch (e) {
    console.error("[brevo] Erreur ajout candidat:", (e as Error).message);
  }
}

export async function addEmployerToBrevo(
  email: string,
  company: string,
  jobTitle?: string
) {
  const listId = parseInt(process.env.BREVO_LIST_EMPLOYEURS_ID || "0");
  if (!listId) {
    console.warn("[brevo] BREVO_LIST_EMPLOYEURS_ID not set — skipping");
    return;
  }
  try {
    await brevoPost("/contacts", {
      email,
      attributes: {
        SOCIETE: company,
        POSTE_PUBLIE: jobTitle || "",
        SOURCE: "publication-offre",
      },
      listIds: [listId],
      updateEnabled: true,
    });
    console.log(`[brevo] ✓ Employeur ajouté: ${email}`);
  } catch (e) {
    console.error("[brevo] Erreur ajout employeur:", (e as Error).message);
  }
}

// ── HTML templates ────────────────────────────────────────────────────────────

export interface JobSummary {
  title: string;
  company: string;
  city: string;
  contractType: string;
  slug: string;
}

function formatJobsHtml(jobs: JobSummary[]): string {
  const rows = jobs
    .map(
      (j) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">` +
        `<a href="${SITE_URL}/offres/${j.slug}" style="font-weight:600;color:#2563EB;text-decoration:none;">${j.title}</a><br/>` +
        `<span style="color:#6b7280;font-size:14px;">${j.company} · ${j.city} · ${j.contractType}</span>` +
        `</td></tr>`
    )
    .join("");

  const upsell =
    `<div style="border-top:2px solid #f1f5f9;margin:32px 0;"></div>` +
    `<div style="text-align:center;margin-bottom:20px;">` +
    `<p style="font-size:16px;font-weight:600;color:#1e293b;margin:0;">Vous avez trouvé une offre qui vous intéresse ?</p>` +
    `<p style="color:#6b7280;font-size:14px;margin:6px 0 0;">Postuler c'est bien. Postuler avec un dossier solide, c'est décrocher l'entretien.</p>` +
    `</div>` +

    // CV Checker (gratuit) + CV Builder (5 €)
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px;"><tr>` +
    `<td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:10px;padding:20px;">` +
    `<table width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td style="width:48px;vertical-align:top;padding-right:14px;">` +
    `<div style="background:rgba(255,255,255,0.15);border-radius:8px;width:44px;height:44px;text-align:center;line-height:44px;font-size:22px;">📄</div></td>` +
    `<td style="vertical-align:top;">` +
    `<p style="color:#fff;font-weight:700;font-size:16px;margin:0 0 4px;">Votre CV passe-t-il les filtres ATS ?</p>` +
    `<p style="color:#bfdbfe;font-size:13px;margin:0 0 6px;line-height:1.5;">70 % des CV sont éliminés automatiquement avant qu'un humain les lise. Analysez votre CV en 30 secondes et obtenez votre score ATS — <strong style="color:#fff;">100 % gratuit.</strong></p>` +
    `<p style="color:#bfdbfe;font-size:13px;margin:0 0 12px;line-height:1.5;">Vous voulez aller plus loin ? Notre <strong style="color:#fff;">générateur de CV IA</strong> crée votre CV professionnel, votre lettre de motivation et votre email de candidature en quelques minutes — à partir de <strong style="color:#fff;">5 €.</strong></p>` +
    `<a href="${SITE_URL}/cv-checker" style="background:#fff;color:#1e40af;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;margin-right:8px;">Tester mon CV →</a>` +
    `<a href="${SITE_URL}/cv-builder" style="background:rgba(255,255,255,0.15);color:#fff;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;border:1px solid rgba(255,255,255,0.4);">Générer mon CV (5 €) →</a>` +
    `</td></tr></table></td></tr></table>` +

    // Personality test (gratuit) + rapport premium (4,99 $)
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;"><tr>` +
    `<td style="background:linear-gradient(135deg,#065f46,#10b981);border-radius:10px;padding:20px;">` +
    `<table width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td style="width:48px;vertical-align:top;padding-right:14px;">` +
    `<div style="background:rgba(255,255,255,0.15);border-radius:8px;width:44px;height:44px;text-align:center;line-height:44px;font-size:22px;">🧠</div></td>` +
    `<td style="vertical-align:top;">` +
    `<p style="color:#fff;font-weight:700;font-size:16px;margin:0 0 4px;">Préparez votre entretien avec confiance</p>` +
    `<p style="color:#a7f3d0;font-size:13px;margin:0 0 6px;line-height:1.5;">"Parlez-moi de vous." Cette question fait trébucher 80 % des candidats. Passez notre test de personnalité — le résultat de base est <strong style="color:#fff;">entièrement gratuit.</strong></p>` +
    `<p style="color:#a7f3d0;font-size:13px;margin:0 0 12px;line-height:1.5;">Pour aller plus loin, le <strong style="color:#fff;">rapport IA premium</strong> vous donne 18 sections détaillées : forces, gestion du stress, style de communication, conseils entretien au Maroc — à <strong style="color:#fff;">4,99 $</strong> seulement.</p>` +
    `<a href="${SITE_URL}/personality" style="background:#fff;color:#065f46;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;margin-right:8px;">Faire le test gratuit →</a>` +
    `<a href="${SITE_URL}/personality" style="background:rgba(255,255,255,0.15);color:#fff;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;border:1px solid rgba(255,255,255,0.4);">Rapport premium (4,99 $) →</a>` +
    `</td></tr></table></td></tr></table>`;

  return (
    `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"/></head>` +
    `<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111;">` +
    `<div style="text-align:center;margin-bottom:24px;">` +
    `<h1 style="font-size:22px;margin:0;color:#1e293b;">🗓 Les offres de la semaine</h1>` +
    `<p style="color:#6b7280;margin:8px 0 0;">${jobs.length} nouvelles opportunités publiées cette semaine</p>` +
    `</div>` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>` +
    `<div style="text-align:center;margin:24px 0;">` +
    `<a href="${SITE_URL}/offres" style="background:#2563EB;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Voir toutes les offres →</a>` +
    `</div>` +
    upsell +
    `<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">` +
    `Vous recevez cet email car vous avez postulé sur InteractJob.ma.<br/>` +
    `<a href="{{unsubscribe}}" style="color:#9ca3af;">Se désabonner</a></p>` +
    `</body></html>`
  );
}

function formatSponsorPromoHtml(): string {
  return (
    `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"/></head>` +
    `<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111;">` +

    `<div style="text-align:center;margin-bottom:28px;">` +
    `<h1 style="font-size:22px;margin:0;color:#1e293b;">🚀 Boostez la visibilité de votre offre</h1>` +
    `<p style="color:#6b7280;margin:10px 0 0;font-size:15px;">Passez en <strong>Annonce Sponsorisée</strong> pour placer votre offre en tête de liste et toucher plus de candidats qualifiés.</p>` +
    `</div>` +

    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">` +
    `<tr><td style="padding:14px;background:#eff6ff;border-radius:8px;"><strong style="color:#1e40af;">📌 Position prioritaire</strong><br/><span style="color:#374151;font-size:14px;">Votre annonce apparaît en tête des résultats, avant toutes les offres gratuites.</span></td></tr>` +
    `<tr><td style="height:8px;"></td></tr>` +
    `<tr><td style="padding:14px;background:#f0fdf4;border-radius:8px;"><strong style="color:#065f46;">👁️ Badge "Sponsorisé"</strong><br/><span style="color:#374151;font-size:14px;">Un badge visuel distinctif qui attire l'œil et augmente le taux de clics.</span></td></tr>` +
    `<tr><td style="height:8px;"></td></tr>` +
    `<tr><td style="padding:14px;background:#fefce8;border-radius:8px;"><strong style="color:#854d0e;">📣 Diffusion sur nos réseaux</strong><br/><span style="color:#374151;font-size:14px;">Votre offre est mise en avant sur LinkedIn, WhatsApp et X en priorité.</span></td></tr>` +
    `<tr><td style="height:8px;"></td></tr>` +
    `<tr><td style="padding:14px;background:#fdf4ff;border-radius:8px;"><strong style="color:#6b21a8;">⏳ Durée prolongée</strong><br/><span style="color:#374151;font-size:14px;">30 jours de visibilité garantis contre 15 jours pour une offre standard.</span></td></tr>` +
    `</table>` +

    `<div style="background:#1e293b;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">` +
    `<div style="background:#dc2626;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:12px;letter-spacing:1px;">🔥 OFFRE DE LANCEMENT — JUSQU'AU 22 JUIN</div>` +
    `<p style="color:#94a3b8;margin:0 0 4px;font-size:13px;text-decoration:line-through;">Prix normal : 89 € (990 MAD)</p>` +
    `<p style="color:#fff;font-size:40px;font-weight:700;margin:0;">49 € <span style="font-size:16px;color:#94a3b8;">≈ 544 MAD / annonce · 45 jours</span></p>` +
    `<p style="color:#94a3b8;font-size:13px;margin:8px 0 20px;">Paiement sécurisé via PayPal · Activation immédiate</p>` +
    `<a href="${SITE_URL}/publier" style="background:#2563EB;color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">Sponsoriser mon annonce →</a>` +
    `</div>` +

    `<div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #2563EB;">` +
    `<p style="margin:0;font-style:italic;color:#374151;font-size:14px;">"Notre offre sponsorisée a reçu 3× plus de candidatures en une semaine."</p>` +
    `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">— Recruteur RH, Casablanca</p>` +
    `</div>` +

    `<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:32px;">` +
    `Vous recevez cet email car vous avez publié une offre sur InteractJob.ma.<br/>` +
    `<a href="{{unsubscribe}}" style="color:#9ca3af;">Se désabonner</a></p>` +
    `</body></html>`
  );
}

// ── Weekly campaign senders ───────────────────────────────────────────────────

export async function sendWeeklyCandidatesNewsletter(jobs: JobSummary[]) {
  const listId = parseInt(process.env.BREVO_LIST_CANDIDATS_ID || "0");
  if (!listId) throw new Error("BREVO_LIST_CANDIDATS_ID not set");
  if (jobs.length === 0) {
    console.log("[brevo] Aucune offre cette semaine — newsletter candidats ignorée");
    return;
  }

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

  const campaign = await brevoPost("/emailCampaigns", {
    name: `Newsletter Candidats — ${now.toISOString().slice(0, 10)}`,
    subject: `🗓 ${jobs.length} nouvelles offres d'emploi cette semaine`,
    sender: { name: "InteractJob.ma", email: "contact@interactjob.ma" },
    recipients: { listIds: [listId] },
    htmlContent: formatJobsHtml(jobs),
    scheduledAt,
  });

  console.log(`[brevo] ✓ Newsletter candidats programmée: campaign #${(campaign as { id?: number })?.id}`);
  return campaign;
}

export async function sendWeeklyEmployersNewsletter() {
  const listId = parseInt(process.env.BREVO_LIST_EMPLOYEURS_ID || "0");
  if (!listId) throw new Error("BREVO_LIST_EMPLOYEURS_ID not set");

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

  const campaign = await brevoPost("/emailCampaigns", {
    name: `Promo Annonce Sponsorisée — ${now.toISOString().slice(0, 10)}`,
    subject: `🚀 Boostez votre offre et recrutez plus vite`,
    sender: { name: "InteractJob.ma", email: "contact@interactjob.ma" },
    recipients: { listIds: [listId] },
    htmlContent: formatSponsorPromoHtml(),
    scheduledAt,
  });

  console.log(`[brevo] ✓ Email promo sponsorisé programmé: campaign #${(campaign as { id?: number })?.id}`);
  return campaign;
}

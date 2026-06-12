/**
 * Weekly Brevo newsletter — every Monday at 10:30 Casablanca
 * - Candidats : new jobs published in the last 7 days
 * - Employeurs : new candidates added to the pool in the last 7 days
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { MongoClient } from 'mongodb';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname, '../data/jobs.json');
const BREVO_API_URL = 'https://api.brevo.com/v3';
const SITE_URL = 'https://www.interactjob.ma';

function brevoHeaders() {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not set');
  return {
    'api-key': key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function brevoPost(endpoint, body) {
  const res = await fetch(`${BREVO_API_URL}${endpoint}`, {
    method: 'POST',
    headers: brevoHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Brevo ${endpoint} → ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Fetch new jobs from the last 7 days ───────────────────────────────────────
function getRecentJobs() {
  const jobs = fs.readJsonSync(JOBS_PATH, { throws: false }) || [];
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return jobs
    .filter(j => !j.expired && j.date_posted >= since)
    .slice(0, 20) // cap at 20 in the email
    .map(j => ({
      title: j.title,
      company: j.company,
      city: j.city,
      contractType: j.contractType || j.contract_type || 'CDI',
      slug: j.slug || j.id,
    }));
}

// ── HTML templates ────────────────────────────────────────────────────────────
function jobsHtml(jobs) {
  const rows = jobs.map(j => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <a href="${SITE_URL}/offres/${j.slug}"
           style="font-weight:600;color:#2563EB;text-decoration:none;">${j.title}</a><br/>
        <span style="color:#6b7280;font-size:14px;">${j.company} · ${j.city} · ${j.contractType}</span>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:22px;margin:0;color:#1e293b;">🗓 Les offres de la semaine</h1>
    <p style="color:#6b7280;margin:8px 0 0;">${jobs.length} nouvelles opportunités publiées cette semaine sur InteractJob.ma</p>
  </div>

  <!-- Job list -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>

  <div style="text-align:center;margin:24px 0;">
    <a href="${SITE_URL}/offres"
       style="background:#2563EB;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
      Voir toutes les offres →
    </a>
  </div>

  <!-- Divider -->
  <div style="border-top:2px solid #f1f5f9;margin:32px 0;"></div>

  <!-- Upsell section -->
  <div style="text-align:center;margin-bottom:20px;">
    <p style="font-size:16px;font-weight:600;color:#1e293b;margin:0;">Vous avez trouvé une offre qui vous intéresse ?</p>
    <p style="color:#6b7280;font-size:14px;margin:6px 0 0;">
      Postuler c'est bien. Postuler avec un dossier solide, c'est décrocher l'entretien.
    </p>
  </div>

  <!-- CV Checker (gratuit) -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px;">
    <tr>
      <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:10px;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:48px;vertical-align:top;padding-right:14px;">
              <div style="background:rgba(255,255,255,0.15);border-radius:8px;width:44px;height:44px;text-align:center;line-height:44px;font-size:22px;">📄</div>
            </td>
            <td style="vertical-align:top;">
              <p style="color:#fff;font-weight:700;font-size:16px;margin:0 0 4px;">Votre CV passe-t-il les filtres ATS ?</p>
              <p style="color:#bfdbfe;font-size:13px;margin:0 0 6px;line-height:1.5;">
                70 % des CV sont éliminés automatiquement avant qu'un humain les lise.
                Analysez votre CV en 30 secondes et obtenez votre score ATS — <strong style="color:#fff;">100 % gratuit.</strong>
              </p>
              <p style="color:#bfdbfe;font-size:13px;margin:0 0 12px;line-height:1.5;">
                Vous voulez aller plus loin ? Notre <strong style="color:#fff;">générateur de CV IA</strong> crée votre CV professionnel,
                votre lettre de motivation et votre email de candidature en quelques minutes — à partir de 5 €.
              </p>
              <a href="${SITE_URL}/cv-checker"
                 style="background:#fff;color:#1e40af;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;margin-right:8px;">
                Tester mon CV →
              </a>
              <a href="${SITE_URL}/cv-builder"
                 style="background:rgba(255,255,255,0.15);color:#fff;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;border:1px solid rgba(255,255,255,0.4);">
                Générer mon CV (5 €) →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Personality test card -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
    <tr>
      <td style="background:linear-gradient(135deg,#065f46,#10b981);border-radius:10px;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:48px;vertical-align:top;padding-right:14px;">
              <div style="background:rgba(255,255,255,0.15);border-radius:8px;width:44px;height:44px;text-align:center;line-height:44px;font-size:22px;">🧠</div>
            </td>
            <td style="vertical-align:top;">
              <p style="color:#fff;font-weight:700;font-size:16px;margin:0 0 4px;">Préparez votre entretien avec confiance</p>
              <p style="color:#a7f3d0;font-size:13px;margin:0 0 6px;line-height:1.5;">
                "Parlez-moi de vous." Cette question fait trébucher 80 % des candidats.
                Passez notre test de personnalité — le résultat de base est <strong style="color:#fff;">entièrement gratuit.</strong>
              </p>
              <p style="color:#a7f3d0;font-size:13px;margin:0 0 12px;line-height:1.5;">
                Pour aller plus loin, le <strong style="color:#fff;">rapport IA premium</strong> vous donne 18 sections détaillées :
                forces, gestion du stress, style de communication, conseils entretien au Maroc — à <strong style="color:#fff;">4,99 $</strong> seulement.
              </p>
              <a href="${SITE_URL}/personality"
                 style="background:#fff;color:#065f46;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;margin-right:8px;">
                Faire le test gratuit →
              </a>
              <a href="${SITE_URL}/personality"
                 style="background:rgba(255,255,255,0.15);color:#fff;padding:8px 18px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;border:1px solid rgba(255,255,255,0.4);">
                Rapport premium (4,99 $) →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
    Vous recevez cet email car vous avez postulé sur InteractJob.ma.<br/>
    <a href="{{unsubscribe}}" style="color:#9ca3af;">Se désabonner</a>
  </p>
</body>
</html>`;
}

function sponsorPromoHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111;">

  <div style="text-align:center;margin-bottom:28px;">
    <h1 style="font-size:22px;margin:0;color:#1e293b;">🚀 Boostez la visibilité de votre offre</h1>
    <p style="color:#6b7280;margin:10px 0 0;font-size:15px;">
      Votre offre est en ligne sur InteractJob.ma — passez en <strong>Annonce Sponsorisée</strong>
      pour la placer en tête de liste et toucher plus de candidats qualifiés.
    </p>
  </div>

  <!-- Benefits -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
    <tr>
      <td style="padding:14px;background:#eff6ff;border-radius:8px;margin-bottom:8px;display:block;">
        <span style="font-size:20px;">📌</span>
        <strong style="color:#1e40af;"> Position prioritaire</strong><br/>
        <span style="color:#374151;font-size:14px;">Votre annonce apparaît en tête des résultats, avant toutes les offres gratuites.</span>
      </td>
    </tr>
    <tr><td style="height:8px;"></td></tr>
    <tr>
      <td style="padding:14px;background:#f0fdf4;border-radius:8px;display:block;">
        <span style="font-size:20px;">👁️</span>
        <strong style="color:#065f46;"> Badge "Sponsorisé"</strong><br/>
        <span style="color:#374151;font-size:14px;">Un badge visuel distinctif qui attire l'œil et augmente le taux de clics.</span>
      </td>
    </tr>
    <tr><td style="height:8px;"></td></tr>
    <tr>
      <td style="padding:14px;background:#fefce8;border-radius:8px;display:block;">
        <span style="font-size:20px;">📣</span>
        <strong style="color:#854d0e;"> Diffusion sur nos réseaux</strong><br/>
        <span style="color:#374151;font-size:14px;">Votre offre est mise en avant sur LinkedIn, WhatsApp et X (Twitter) en priorité.</span>
      </td>
    </tr>
    <tr><td style="height:8px;"></td></tr>
    <tr>
      <td style="padding:14px;background:#fdf4ff;border-radius:8px;display:block;">
        <span style="font-size:20px;">⏳</span>
        <strong style="color:#6b21a8;"> Durée prolongée</strong><br/>
        <span style="color:#374151;font-size:14px;">30 jours de visibilité garantis contre 15 jours pour une offre standard.</span>
      </td>
    </tr>
  </table>

  <!-- Price + CTA -->
  <div style="background:#1e293b;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
    <div style="background:#dc2626;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:12px;letter-spacing:1px;">
      🔥 OFFRE DE LANCEMENT — JUSQU'AU 22 JUIN
    </div>
    <p style="color:#94a3b8;margin:0 0 4px;font-size:13px;text-decoration:line-through;">Prix normal : 89 € (990 MAD)</p>
    <p style="color:#fff;font-size:40px;font-weight:700;margin:0;">49 € <span style="font-size:16px;color:#94a3b8;">≈ 544 MAD / annonce · 45 jours</span></p>
    <p style="color:#94a3b8;font-size:13px;margin:8px 0 20px;">Paiement sécurisé via PayPal · Activation immédiate</p>
    <a href="${SITE_URL}/publier"
       style="background:#2563EB;color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
      Sponsoriser mon annonce →
    </a>
  </div>

  <!-- Social proof -->
  <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #2563EB;">
    <p style="margin:0;font-style:italic;color:#374151;font-size:14px;">
      "Notre offre sponsorisée a reçu 3× plus de candidatures en une semaine."
    </p>
    <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">— Recruteur RH, Casablanca</p>
  </div>

  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:32px;">
    Vous recevez cet email car vous avez publié une offre sur InteractJob.ma.<br/>
    <a href="{{unsubscribe}}" style="color:#9ca3af;">Se désabonner</a>
  </p>
</body>
</html>`;
}

// ── Sync MongoDB candidates → Brevo list (runs before campaign send) ─────────
async function syncCandidatesToBrevo() {
  const uri     = process.env.MONGODB_URI;
  const listId  = parseInt(process.env.BREVO_LIST_CANDIDATS_ID || '0');
  if (!uri || !listId) { log('[brevo] sync: MONGODB_URI ou BREVO_LIST_CANDIDATS_ID manquant — ignoré'); return; }

  const client = new MongoClient(uri);
  let candidates = [];
  try {
    await client.connect();
    // Only sync candidates not yet in Brevo (track with brevo_synced_at field)
    candidates = await client.db('interactjob').collection('candidates')
      .find({ email: { $regex: '@' }, brevo_synced_at: { $exists: false } })
      .project({ email: 1, firstName: 1, lastName: 1, city: 1, position: 1 })
      .toArray();
  } finally { await client.close(); }

  if (!candidates.length) { log('[brevo] sync: aucun nouveau candidat à synchroniser'); return; }
  log(`[brevo] sync: ${candidates.length} candidat(s) à ajouter à Brevo`);

  let ok = 0;
  const toStamp = [];
  for (const c of candidates) {
    try {
      const res = await fetch(`${BREVO_API_URL}/contacts`, {
        method: 'POST',
        headers: brevoHeaders(),
        body: JSON.stringify({
          email: c.email,
          attributes: {
            PRENOM: c.firstName || '',
            NOM:    c.lastName  || '',
            VILLE:  c.city      || '',
            POSTE:  c.position  || '',
          },
          listIds: [listId],
          updateEnabled: true,
        }),
      });
      if (res.ok || res.status === 204 || res.status === 400) {
        toStamp.push(c._id);
        ok++;
      }
      await new Promise(r => setTimeout(r, 110)); // Brevo 10 req/s limit
    } catch (e) { log(`[brevo] sync: erreur ${c.email} — ${e.message}`); }
  }

  // Mark synced to avoid re-processing
  if (toStamp.length) {
    const client2 = new MongoClient(uri);
    try {
      await client2.connect();
      await client2.db('interactjob').collection('candidates').updateMany(
        { _id: { $in: toStamp } },
        { $set: { brevo_synced_at: new Date() } }
      );
    } finally { await client2.close(); }
  }
  log(`[brevo] sync: ${ok}/${candidates.length} candidat(s) synchronisé(s)`);
}

// ── Send campaigns ────────────────────────────────────────────────────────────
async function sendCandidatesNewsletter(jobs) {
  const listId = parseInt(process.env.BREVO_LIST_CANDIDATS_ID || '0');
  if (!listId) { log('[brevo] BREVO_LIST_CANDIDATS_ID non défini — ignoré'); return; }
  if (jobs.length === 0) { log('[brevo] Aucune offre cette semaine — newsletter candidats ignorée'); return; }

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 2 * 60 * 1000).toISOString();
  const campaign = await brevoPost('/emailCampaigns', {
    name: `Newsletter Candidats — ${now.toISOString().slice(0, 10)}`,
    subject: `🗓 ${jobs.length} nouvelles offres d'emploi cette semaine`,
    sender: { name: 'InteractJob.ma', email: 'contact@interactjob.ma' },
    recipients: { listIds: [listId] },
    htmlContent: jobsHtml(jobs),
    scheduledAt,
  });
  log(`[brevo] ✓ Newsletter candidats programmée (campaign #${campaign?.id}) — ${jobs.length} offres`);
}

async function sendEmployersNewsletter() {
  const listId = parseInt(process.env.BREVO_LIST_EMPLOYEURS_ID || '0');
  if (!listId) { log('[brevo] BREVO_LIST_EMPLOYEURS_ID non défini — ignoré'); return; }

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 2 * 60 * 1000).toISOString();
  const campaign = await brevoPost('/emailCampaigns', {
    name: `Promo Annonce Sponsorisée — ${now.toISOString().slice(0, 10)}`,
    subject: `🚀 Boostez votre offre et recrutez plus vite`,
    sender: { name: 'InteractJob.ma', email: 'contact@interactjob.ma' },
    recipients: { listIds: [listId] },
    htmlContent: sponsorPromoHtml(),
    scheduledAt,
  });
  log(`[brevo] ✓ Email promo sponsorisé programmé (campaign #${campaign?.id})`);
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function runWeeklyNewsletter() {
  log('[brevo] Newsletter hebdomadaire: démarrage');
  try {
    // 1. Sync new MongoDB candidates to Brevo before sending campaign
    await syncCandidatesToBrevo();

    const jobs = getRecentJobs();
    log(`[brevo] ${jobs.length} offres cette semaine`);
    await sendCandidatesNewsletter(jobs);
    await sendEmployersNewsletter();
    log('[brevo] Newsletter hebdomadaire: terminée');
  } catch (err) {
    log(`[brevo] Newsletter hebdomadaire: ERREUR — ${err.message}`);
    throw err;
  }
}

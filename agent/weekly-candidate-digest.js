/**
 * Weekly candidate digest — every Monday at 09:30 Casablanca
 *
 * Sends a digest of the last 7 days' jobs to all candidates in MongoDB
 * who have a valid email address. Tracks last_newsletter_at to avoid
 * re-sending the same edition if the cron fires twice.
 *
 * Uses Gmail SMTP (same as the rest of the agent — no Brevo API needed).
 */

import { MongoClient } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './mailer.js';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH  = path.join(__dirname, '../data/jobs.json');
const SITE_URL   = 'https://www.interactjob.ma';
const MAX_JOBS   = 10;
const BATCH_DELAY_MS = 1500; // respect Gmail rate limits (~40/min on free accounts)

// ── Job selection ─────────────────────────────────────────────────────────────
function getRecentJobs() {
  try {
    const { readFileSync } = await import('fs');
    const jobs = JSON.parse(readFileSync(JOBS_PATH, 'utf-8'));
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return jobs
      .filter(j => !j.expired && (j.postedAt || j.date_posted || '') >= since)
      .sort((a, b) => {
        // Direct jobs first, then by date
        const aScore = (a.source === 'Direct' ? 1 : 0);
        const bScore = (b.source === 'Direct' ? 1 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return (b.postedAt || '') > (a.postedAt || '') ? 1 : -1;
      })
      .slice(0, MAX_JOBS);
  } catch { return []; }
}

// ── Email body ────────────────────────────────────────────────────────────────
function buildEmailHtml(candidate, jobs) {
  const firstName = candidate.firstName || 'Candidat';
  const week = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const jobRows = jobs.map(j => {
    const url    = `${SITE_URL}/offres/${j.slug || j.id}`;
    const salary = j.salary ? `<span style="color:#059669;font-size:12px;"> · 💰 ${j.salary}</span>` : '';
    const badge  = j.source === 'Direct'
      ? `<span style="background:#0A2D6E;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;margin-left:6px;">Direct</span>`
      : '';
    return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f0f4f8;">
        <a href="${url}" style="font-weight:600;color:#0A2D6E;text-decoration:none;font-size:15px;">${j.title}${badge}</a><br/>
        <span style="color:#64748b;font-size:13px;">${j.company} · ${j.city} · ${j.contractType || 'CDI'}${salary}</span><br/>
        <a href="${url}" style="color:#00BCD4;font-size:12px;text-decoration:none;margin-top:4px;display:inline-block;">Voir l'offre →</a>
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;">

  <!-- Header -->
  <tr>
    <td style="background:#0A2D6E;padding:24px 32px;">
      <span style="font-size:22px;font-weight:700;color:#fff;">Interact<span style="color:#00BCD4;">Job</span></span>
      <p style="color:#93c5fd;font-size:13px;margin:6px 0 0;">Vos opportunités de la semaine · ${week}</p>
    </td>
  </tr>

  <!-- Intro -->
  <tr>
    <td style="padding:24px 32px 8px;">
      <p style="font-size:15px;color:#1e293b;margin:0;">Bonjour <strong>${firstName}</strong>,</p>
      <p style="font-size:14px;color:#475569;margin:10px 0 0;">
        Voici les <strong>${jobs.length} nouvelles offres</strong> publiées cette semaine sur InteractJob.ma.
        Les offres <strong>Direct</strong> sont des recrutements confirmés d'employeurs partenaires.
      </p>
    </td>
  </tr>

  <!-- Jobs -->
  <tr>
    <td style="padding:8px 32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0">${jobRows}</table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:8px 32px 24px;text-align:center;">
      <a href="${SITE_URL}/offres"
         style="background:#0A2D6E;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        Voir toutes les offres →
      </a>
    </td>
  </tr>

  <!-- Upsell: CV checker -->
  <tr>
    <td style="padding:0 32px 24px;">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:10px;padding:20px;">
        <p style="color:#fff;font-weight:700;font-size:15px;margin:0 0 6px;">📄 Votre CV passe-t-il les filtres ATS ?</p>
        <p style="color:#bfdbfe;font-size:13px;margin:0 0 14px;">
          70 % des CV sont éliminés automatiquement. Analysez le vôtre en 30 secondes — <strong style="color:#fff;">gratuit.</strong>
        </p>
        <a href="${SITE_URL}/cv-checker"
           style="background:#fff;color:#1e40af;padding:8px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;">
          Analyser mon CV →
        </a>
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f1f5f9;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">
        Vous recevez cet email car vous avez postulé sur InteractJob.ma.<br/>
        <a href="${SITE_URL}/offres" style="color:#0A2D6E;">Voir les offres</a> ·
        <a href="mailto:contact@interactjob.ma?subject=Désabonnement newsletter&body=Email: ${candidate.email}"
           style="color:#94a3b8;">Se désabonner</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildEmailText(candidate, jobs) {
  const firstName = candidate.firstName || 'Candidat';
  const week = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const lines = jobs.map(j =>
    `• ${j.title}${j.source === 'Direct' ? ' [Direct]' : ''}\n  ${j.company} · ${j.city} · ${j.contractType || 'CDI'}${j.salary ? ' · ' + j.salary : ''}\n  ${SITE_URL}/offres/${j.slug || j.id}`
  ).join('\n\n');

  return `Bonjour ${firstName},

${jobs.length} nouvelles offres cette semaine sur InteractJob.ma (${week}) :

${lines}

Toutes les offres : ${SITE_URL}/offres
Analysez votre CV gratuitement : ${SITE_URL}/cv-checker

—
InteractJob.ma — L'emploi au Maroc
Pour vous désabonner, répondez à cet email avec "Désabonnement".`;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function runWeeklyCandidateDigest() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { log('WeeklyDigest: MONGODB_URI non défini — skip'); return; }

  const jobs = getRecentJobs();
  if (!jobs.length) { log('WeeklyDigest: aucune offre cette semaine — skip'); return; }
  log(`WeeklyDigest: ${jobs.length} offres sélectionnées (${jobs.filter(j => j.source === 'Direct').length} directes)`);

  // Edition key: current ISO week (e.g. "2026-W24")
  const now = new Date();
  const weekNum = Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
  const editionKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  const client = new MongoClient(uri);
  let candidates = [];
  try {
    await client.connect();
    candidates = await client.db('interactjob').collection('candidates')
      .find({
        email: { $regex: '@' },
        // Skip if already received this week's edition
        $or: [
          { last_newsletter_edition: { $ne: editionKey } },
          { last_newsletter_edition: { $exists: false } },
        ],
        // Respect explicit opt-out
        newsletter_optout: { $ne: true },
      })
      .project({ _id: 1, email: 1, firstName: 1, lastName: 1 })
      .toArray();
  } finally { await client.close(); }

  if (!candidates.length) { log(`WeeklyDigest: tous les candidats ont déjà reçu l'édition ${editionKey}`); return; }
  log(`WeeklyDigest: envoi à ${candidates.length} candidat(s) — édition ${editionKey}`);

  let sent = 0, failed = 0;
  const toStamp = [];

  for (const candidate of candidates) {
    if (!candidate.email?.includes('@')) { failed++; continue; }
    try {
      await sendEmail({
        to: candidate.email,
        subject: `🗓 ${jobs.length} nouvelles offres d'emploi cette semaine — InteractJob.ma`,
        text: buildEmailText(candidate, jobs),
        html: buildEmailHtml(candidate, jobs),
      });
      toStamp.push(candidate._id);
      sent++;
    } catch (e) {
      log(`WeeklyDigest: ✗ ${candidate.email} — ${e.message}`);
      failed++;
    }
    // Throttle: ~40 emails/min max on Gmail
    await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  // Stamp sent candidates with edition key so we don't re-send
  if (toStamp.length) {
    const client2 = new MongoClient(uri);
    try {
      await client2.connect();
      await client2.db('interactjob').collection('candidates').updateMany(
        { _id: { $in: toStamp } },
        { $set: { last_newsletter_edition: editionKey, last_newsletter_at: new Date() } }
      );
    } finally { await client2.close(); }
  }

  log(`WeeklyDigest: ✓ ${sent} envoyés, ${failed} échecs — édition ${editionKey}`);
}

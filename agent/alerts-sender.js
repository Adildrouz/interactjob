/**
 * Email Alerts Sender — matches new offers/concours/remote jobs against
 * confirmed subscriber filters and emails digests.
 *
 * Reads "alert_subscribers" from MongoDB (created by /api/alerts and
 * /api/concours-alerts on the site, activated via the double opt-in
 * confirmation link), matches items posted since the subscriber's last
 * send, sends one digest email per subscriber, and logs every attempt to
 * "alert_email_logs" — this is the piece that was completely missing
 * before: previously last_sent_at was the only trace of a send, and it was
 * never actually set for any of the 105 real subscribers.
 */

import { MongoClient } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';
import { sendEmail } from './mailer.js';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SITE_URL = 'https://www.interactjob.ma';
const MAX_ITEMS_PER_EMAIL = 8;
const NAVY = '#00347A';
const TURQUOISE = '#00C2CB';

const SUBSCRIBERS_COLLECTION = 'alert_subscribers';
const LOGS_COLLECTION = 'alert_email_logs';

async function readJsonSafe(file) {
  try { return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf-8')); }
  catch { return []; }
}

// ── Per-type matching ─────────────────────────────────────────────────────────

function matchesOffre(job, filters) {
  if (job.expired) return false;
  if (filters.ville && job.city !== filters.ville) return false;
  if (filters.secteur && job.sector !== filters.secteur) return false;
  if (filters.keywords?.length) {
    const haystack = `${job.title} ${job.company}`.toLowerCase();
    if (!filters.keywords.some(kw => haystack.includes(kw.toLowerCase()))) return false;
  }
  return true;
}

function matchesConcours(c, filters) {
  if (filters.secteur) {
    const haystack = `${c.title_fr} ${c.organization_fr}`.toLowerCase();
    if (!haystack.includes(filters.secteur.toLowerCase())) return false;
  }
  return true;
}

function matchesRemote(job, filters) {
  if (filters.keywords?.length) {
    const haystack = `${job.title} ${job.company} ${job.category || ''}`.toLowerCase();
    if (!filters.keywords.some(kw => haystack.includes(kw.toLowerCase()))) return false;
  }
  return true;
}

const ALERT_TYPES = {
  offres: {
    file: 'jobs.json',
    dateField: (j) => j.postedAt || j.date_posted,
    matches: matchesOffre,
    itemLabel: (j) => `${j.title}\n  ${j.company} · ${j.city} · ${j.contractType}${j.salary ? ` — 💰 ${j.salary}` : ''}`,
    itemHtml: (j) => `<strong>${j.title}</strong><br><span style="color:#6B7280;">${j.company} · ${j.city} · ${j.contractType}${j.salary ? ` — 💰 ${j.salary}` : ''}</span>`,
    itemUrl: (j) => `/offres/${j.slug || j.id}`,
    itemId: (j) => j.slug || j.id,
    listUrl: '/offres',
    listLabel: 'Voir toutes les offres',
  },
  concours: {
    file: 'concours.json',
    dateField: (c) => c.datePosted,
    matches: matchesConcours,
    itemLabel: (c) => `${c.title_fr}\n  ${c.organization_fr}`,
    itemHtml: (c) => `<strong>${c.title_fr}</strong><br><span style="color:#6B7280;">${c.organization_fr}</span>`,
    itemUrl: (c) => `/concours/${c.slug}`,
    itemId: (c) => c.slug,
    listUrl: '/concours',
    listLabel: 'Voir tous les concours',
  },
  remote: {
    file: 'remote-jobs.json',
    dateField: (j) => j.published,
    matches: matchesRemote,
    itemLabel: (j) => `${j.title}\n  ${j.company}`,
    itemHtml: (j) => `<strong>${j.title}</strong><br><span style="color:#6B7280;">${j.company}</span>`,
    itemUrl: (j) => `/offres/remote/${j.id}`,
    itemId: (j) => j.id,
    listUrl: '/offres/remote',
    listLabel: 'Voir toutes les offres remote',
  },
};

function describeFilters(alertType, filters) {
  if (alertType === 'concours') return filters.secteur || 'Tous les concours';
  const parts = [...(filters.keywords || []), filters.secteur, filters.ville].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Toutes les offres';
}

function trackClickUrl(subscriberId, relativeUrl) {
  return `${SITE_URL}/api/alerts/track-click?sid=${subscriberId}&url=${encodeURIComponent(relativeUrl)}`;
}

function buildDigest(subscriber, typeConfig, items) {
  const criteria = describeFilters(subscriber.alert_type, subscriber.filters || {});
  const sid = subscriber._id.toString();
  const n = items.length;

  const textLines = items.slice(0, MAX_ITEMS_PER_EMAIL)
    .map(item => `• ${typeConfig.itemLabel(item)}\n  👉 ${SITE_URL}${typeConfig.itemUrl(item)}`)
    .join('\n\n');
  const more = n > MAX_ITEMS_PER_EMAIL
    ? `\n\n… et ${n - MAX_ITEMS_PER_EMAIL} autre(s) : ${SITE_URL}${typeConfig.listUrl}`
    : '';
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

  const text = `Bonjour,

${n} nouvelle${n > 1 ? 's' : ''} correspondance${n > 1 ? 's' : ''} pour votre alerte (${criteria}) :

${textLines}${more}

──────────────────────────────
${typeConfig.listLabel} : ${SITE_URL}${typeConfig.listUrl}

L'équipe InteractJob.ma
Se désinscrire : ${unsubUrl}`;

  const itemsHtml = items.slice(0, MAX_ITEMS_PER_EMAIL).map(item => `
    <tr><td style="padding:14px 0;border-bottom:1px solid #EEF2F7;">
      <p style="margin:0;font-size:14px;color:#1F2937;">${typeConfig.itemHtml(item)}</p>
      <a href="${trackClickUrl(sid, typeConfig.itemUrl(item))}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:${TURQUOISE};text-decoration:none;">Voir l'offre →</a>
    </td></tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#F0F8FF;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
      <span style="color:#fff;font-size:20px;font-weight:800;">InteractJob<span style="color:${TURQUOISE};">.ma</span></span>
    </div>
    <div style="background:#fff;border:1px solid #D0E4F0;border-top:none;border-radius:0 0 16px 16px;padding:28px;">
      <p style="font-size:15px;color:#1F2937;margin:0 0 4px;">Bonjour,</p>
      <p style="font-size:14px;color:#6B7280;margin:0 0 20px;">${n} nouvelle${n > 1 ? 's' : ''} correspondance${n > 1 ? 's' : ''} pour votre alerte (<strong>${criteria}</strong>) :</p>
      <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
      ${n > MAX_ITEMS_PER_EMAIL ? `<p style="font-size:13px;color:#6B7280;margin:16px 0 0;">… et ${n - MAX_ITEMS_PER_EMAIL} autre(s).</p>` : ''}
      <div style="text-align:center;margin:24px 0 0;">
        <a href="${SITE_URL}${typeConfig.listUrl}" style="display:inline-block;background:${TURQUOISE};color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">${typeConfig.listLabel}</a>
      </div>
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:16px;">
      <a href="${unsubUrl}" style="color:#9CA3AF;">Se désinscrire</a> · InteractJob.ma
    </p>
    <img src="${SITE_URL}/api/alerts/track-open?sid=${sid}" width="1" height="1" style="display:none;" alt="" />
  </div>
</body></html>`;

  const subject = `🔔 ${n} nouvelle${n > 1 ? 's' : ''} correspondance${n > 1 ? 's' : ''} — ${criteria}`;
  return { subject, text, html };
}

// Heuristic bounce detection — Gmail SMTP gives us no proper bounce webhook,
// so this is best-effort: permanent-failure SMTP codes in the thrown error.
function looksLikeBounce(err) {
  const msg = (err?.message || '').toLowerCase();
  return /550|551|553|no such user|user unknown|does not exist|invalid recipient/.test(msg);
}

export async function runAlertsSender() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { log('Alerts: MONGODB_URI non défini — skip'); return; }

  const dataByType = {};
  for (const [type, cfg] of Object.entries(ALERT_TYPES)) {
    dataByType[type] = await readJsonSafe(cfg.file);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('interactjob');
    const subscribers = db.collection(SUBSCRIBERS_COLLECTION);
    const logs = db.collection(LOGS_COLLECTION);

    const alerts = await subscribers.find({ confirmed: true, status: 'active' }).toArray();
    if (!alerts.length) { log('Alerts: aucun abonné confirmé — rien à envoyer'); return; }

    const runId = crypto.randomUUID();
    let sent = 0, failed = 0, skippedNoMatch = 0;

    for (const subscriber of alerts) {
      const typeConfig = ALERT_TYPES[subscriber.alert_type];
      if (!typeConfig) { log(`Alerts: type inconnu "${subscriber.alert_type}" pour ${subscriber._id} — skip`); continue; }

      const since = subscriber.last_email_sent_at
        ? new Date(subscriber.last_email_sent_at)
        : new Date(Date.now() - 24 * 3600 * 1000);

      const pool = dataByType[subscriber.alert_type] || [];
      const matched = pool
        .filter(item => typeConfig.matches(item, subscriber.filters || {}) && new Date(typeConfig.dateField(item)) > since)
        .sort((a, b) => new Date(typeConfig.dateField(b)) - new Date(typeConfig.dateField(a)));

      if (!matched.length) { skippedNoMatch++; continue; }

      const { subject, text, html } = buildDigest(subscriber, typeConfig, matched);
      const offersIncluded = matched.slice(0, MAX_ITEMS_PER_EMAIL).map(typeConfig.itemId);

      try {
        const { delivered } = await sendEmail({ to: subscriber.email, subject, text, html });
        if (!delivered) {
          failed++;
          await logs.insertOne({
            run_id: runId,
            subscriber_id: subscriber._id,
            email: subscriber.email,
            alert_type: subscriber.alert_type,
            email_type: 'digest',
            offers_included: offersIncluded,
            sent_at: new Date(),
            status: 'failed',
            error_reason: 'GMAIL_APP_PASSWORD non configuré (dry run)',
          });
          log(`Alerts: ⚠️ GMAIL_APP_PASSWORD non configuré — envoi factice pour ${subscriber._id}`);
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }

        await subscribers.updateOne(
          { _id: subscriber._id },
          { $set: { last_email_sent_at: new Date() }, $inc: { emails_sent_count: 1 } }
        );
        await logs.insertOne({
          run_id: runId,
          subscriber_id: subscriber._id,
          email: subscriber.email,
          alert_type: subscriber.alert_type,
          email_type: 'digest',
          offers_included: offersIncluded,
          sent_at: new Date(),
          status: 'sent',
          error_reason: null,
        });
        sent++;
        // Gentle pacing to stay under Gmail rate limits and avoid spam flags.
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        failed++;
        const bounced = looksLikeBounce(err);
        await logs.insertOne({
          run_id: runId,
          subscriber_id: subscriber._id,
          email: subscriber.email,
          alert_type: subscriber.alert_type,
          email_type: 'digest',
          offers_included: offersIncluded,
          sent_at: new Date(),
          status: bounced ? 'bounced' : 'failed',
          error_reason: err.message?.slice(0, 300) || 'unknown error',
        });
        if (bounced) {
          await subscribers.updateOne({ _id: subscriber._id }, { $set: { status: 'bounced' } });
          log(`Alerts: 🔴 BOUNCE → ${subscriber._id} — désactivé`);
        } else {
          log(`Alerts: ERREUR envoi → ${subscriber._id} — ${err.message}`);
        }
      }
    }

    log(`Alerts: ✓ terminé — ${sent} envoyé(s), ${failed} échec(s), ${skippedNoMatch} sans nouveauté, ${alerts.length} confirmé(s) au total`);
  } finally {
    await client.close();
  }
}

// Allow standalone run: `node alerts-sender.js`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAlertsSender().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}

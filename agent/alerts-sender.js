/**
 * Job Alerts Sender — matches new jobs against subscriber criteria and emails digests.
 *
 * Reads "job_alerts" from MongoDB (created by /api/alerts on the site),
 * matches jobs from data/jobs.json posted since the alert's last send,
 * sends one digest email per subscriber, and stamps last_sent_at.
 */

import { MongoClient } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './mailer.js';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname, '..', 'data', 'jobs.json');
const SITE_URL = 'https://www.interactjob.ma';
const MAX_JOBS_PER_EMAIL = 8;

function jobMatches(job, alert) {
  if (job.expired) return false;
  if (alert.city && job.city !== alert.city) return false;
  if (alert.sector && job.sector !== alert.sector) return false;
  if (alert.keyword) {
    const kw = alert.keyword.toLowerCase();
    const haystack = `${job.title} ${job.company}`.toLowerCase();
    if (!haystack.includes(kw)) return false;
  }
  return true;
}

function buildDigest(alert, jobs) {
  const criteria = [alert.keyword, alert.sector, alert.city].filter(Boolean).join(' · ') || 'Toutes les offres';

  const jobLines = jobs.slice(0, MAX_JOBS_PER_EMAIL).map(j => {
    const url = `${SITE_URL}/offres/${j.slug || j.id}`;
    const salary = j.salary ? ` — 💰 ${j.salary}` : '';
    return `• ${j.title}\n  ${j.company} · ${j.city} · ${j.contractType}${salary}\n  👉 ${url}`;
  }).join('\n\n');

  const more = jobs.length > MAX_JOBS_PER_EMAIL
    ? `\n\n… et ${jobs.length - MAX_JOBS_PER_EMAIL} autres offres : ${SITE_URL}/offres`
    : '';

  return {
    subject: `🔔 ${jobs.length} nouvelle${jobs.length > 1 ? 's' : ''} offre${jobs.length > 1 ? 's' : ''} — ${criteria}`,
    text: `Bonjour,

${jobs.length} nouvelle${jobs.length > 1 ? 's' : ''} offre${jobs.length > 1 ? 's' : ''} correspond${jobs.length > 1 ? 'ent' : ''} à votre alerte (${criteria}) :

${jobLines}${more}

──────────────────────────────
Toutes les offres : ${SITE_URL}/offres
Alertes WhatsApp quotidiennes : https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j

L'équipe InteractJob.ma
Se désinscrire : ${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(alert.email)}`,
  };
}

export async function runAlertsSender() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { log('Alerts: MONGODB_URI non défini — skip'); return; }

  const jobs = JSON.parse(await fs.readFile(JOBS_PATH, 'utf-8'));

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db('interactjob').collection('job_alerts');
    const alerts = await col.find({ active: { $ne: false } }).toArray();
    if (!alerts.length) { log('Alerts: aucun abonné — rien à envoyer'); return; }

    let sent = 0;
    for (const alert of alerts) {
      // Only jobs posted since the last send (first send: last 24h)
      const since = alert.last_sent_at
        ? new Date(alert.last_sent_at)
        : new Date(Date.now() - 24 * 3600 * 1000);

      const matched = jobs
        .filter(j => jobMatches(j, alert) && new Date(j.postedAt) > since)
        .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

      if (!matched.length) continue;

      const { subject, text } = buildDigest(alert, matched);
      try {
        await sendEmail({ to: alert.email, subject, text });
        await col.updateOne({ _id: alert._id }, { $set: { last_sent_at: new Date() } });
        sent++;
        // Gentle pacing to stay under Gmail rate limits
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        log(`Alerts: ERREUR envoi → ${alert.email} — ${err.message}`);
      }
    }

    log(`Alerts: ✓ terminé — ${sent}/${alerts.length} abonnés notifiés`);
  } finally {
    await client.close();
  }
}

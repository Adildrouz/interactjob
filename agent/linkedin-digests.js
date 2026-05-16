/**
 * LinkedIn Daily Digest Generator for InteractJob.ma
 *
 * Generates 5 themed LinkedIn posts from the day's freshly enriched jobs.
 * Saves them to data/linkedin-queue.txt and sends by email.
 *
 * Post schedule:
 *   08:00 — Hôtellerie digest
 *   10:00 — IT & Digital digest
 *   12:00 — RH & Finance digest
 *   17:00 — Offres qui expirent bientôt
 *   19:00 — Dernier article blog
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs-extra';
import { log } from './logger.js';
import { sendEmail } from './mailer.js';

const __dirname       = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const JOBS_PATH     = path.join(__dirname, '../data/jobs.json');
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');
const QUEUE_PATH    = path.join(__dirname, '../data/linkedin-queue.txt');
const SITE_URL      = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const WA_LINK       = 'https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function jobLine(j) {
  return `${j.title} — ${j.city} (${j.contractType})`;
}

function formatJobsForPrompt(jobs) {
  return jobs.map((j) => `- ${jobLine(j)}`).join('\n');
}

function loadAllJobs() {
  try { return fs.readJsonSync(JOBS_PATH); } catch { return []; }
}

function loadLatestArticle() {
  try {
    const articles = fs.readJsonSync(ARTICLES_PATH);
    return articles.filter((a) => (a.lang ?? 'fr') === 'fr').sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    )[0] || null;
  } catch { return null; }
}

function getExpiringSoon(allJobs) {
  const in3days = new Date(Date.now() + 3 * 86400000);
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  return allJobs.filter((j) => {
    if (j.expired) return false;
    const exp = j.date_expires ? new Date(j.date_expires) : null;
    return exp && exp >= today && exp <= in3days;
  }).slice(0, 5);
}

// ── One Claude call per post ───────────────────────────────────────────────────

async function generatePost(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const res = await getClient().messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      system:
        "Tu es le community manager d'InteractJob.ma. Tu rédiges des posts LinkedIn engageants et professionnels en français pour le marché de l'emploi marocain.",
      messages: [{ role: 'user', content: prompt }],
    });
    return (res.content[0]?.text || '').trim();
  } catch (err) {
    log(`LinkedIn digest: erreur Claude — ${err.message}`);
    return null;
  }
}

// ── 5 post generators ─────────────────────────────────────────────────────────

async function post1Hotel(enrichedJobs) {
  const jobs = enrichedJobs.filter((j) => j.sector === 'Hôtellerie').slice(0, 3);
  if (jobs.length === 0) return '🏨 Pas d\'offres hôtellerie aujourd\'hui — restez connectés pour demain !';

  const prompt =
    `Rédige un post LinkedIn engageant pour InteractJob.ma. Présente ces ${jobs.length} offres hôtellerie du jour.\n` +
    `Commence par '🏨 Top offres Hôtellerie aujourd'hui :'.\n` +
    `Bullet points avec ville et contrat.\n` +
    `Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Termine par 'Détails → ${SITE_URL}' et '📲 ${WA_LINK}'. Max 150 mots.`;

  return await generatePost(prompt) || `🏨 Top offres Hôtellerie aujourd'hui :\n${formatJobsForPrompt(jobs)}\n\nDétails → ${SITE_URL}\n📲 ${WA_LINK}`;
}

async function post2IT(enrichedJobs) {
  const jobs = enrichedJobs.filter((j) => j.sector === 'IT').slice(0, 3);
  if (jobs.length === 0) return '💻 Pas d\'offres IT aujourd\'hui — consultez interactjob.ma pour toutes nos offres.';

  const prompt =
    `Post LinkedIn offres IT du jour pour InteractJob.ma. Commence par '💻 Offres IT & Digital du jour :'.\n` +
    `3 offres avec ville et contrat. Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Termine par lien ${SITE_URL} et lien WhatsApp ${WA_LINK}. Max 150 mots.`;

  return await generatePost(prompt) || `💻 Offres IT & Digital du jour :\n${formatJobsForPrompt(jobs)}\n\n${SITE_URL}\n📲 ${WA_LINK}`;
}

async function post3RHFinance(enrichedJobs) {
  const jobs = enrichedJobs.filter((j) => j.sector === 'RH' || j.sector === 'Finance').slice(0, 3);
  if (jobs.length === 0) return '📊 Pas d\'offres RH & Finance aujourd\'hui — consultez interactjob.ma.';

  const prompt =
    `Post LinkedIn offres RH et Finance du jour pour InteractJob.ma. Commence par '📊 Offres RH & Finance :'.\n` +
    `3 offres max. Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Termine par lien ${SITE_URL} et lien WhatsApp ${WA_LINK}. Max 150 mots.`;

  return await generatePost(prompt) || `📊 Offres RH & Finance :\n${formatJobsForPrompt(jobs)}\n\n${SITE_URL}\n📲 ${WA_LINK}`;
}

async function post4Expiring(allJobs) {
  const jobs = getExpiringSoon(allJobs);
  if (jobs.length === 0) return '⏰ Aucune offre n\'expire dans les 3 prochains jours — profitez-en pour postuler sur interactjob.ma !';

  const prompt =
    `Post LinkedIn urgent pour InteractJob.ma. Ces offres expirent dans moins de 3 jours.\n` +
    `Commence par '⏰ Ces offres expirent bientôt :'.\n` +
    `Crée un sentiment d'urgence. Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Termine par lien ${SITE_URL} et lien WhatsApp ${WA_LINK}. Max 120 mots.`;

  return await generatePost(prompt) || `⏰ Ces offres expirent bientôt :\n${formatJobsForPrompt(jobs)}\n\nPostulez maintenant → ${SITE_URL}\n📲 ${WA_LINK}`;
}

async function post5Blog() {
  const article = loadLatestArticle();
  if (!article) return `✍️ Découvrez nos derniers articles RH et emploi sur ${SITE_URL}/blog\n📲 ${WA_LINK}`;

  const prompt =
    `Post LinkedIn pour promouvoir cet article blog d'InteractJob.ma.\n` +
    `Titre : "${article.title}"\n` +
    `Résumé : ${article.excerpt}\n` +
    `Commence par une question qui interpelle les professionnels marocains.\n` +
    `2 insights clés tirés de l'article.\n` +
    `Termine par 'Article complet → ${SITE_URL}/blog/${article.slug}' et '📲 ${WA_LINK}'. Max 180 mots.`;

  return await generatePost(prompt) || `✍️ ${article.title}\n\n${article.excerpt}\n\nArticle complet → ${SITE_URL}/blog/${article.slug}\n📲 ${WA_LINK}`;
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function generateLinkedInDigests(enrichedJobs) {
  log('LinkedIn digests: génération des 5 posts du jour');

  const allJobs = loadAllJobs();
  const today   = new Date().toISOString().split('T')[0];

  // Generate 5 posts with small delay between Claude calls
  const [p1, p2, p3, p4, p5] = await Promise.allSettled([
    post1Hotel(enrichedJobs),
    (async () => { await sleep(1500); return post2IT(enrichedJobs); })(),
    (async () => { await sleep(3000); return post3RHFinance(enrichedJobs); })(),
    (async () => { await sleep(4500); return post4Expiring(allJobs); })(),
    (async () => { await sleep(6000); return post5Blog(); })(),
  ]);

  const get = (r) => (r.status === 'fulfilled' ? r.value : `[Erreur: ${r.reason?.message}]`);

  const posts = {
    '08:00 HÔTELLERIE':       get(p1),
    '10:00 IT & DIGITAL':     get(p2),
    '12:00 RH & FINANCE':     get(p3),
    '17:00 URGENCE EXPIRATION': get(p4),
    '19:00 ARTICLE BLOG':     get(p5),
  };

  log(`LinkedIn digests: 5 posts générés`);

  // Build the queue file entry
  const fence = '='.repeat(26);
  let entry = `\n${fence} [${today}] ${fence}\n\n`;
  for (const [label, text] of Object.entries(posts)) {
    entry += `[${label}]\n${text}\n---\n`;
  }
  entry += `${fence}\n`;

  await fs.appendFile(QUEUE_PATH, entry, 'utf-8');
  log('LinkedIn digests: sauvegardés → data/linkedin-queue.txt');

  // Send by email
  const emailBody =
    `Posts LinkedIn InteractJob — ${today}\n\n` +
    Object.entries(posts)
      .map(([label, text]) => `[${label}]\n${text}`)
      .join('\n\n---\n\n') +
    '\n\n---\nGénéré automatiquement par l\'agent InteractJob.';

  try {
    await sendEmail({
      to:      'jobinteract@gmail.com',
      subject: `📋 Posts LinkedIn InteractJob — ${today}`,
      text:    emailBody,
    });
  } catch (err) {
    log(`LinkedIn digests: envoi email échoué — ${err.message}`);
  }
}

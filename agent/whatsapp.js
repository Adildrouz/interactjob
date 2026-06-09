/**
 * WhatsApp Channel Auto-Poster for InteractJob.ma
 *
 * 3 publications par jour :
 *   09:00 �€” "Offres du Jour"   (matin)  : top 8 jobs des dernières 24h
 *   17:00 �€” "Bilan du Soir"   (soir)   : offres expirant bientôt + concours
 *   21:00 �€” "Bonne Soirée"    (nuit)   : article blog + conseil CV + service CV pro
 *
 * Usage :
 *   node agent.js --whatsapp            �†’ matin
 *   node agent.js --whatsapp-soir       �†’ soir
 *   node agent.js --whatsapp-nuit       �†’ nuit
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs-extra';
import { log } from './logger.js';
import { sendEmail } from './mailer.js';
import { logTokenUsage } from './token-tracker.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const JOBS_PATH     = path.join(__dirname, '../data/jobs.json');
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');
const CONCOURS_PATH = path.join(__dirname, '../data/concours.json');
const QUEUE_PATH    = path.join(__dirname, '../data/whatsapp-queue.txt');
const SITE_URL      = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const WA_CHANNEL    = 'https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j';
const UTM           = '?utm_source=whatsapp&utm_medium=social&utm_campaign=chaine';
function u(path = '') { return `${SITE_URL}${path}${UTM}`; }

const MAX_JOBS     = 8;
const HOTEL_SECTOR = 'Hôtellerie';
const MIX_SECTORS  = ['IT', 'RH', 'Finance', 'Administratif', 'Commerce'];

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS  = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

// �”€�”€ Shared helpers �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€

function todayLabel() {
  const d = new Date();
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function shortDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

function loadAllJobs() {
  try { return fs.readJsonSync(JOBS_PATH); } catch { return []; }
}

function loadActiveConcours() {
  try {
    const all = fs.readJsonSync(CONCOURS_PATH);
    const now = Date.now();
    return all
      .filter((c) => !c.deadline || new Date(c.deadline).getTime() > now)
      .sort((a, b) => new Date(b.datePosted || 0) - new Date(a.datePosted || 0))
      .slice(0, 3);
  } catch { return []; }
}

function loadLatestBlogArticle() {
  try {
    const articles = fs.readJsonSync(ARTICLES_PATH);
    return articles
      .filter((a) => (a.lang ?? 'fr') === 'fr')
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0] || null;
  } catch { return null; }
}

function getExpiringSoon(allJobs) {
  const in3days = new Date(Date.now() + 3 * 86400000);
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  return allJobs.filter((j) => {
    if (j.expired) return false;
    const exp = j.date_expires ? new Date(j.date_expires) : null;
    return exp && exp >= today && exp <= in3days;
  }).slice(0, 4);
}

function countActiveJobs() {
  try { return loadAllJobs().filter((j) => !j.expired).length; } catch { return 0; }
}

// �”€�”€ Queue + Channel helpers �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€

async function appendToQueue(message) {
  const now   = new Date().toISOString().split('T')[0];
  const fence = '='.repeat(26);
  const entry = `\n${fence} [${now}] ${fence}\n${message}\n${fence}\n`;
  await fs.appendFile(QUEUE_PATH, entry, 'utf-8');
}

async function sendToChannel(message) {
  const res = await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to:   process.env.WHATSAPP_CHANNEL_ID,
      type: 'text',
      text: { body: message },
    },
    {
      headers: {
        Authorization:  `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

async function uploadToGoogleDrive() {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !keyRaw) {
    log('Drive: credentials non définis �€” upload ignoré');
    return;
  }
  try {
    const privateKey = keyRaw.replace(/\\n/g, '\n');
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: email, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive      = google.drive({ version: 'v3', auth });
    const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME || 'InteractJob-WhatsApp';

    const folderSearch = await drive.files.list({
      q:      `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)', spaces: 'drive',
    });
    let folderId;
    if (folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      const created = await drive.files.create({
        requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      folderId = created.data.id;
    }
    const fileSearch = await drive.files.list({
      q:      `name='whatsapp-queue.txt' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)', spaces: 'drive',
    });
    const { createReadStream } = await import('fs');
    const media = { mimeType: 'text/plain', body: createReadStream(QUEUE_PATH) };
    if (fileSearch.data.files.length > 0) {
      await drive.files.update({ fileId: fileSearch.data.files[0].id, media });
    } else {
      await drive.files.create({
        requestBody: { name: 'whatsapp-queue.txt', parents: [folderId] }, media, fields: 'id',
      });
    }
    log('Drive: �œ“ whatsapp-queue.txt uploadé');
  } catch (err) {
    log(`Drive: �œ— upload échoué �€” ${err.message}`);
  }
}

function utmUrl(path) {
  return `${SITE_URL}${path}?utm_source=whatsapp&utm_medium=social&utm_campaign=digest`;
}

function tagJobLinks(jobs) {
  return jobs.map((j) => ({
    ...j,
    shortLink: j.slug ? utmUrl(`/offres/${j.slug}`) : utmUrl('/offres'),
  }));
}

async function sendToTelegram(message, slot) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) { log('WhatsApp→Telegram: non configuré'); return; }

  const full = message; // message prêt à copier, sans wrapper

  const chunks = [];
  for (let i = 0; i < full.length; i += 4000) chunks.push(full.slice(i, i + 4000));

  for (const chunk of chunks) {
    const res  = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: chunk, disable_web_page_preview: true }),
    }).catch(e => { log(`WhatsApp→Telegram: erreur ${e.message}`); return null; });
    if (res) {
      const json = await res.json().catch(() => ({}));
      if (!json.ok) log(`WhatsApp→Telegram: API error — ${JSON.stringify(json.description)}`);
    }
  }
  log(`WhatsApp→Telegram: message ${slot} envoyé`);
}

async function dispatchMessage(message, emailSubject, slot) {
  await appendToQueue(message);
  await sendToTelegram(message, slot);
}
// �”€�”€ �•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é �”€�”€
//    SLOT MATIN �€” 09:00 : Offres du Jour
// �”€�”€ �•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é �”€�”€

function loadMatinCandidates() {
  const all = loadAllJobs();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = all.filter(
    (j) => !j.expired && j.date_scraped && new Date(j.date_scraped) >= yesterday
  );
  if (recent.length > 0) return recent;
  log('WhatsApp matin: aucun job < 24h �€” fallback sur les jobs actifs récents');
  return all
    .filter((j) => !j.expired)
    .sort((a, b) => new Date(b.date_scraped || b.postedAt || 0) - new Date(a.date_scraped || a.postedAt || 0))
    .slice(0, 20);
}

function selectMatinJobs(candidates) {
  const hotel = candidates.filter((j) => j.sector === HOTEL_SECTOR);
  const mix   = candidates.filter((j) => MIX_SECTORS.includes(j.sector) && j.sector !== HOTEL_SECTOR);
  const rest  = candidates.filter((j) => j.sector !== HOTEL_SECTOR && !MIX_SECTORS.includes(j.sector));
  const selected = [...hotel];
  for (const pool of [mix, rest]) {
    if (selected.length >= MAX_JOBS) break;
    selected.push(...pool.slice(0, MAX_JOBS - selected.length));
  }
  return selected.slice(0, MAX_JOBS);
}

function buildMatinFallback(jobs, shortAllOffres) {
  const lines = [
    `🌅 Offres du Jour — InteractJob.ma`,
    `📅 ${todayLabel()}`,
    `━━━━━━━━━━━━━━━━━━━`,
    ``,
  ];
  jobs.forEach((j) => {
    lines.push(`🔹 ${j.title} — ${j.city} (${j.contractType})`);
    lines.push(`👉 ${j.shortLink || u(`/offres/${j.slug || ''}`)}`);
    lines.push(``);
  });
  lines.push(
    `━━━━━━━━━━━━━━━━━━━`,
    `📋 Toutes les offres → ${shortAllOffres || u('/offres')}`,
    `📲 Notre chaîne WhatsApp → ${WA_CHANNEL}`,
    `💬 Partagez avec quelqu\'un qui cherche un emploi 🇲🇦`,
  );
  return lines.join('\n');
}

async function formatMatinWithClaude(jobs, shortAllOffres) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Pre-build job blocks with exact short links — Claude only writes the title line
  const jobBlocks = jobs.map((j) =>
    `🔹 ${j.title} — ${j.city} (${j.contractType})\n👉 ${j.shortLink}`
  ).join('\n\n');

  const userPrompt =
    `Voici les ${jobs.length} offres du jour déjà formatées avec leurs liens exacts. ` +
    `Ajoute UNIQUEMENT un titre accrocheur court (1 ligne max, commence par 🌅, mentionne exactement ${jobs.length} offres) et la date, ` +
    `puis colle les offres telles quelles, puis le footer.\n\n` +
    `Date : ${todayLabel()}\n\n` +
    `OFFRES (ne pas modifier) :\n${jobBlocks}\n\n` +
    `FOOTER (ne pas modifier) :\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `📋 Toutes les offres → ${shortAllOffres}\n` +
    `📲 Notre chaîne WhatsApp → ${WA_CHANNEL}\n` +
    `💬 Partagez avec quelqu\'un qui cherche un emploi 🇲🇦\n\n` +
    `Format attendu :\n` +
    `[titre accrocheur]\n` +
    `📅 ${todayLabel()}\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `[offres]\n\n` +
    `[footer]\n\n` +
    `Retourne UNIQUEMENT le message final.`;

  const response = await client.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 1500,
    system:     "Tu es community manager d\'InteractJob.ma. Tu copies les offres et liens EXACTEMENT tels que fournis, sans aucune modification.",
    messages:   [{ role: 'user', content: userPrompt }],
  });

  const inputTokens  = response.usage?.input_tokens  || 0;
  const outputTokens = response.usage?.output_tokens || 0;
  logTokenUsage('whatsapp-matin', inputTokens, outputTokens);

  return (response.content[0]?.text || '').trim();
}

async function sendMatinDigest() {
  const candidates = loadMatinCandidates();
  if (candidates.length === 0) {
    log('WhatsApp matin: aucun job disponible — digest ignoré');
    return;
  }
  const selected = selectMatinJobs(candidates);
  log(`WhatsApp matin: ${candidates.length} candidat(s), ${selected.length} sélectionné(s)`);

  const shortened = tagJobLinks(selected);
  const shortAllOffres = utmUrl('/offres');

  let message;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      message = await formatMatinWithClaude(shortened, shortAllOffres);
      log('WhatsApp matin: message formaté par Claude ✓');
    } catch (err) {
      log(`WhatsApp matin: Claude indisponible (${err.message}) — fallback`);
      message = buildMatinFallback(shortened, shortAllOffres);
    }
  } else {
    message = buildMatinFallback(shortened, shortAllOffres);
  }

  await dispatchMessage(message, 'Matin InteractJob', 'matin');
}

// �”€�”€ �•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é �”€�”€
//    SLOT SOIR �€” 17:00 : Bilan Fin de Journée
// �”€�”€ �•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é�•é �”€�”€

function buildSoirBlocks(expiring, freshJobs, concours) {
  const parts = [];

  if (expiring.length > 0) {
    parts.push('⏰ POSTULEZ AVANT EXPIRATION');
    expiring.forEach((j) => {
      const d    = shortDate(j.date_expires);
      const link = j.slug ? utmUrl('/offres/' + j.slug) : utmUrl('/offres');
      parts.push('🔴 ' + j.title + ' — ' + j.city + (d ? ' (expire le ' + d + ')' : '') + '\n👉 ' + link);
    });
    parts.push('');
  }

  if (freshJobs.length > 0) {
    parts.push('💼 OFFRES À NE PAS MANQUER');
    freshJobs.slice(0, 4).forEach((j) => {
      const link = j.slug ? utmUrl('/offres/' + j.slug) : utmUrl('/offres');
      parts.push('✅ ' + j.title + ' — ' + j.city + ' (' + j.contractType + ')\n👉 ' + link);
    });
    parts.push('');
  }

  if (concours.length > 0) {
    parts.push('🏛️ CONCOURS EN COURS');
    concours.forEach((c) => {
      const d = shortDate(c.deadline);
      parts.push('📌 ' + c.organization_fr + (d ? ' — Clôture : ' + d : ''));
    });
  }

  return parts.join('\n');
}

function buildSoirFooter() {
  return (
    '━━━━━━━━━━━━━━━━━━━\n' +
    '📋 Toutes les offres → ' + utmUrl('/offres') + '\n' +
    '📲 Notre chaîne WhatsApp → ' + WA_CHANNEL + '\n' +
    '💬 Partagez avec quelqu\'un qui cherche un emploi 🇲🇦'
  );
}

function buildSoirFallback(expiring, freshJobs, concours) {
  return (
    '🌆 Bilan Fin de Journée — InteractJob.ma\n' +
    '📅 ' + todayLabel() + '\n' +
    '━━━━━━━━━━━━━━━━━━━\n\n' +
    buildSoirBlocks(expiring, freshJobs, concours) + '\n' +
    buildSoirFooter()
  );
}

async function formatSoirWithClaude(expiring, freshJobs, concours) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const body   = buildSoirBlocks(expiring, freshJobs, concours);
  const footer = buildSoirFooter();

  const userPrompt = [
    "Voici les blocs déjà formatés pour le Bilan Fin de Journée d'InteractJob.ma.",
    "Écris UNIQUEMENT un titre accrocheur (commence par 🌆, 1 ligne max) + la date,",
    "puis colle les blocs et le footer tels quels.",
    "",
    "Date : " + todayLabel(),
    "",
    "BLOCS (ne pas modifier) :",
    body,
    "",
    "FOOTER (ne pas modifier) :",
    footer,
    "",
    "Format attendu :",
    "🌆 [titre accrocheur]",
    "📅 " + todayLabel(),
    "━━━━━━━━━━━━━━━━━━━",
    "",
    "[blocs]",
    "",
    "[footer]",
    "",
    "Retourne UNIQUEMENT le message final.",
  ].join("\n");

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1200,
    system: "Tu es community manager d'InteractJob.ma. Tu copies les blocs et liens EXACTEMENT tels que fournis, sans aucune modification.",
    messages: [{ role: 'user', content: userPrompt }],
  });

  const inputTokens2  = response.usage?.input_tokens  || 0;
  const outputTokens2 = response.usage?.output_tokens || 0;
  logTokenUsage('whatsapp-soir', inputTokens2, outputTokens2);

  return (response.content[0]?.text || '').trim();
}


async function sendNuitDigest() {
  const article     = loadLatestBlogArticle();
  const activeCount = countActiveJobs();

  log(`WhatsApp nuit: article=${article?.title || 'aucun'}, ${activeCount} offres actives`);

  let message;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      message = await formatNuitWithClaude(article, activeCount);
      log('WhatsApp nuit: message formaté par Claude �œ“');
    } catch (err) {
      log(`WhatsApp nuit: Claude indisponible (${err.message}) �€” fallback`);
      message = buildNuitFallback(article, activeCount);
    }
  } else {
    message = buildNuitFallback(article, activeCount);
  }

  await dispatchMessage(message, 'Nuit InteractJob', 'nuit');
}

// �”€�”€ Main export �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€

export async function sendWhatsAppDigest(slot = 'matin') {
  log(`WhatsApp: démarrage slot "${slot}"`);
  if (slot === 'soir') return sendSoirDigest();
  if (slot === 'nuit') return sendNuitDigest();
  return sendMatinDigest();
}


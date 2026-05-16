/**
 * WhatsApp Channel Auto-Poster for InteractJob.ma
 *
 * Selects the best jobs scraped in the last 24h, formats a French digest
 * via Claude, then either:
 *   - Sends it via WhatsApp Cloud API  (if WHATSAPP_ACCESS_TOKEN is set)
 *   - Saves it to data/whatsapp-queue.txt for manual copy-paste (fallback)
 *
 * Called with --whatsapp flag; scheduled via PM2 at 09:00 every day.
 */

import Anthropic from '@anthropic-ai/sdk';
import axios     from 'axios';
import fs        from 'fs-extra';
import path      from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH   = path.join(__dirname, '../data/jobs.json');
const QUEUE_PATH  = path.join(__dirname, '../data/whatsapp-queue.txt');

const MAX_JOBS    = 8;
const HOTEL_SECTOR = 'Hôtellerie';
const MIX_SECTORS  = ['IT', 'RH', 'Finance', 'Administratif', 'Commerce'];

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS  = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

// ── Job selection ──────────────────────────────────────────────────────────────

function loadCandidates() {
  let all;
  try {
    all = fs.readJsonSync(JOBS_PATH);
  } catch {
    return [];
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Prefer jobs scraped in the last 24h
  const recent = all.filter(
    (j) => !j.expired && j.date_scraped && new Date(j.date_scraped) >= yesterday
  );

  if (recent.length > 0) return recent;

  // Fallback: most recent non-expired jobs (for testing / slow scrape days)
  log('WhatsApp: aucun job < 24h — utilisation des jobs actifs les plus récents (fallback)');
  return all
    .filter((j) => !j.expired)
    .sort((a, b) => new Date(b.date_scraped || b.postedAt || 0) - new Date(a.date_scraped || a.postedAt || 0))
    .slice(0, 20);
}

function selectJobs(candidates) {
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

// ── Message formatting ─────────────────────────────────────────────────────────

function todayLabel() {
  const d = new Date();
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function buildFallbackMessage(jobs) {
  const hotel = jobs.filter((j) => j.sector === HOTEL_SECTOR);
  const other = jobs.filter((j) => j.sector !== HOTEL_SECTOR);

  const lines = [
    `🌅 Offres du Jour — InteractJob.ma`,
    `📅 ${todayLabel()}`,
    `━━━━━━━━━━━━━━━`,
  ];

  if (hotel.length > 0) {
    lines.push('🏨 HÔTELLERIE & TOURISME');
    hotel.forEach((j) => lines.push(`▸ ${j.title} — ${j.city} (${j.contractType})`));
  }

  if (other.length > 0) {
    lines.push('💼 AUTRES SECTEURS');
    other.forEach((j) => lines.push(`▸ ${j.title} — ${j.city} (${j.contractType})`));
  }

  lines.push(
    '━━━━━━━━━━━━━━━',
    '🔗 Toutes les offres → interactjob.ma',
    '📄 Testez votre CV → interactjob.ma/cv-checker',
    '━━━━━━━━━━━━━━━',
    "💬 Partagez avec quelqu'un qui cherche un emploi 🇲🇦",
  );

  return lines.join('\n');
}

async function formatWithClaude(jobs) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const jobList = jobs.map((j) => ({
    titre:   j.title,
    ville:   j.city,
    secteur: j.sector,
    contrat: j.contractType,
  }));

  const userPrompt =
    `Formate un message WhatsApp pour notre chaîne InteractJob avec ces offres d'aujourd'hui. Format exact à respecter :\n\n` +
    `🌅 Offres du Jour — InteractJob.ma\n` +
    `📅 [jour] [date] [mois] [année]\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🏨 HÔTELLERIE & TOURISME\n` +
    `▸ [titre] — [ville] ([type contrat])\n` +
    `▸ [titre] — [ville] ([type contrat])\n` +
    `💼 AUTRES SECTEURS\n` +
    `▸ [titre] — [ville] ([type contrat])\n` +
    `▸ [titre] — [ville] ([type contrat])\n` +
    `▸ [titre] — [ville] ([type contrat])\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🔗 Toutes les offres → interactjob.ma\n` +
    `📄 Testez votre CV → interactjob.ma/cv-checker\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💬 Partagez avec quelqu'un qui cherche un emploi 🇲🇦\n\n` +
    `Remplace [jour] [date] [mois] [année] par : ${todayLabel()}.\n` +
    `Si aucune offre Hôtellerie, supprime cette section et mets tout sous AUTRES SECTEURS.\n` +
    `Voici les offres : ${JSON.stringify(jobList)}\n\n` +
    `Retourne UNIQUEMENT le message WhatsApp formaté, rien d'autre.`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    system:
      "Tu es le community manager d'InteractJob.ma, le job board marocain #1 pour l'hôtellerie et l'emploi au Maroc. " +
      'Tu rédiges des messages WhatsApp quotidiens engageants, professionnels et bien formatés avec des emojis pertinents. ' +
      'Tes messages sont en français, clairs, donnent envie de cliquer.',
    messages: [{ role: 'user', content: userPrompt }],
  });

  return (response.content[0]?.text || '').trim();
}

// ── WhatsApp Cloud API ─────────────────────────────────────────────────────────

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

// ── Queue file (fallback) ──────────────────────────────────────────────────────

async function saveToQueue(message) {
  const now   = new Date().toISOString();
  const fence = '='.repeat(30);
  const entry = `\n${fence} [${now}] ${fence}\n${message}\n${fence}\n`;
  await fs.appendFile(QUEUE_PATH, entry, 'utf-8');
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function sendWhatsAppDigest() {
  // 1. Load candidate jobs
  const candidates = loadCandidates();

  if (candidates.length === 0) {
    log('WhatsApp: aucun job disponible — digest ignoré');
    return;
  }

  // 2. Select top jobs (Hôtellerie first, then mix)
  const selected = selectJobs(candidates);
  log(`WhatsApp: ${candidates.length} candidat(s), ${selected.length} sélectionné(s)`);

  // 3. Format message
  let message;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      message = await formatWithClaude(selected);
      log('WhatsApp: message formaté par Claude ✓');
    } catch (err) {
      log(`WhatsApp: Claude indisponible (${err.message}) — message généré en fallback`);
      message = buildFallbackMessage(selected);
    }
  } else {
    log('WhatsApp: ANTHROPIC_API_KEY non défini — message généré en fallback');
    message = buildFallbackMessage(selected);
  }

  // 4. Send or save
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    try {
      const result = await sendToChannel(message);
      log(`WhatsApp: ✓ envoyé sur la chaîne — ${JSON.stringify(result)}`);
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      log(`WhatsApp: ✗ envoi échoué (${detail}) — sauvegarde dans whatsapp-queue.txt`);
      await saveToQueue(message);
    }
  } else {
    await saveToQueue(message);
    log('WhatsApp: API non configurée — message sauvegardé dans data/whatsapp-queue.txt');
    log('WhatsApp: copiez-collez le contenu de data/whatsapp-queue.txt dans votre chaîne');
  }
}

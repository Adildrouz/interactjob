/**
 * WhatsApp Channel Auto-Poster for InteractJob.ma
 *
 * Runs daily at 09:00 (Africa/Casablanca) via internal cron in agent.js.
 * 1. Selects top 8 jobs from the last 24h (Hôtellerie first, then mix)
 * 2. Formats the message via Claude API
 * 3. Saves to data/whatsapp-queue.txt
 * 4. Uploads whatsapp-queue.txt to Google Drive (if credentials set)
 * 5. Sends by email to jobinteract@gmail.com
 * 6. Sends via WhatsApp Cloud API (if WHATSAPP_ACCESS_TOKEN set)
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import fs from 'fs-extra';
import { google } from 'googleapis';
import { log } from './logger.js';
import { sendEmail } from './mailer.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const JOBS_PATH  = path.join(__dirname, '../data/jobs.json');
const QUEUE_PATH = path.join(__dirname, '../data/whatsapp-queue.txt');
const SITE_URL   = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j';

const MAX_JOBS     = 8;
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
  try { all = fs.readJsonSync(JOBS_PATH); } catch { return []; }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = all.filter(
    (j) => !j.expired && j.date_scraped && new Date(j.date_scraped) >= yesterday
  );

  if (recent.length > 0) return recent;

  log('WhatsApp: aucun job < 24h — fallback sur les jobs actifs les plus récents');
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
    `🔗 Toutes les offres → ${SITE_URL}`,
    `📄 Testez votre CV → ${SITE_URL}/cv-checker`,
    `📲 Notre chaîne WhatsApp → ${WA_CHANNEL}`,
    '━━━━━━━━━━━━━━━',
    "💬 Partagez avec quelqu'un qui cherche un emploi 🇲🇦",
  );
  return lines.join('\n');
}

async function formatWithClaude(jobs) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const jobList = jobs.map((j) => ({
    titre: j.title, ville: j.city, secteur: j.sector, contrat: j.contractType,
  }));

  const userPrompt =
    `Formate un message WhatsApp pour notre chaîne InteractJob. Format EXACT à respecter :\n\n` +
    `🌅 Offres du Jour — InteractJob.ma\n` +
    `📅 [Jour] [Date] [Mois] [Année]\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🏨 HÔTELLERIE & TOURISME\n` +
    `▸ [titre] — [ville] ([contrat])\n` +
    `▸ [titre] — [ville] ([contrat])\n` +
    `💼 AUTRES SECTEURS\n` +
    `▸ [titre] — [ville] ([contrat])\n` +
    `▸ [titre] — [ville] ([contrat])\n` +
    `▸ [titre] — [ville] ([contrat])\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🔗 Toutes les offres → interactjob.ma\n` +
    `📄 Testez votre CV → interactjob.ma/cv-checker\n` +
    `📲 Notre chaîne WhatsApp → ${WA_CHANNEL}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💬 Partagez avec quelqu'un qui cherche un emploi 🇲🇦\n\n` +
    `Remplace [Jour] [Date] [Mois] [Année] par : ${todayLabel()}.\n` +
    `Si aucune offre Hôtellerie, supprime cette section et mets tout sous AUTRES SECTEURS.\n` +
    `Offres : ${JSON.stringify(jobList)}\n` +
    `Retourne UNIQUEMENT le message formaté.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system:
      "Tu es le community manager d'InteractJob.ma, job board marocain spécialisé hôtellerie et emploi. " +
      'Tu rédiges des messages WhatsApp quotidiens engageants avec emojis. Messages en français, clairs, donnent envie de cliquer.',
    messages: [{ role: 'user', content: userPrompt }],
  });

  return (response.content[0]?.text || '').trim();
}

// ── Google Drive upload ────────────────────────────────────────────────────────

async function uploadToGoogleDrive() {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !keyRaw) {
    log('Drive: credentials non définis — upload ignoré');
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

    // Find or create folder
    const folderSearch = await drive.files.list({
      q:      `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
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

    // Check if file already exists in that folder
    const fileSearch = await drive.files.list({
      q:      `name='whatsapp-queue.txt' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    const { createReadStream } = await import('fs');
    const media = { mimeType: 'text/plain', body: createReadStream(QUEUE_PATH) };

    if (fileSearch.data.files.length > 0) {
      await drive.files.update({ fileId: fileSearch.data.files[0].id, media });
    } else {
      await drive.files.create({
        requestBody: { name: 'whatsapp-queue.txt', parents: [folderId] },
        media,
        fields: 'id',
      });
    }

    log('Drive: ✓ whatsapp-queue.txt uploadé dans Google Drive');
  } catch (err) {
    log(`Drive: ✗ upload échoué — ${err.message}`);
  }
}

// ── Queue file + WhatsApp Cloud API ───────────────────────────────────────────

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

// ── Main export ────────────────────────────────────────────────────────────────

export async function sendWhatsAppDigest() {
  const candidates = loadCandidates();
  if (candidates.length === 0) {
    log('WhatsApp: aucun job disponible — digest ignoré');
    return;
  }

  const selected = selectJobs(candidates);
  log(`WhatsApp: ${candidates.length} candidat(s), ${selected.length} sélectionné(s)`);

  // Format message
  let message;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      message = await formatWithClaude(selected);
      log('WhatsApp: message formaté par Claude ✓');
    } catch (err) {
      log(`WhatsApp: Claude indisponible (${err.message}) — fallback texte brut`);
      message = buildFallbackMessage(selected);
    }
  } else {
    log('WhatsApp: ANTHROPIC_API_KEY non défini — fallback texte brut');
    message = buildFallbackMessage(selected);
  }

  // A) Save locally
  await appendToQueue(message);
  log(`WhatsApp: message sauvegardé → data/whatsapp-queue.txt`);

  // B) Upload to Google Drive
  await uploadToGoogleDrive();

  // C) Send by email
  const today = new Date().toISOString().split('T')[0];
  try {
    await sendEmail({
      to:      'jobinteract@gmail.com',
      subject: `📱 Message WhatsApp InteractJob — ${today}`,
      text:
        message +
        '\n\n---\nCe message a été généré automatiquement par l\'agent InteractJob. ' +
        'Copiez-le et postez-le dans votre chaîne WhatsApp.',
    });
  } catch (err) {
    log(`WhatsApp: envoi email échoué — ${err.message}`);
  }

  // D) Send via WhatsApp Cloud API (optional)
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    try {
      const result = await sendToChannel(message);
      log(`WhatsApp: ✓ envoyé sur la chaîne — ${JSON.stringify(result)}`);
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      log(`WhatsApp: ✗ envoi API échoué — ${detail}`);
    }
  } else {
    log('WhatsApp: WHATSAPP_ACCESS_TOKEN non défini — envoi API ignoré');
  }
}

/**
 * WhatsApp Channel Auto-Poster for InteractJob.ma
 *
 * 3 publications par jour :
 *   09:00 â€” "Offres du Jour"   (matin)  : top 8 jobs des derniÃ¨res 24h
 *   17:00 â€” "Bilan du Soir"   (soir)   : offres expirant bientÃ´t + concours
 *   21:00 â€” "Bonne SoirÃ©e"    (nuit)   : article blog + conseil CV + service CV pro
 *
 * Usage :
 *   node agent.js --whatsapp            â†’ matin
 *   node agent.js --whatsapp-soir       â†’ soir
 *   node agent.js --whatsapp-nuit       â†’ nuit
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

const JOBS_PATH     = path.join(__dirname, '../data/jobs.json');
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');
const CONCOURS_PATH = path.join(__dirname, '../data/concours.json');
const QUEUE_PATH    = path.join(__dirname, '../data/whatsapp-queue.txt');
const SITE_URL      = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const WA_CHANNEL    = 'https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j';

const MAX_JOBS     = 8;
const HOTEL_SECTOR = 'HÃ´tellerie';
const MIX_SECTORS  = ['IT', 'RH', 'Finance', 'Administratif', 'Commerce'];

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS  = [
  'janvier', 'fÃ©vrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aoÃ»t', 'septembre', 'octobre', 'novembre', 'dÃ©cembre',
];

// â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Queue + Channel helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    log('Drive: credentials non dÃ©finis â€” upload ignorÃ©');
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
    log('Drive: âœ“ whatsapp-queue.txt uploadÃ©');
  } catch (err) {
    log(`Drive: âœ— upload Ã©chouÃ© â€” ${err.message}`);
  }
}

async function dispatchMessage(message, emailSubject) {
  await appendToQueue(message);
  log(`WhatsApp: message sauvegardÃ© â†’ data/whatsapp-queue.txt`);
  await uploadToGoogleDrive();

  const today = new Date().toISOString().split('T')[0];
  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `${emailSubject} â€” ${today}`,
      text:
        message +
        '\n\n---\nCe message a Ã©tÃ© gÃ©nÃ©rÃ© automatiquement par l\'agent InteractJob. ' +
        'Copiez-le et postez-le dans votre chaÃ®ne WhatsApp.',
    });
  } catch (err) {
    log(`WhatsApp: envoi email Ã©chouÃ© â€” ${err.message}`);
  }

  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    try {
      const result = await sendToChannel(message);
      log(`WhatsApp: âœ“ envoyÃ© sur la chaÃ®ne â€” ${JSON.stringify(result)}`);
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      log(`WhatsApp: âœ— envoi API Ã©chouÃ© â€” ${detail}`);
    }
  } else {
    log('WhatsApp: WHATSAPP_ACCESS_TOKEN non dÃ©fini â€” envoi API ignorÃ©');
  }
}

// â”€â”€ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”€â”€
//    SLOT MATIN â€” 09:00 : Offres du Jour
// â”€â”€ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”€â”€

function loadMatinCandidates() {
  const all = loadAllJobs();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = all.filter(
    (j) => !j.expired && j.date_scraped && new Date(j.date_scraped) >= yesterday
  );
  if (recent.length > 0) return recent;
  log('WhatsApp matin: aucun job < 24h â€” fallback sur les jobs actifs rÃ©cents');
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

function buildMatinFallback(jobs) {
  const hotel = jobs.filter((j) => j.sector === HOTEL_SECTOR);
  const other = jobs.filter((j) => j.sector !== HOTEL_SECTOR);
  const lines = [
    `ðŸŒ… Offres du Jour â€” InteractJob.ma`,
    `ðŸ“… ${todayLabel()}`,
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
  ];
  if (hotel.length > 0) {
    lines.push('ðŸ¨ HÃ”TELLERIE & TOURISME');
    hotel.forEach((j) => lines.push(`â–¸ ${j.title} â€” ${j.city} (${j.contractType})`));
  }
  if (other.length > 0) {
    lines.push('ðŸ’¼ AUTRES SECTEURS');
    other.forEach((j) => lines.push(`â–¸ ${j.title} â€” ${j.city} (${j.contractType})`));
  }
  lines.push(
    'â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”',
    `ðŸ”— Toutes les offres â†’ ${SITE_URL}`,
    `ðŸ“„ Testez votre CV â†’ ${SITE_URL}/cv-checker`,
    `ðŸ“² Notre chaÃ®ne WhatsApp â†’ ${WA_CHANNEL}`,
    'â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”',
    "ðŸ’¬ Partagez avec quelqu'un qui cherche un emploi ðŸ‡²ðŸ‡¦",
  );
  return lines.join('\n');
}

async function formatMatinWithClaude(jobs) {
  const client   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const jobList  = jobs.map((j) => ({ titre: j.title, ville: j.city, secteur: j.sector, contrat: j.contractType }));
  const userPrompt =
    `Formate un message WhatsApp pour notre chaÃ®ne InteractJob. Format EXACT Ã  respecter :\n\n` +
    `ðŸŒ… Offres du Jour â€” InteractJob.ma\n` +
    `ðŸ“… [Jour] [Date] [Mois] [AnnÃ©e]\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `ðŸ¨ HÃ”TELLERIE & TOURISME\n` +
    `â–¸ [titre] â€” [ville] ([contrat])\n` +
    `â–¸ [titre] â€” [ville] ([contrat])\n` +
    `ðŸ’¼ AUTRES SECTEURS\n` +
    `â–¸ [titre] â€” [ville] ([contrat])\n` +
    `â–¸ [titre] â€” [ville] ([contrat])\n` +
    `â–¸ [titre] â€” [ville] ([contrat])\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `ðŸ”— Toutes les offres â†’ interactjob.ma\n` +
    `ðŸ“„ Testez votre CV â†’ interactjob.ma/cv-checker\n` +
    `ðŸ“² Notre chaÃ®ne WhatsApp â†’ ${WA_CHANNEL}\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `ðŸ’¬ Partagez avec quelqu'un qui cherche un emploi ðŸ‡²ðŸ‡¦\n\n` +
    `Remplace [Jour] [Date] [Mois] [AnnÃ©e] par : ${todayLabel()}.\n` +
    `Si aucune offre HÃ´tellerie, supprime cette section et mets tout sous AUTRES SECTEURS.\n` +
    `Offres : ${JSON.stringify(jobList)}\n` +
    `Retourne UNIQUEMENT le message formatÃ©.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system:
      "Tu es le community manager d'InteractJob.ma, job board marocain spÃ©cialisÃ© hÃ´tellerie et emploi. " +
      'Tu rÃ©diges des messages WhatsApp quotidiens engageants avec emojis. Messages en franÃ§ais, clairs, donnent envie de cliquer.',
    messages: [{ role: 'user', content: userPrompt }],
  });
  return (response.content[0]?.text || '').trim();
}

async function sendMatinDigest() {
  const candidates = loadMatinCandidates();
  if (candidates.length === 0) {
    log('WhatsApp matin: aucun job disponible â€” digest ignorÃ©');
    return;
  }
  const selected = selectMatinJobs(candidates);
  log(`WhatsApp matin: ${candidates.length} candidat(s), ${selected.length} sÃ©lectionnÃ©(s)`);

  let message;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      message = await formatMatinWithClaude(selected);
      log('WhatsApp matin: message formatÃ© par Claude âœ“');
    } catch (err) {
      log(`WhatsApp matin: Claude indisponible (${err.message}) â€” fallback`);
      message = buildMatinFallback(selected);
    }
  } else {
    message = buildMatinFallback(selected);
  }

  await dispatchMessage(message, 'ðŸ“± Message WhatsApp Matin InteractJob');
}

// â”€â”€ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”€â”€
//    SLOT SOIR â€” 17:00 : Bilan Fin de JournÃ©e
// â”€â”€ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”€â”€

function buildSoirFallback(expiring, freshJobs, concours) {
  const lines = [
    `ðŸŒ† Bilan Fin de JournÃ©e â€” InteractJob.ma`,
    `ðŸ“… ${todayLabel()}`,
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
  ];

  if (expiring.length > 0) {
    lines.push(`â° POSTULEZ AVANT EXPIRATION`);
    expiring.forEach((j) => {
      const d = shortDate(j.date_expires);
      lines.push(`â–¸ ${j.title} â€” ${j.city}${d ? ` (expire le ${d})` : ''}`);
    });
  }

  if (freshJobs.length > 0) {
    lines.push(`ðŸ’¼ OFFRES Ã€ NE PAS MANQUER`);
    freshJobs.slice(0, 4).forEach((j) => lines.push(`â–¸ ${j.title} â€” ${j.city} (${j.contractType})`));
  }

  if (concours.length > 0) {
    lines.push(`ðŸ›ï¸ CONCOURS PUBLICS EN COURS`);
    concours.forEach((c) => {
      const d = shortDate(c.deadline);
      lines.push(`â–¸ ${c.organization_fr}${d ? ` â€” ClÃ´ture: ${d}` : ''}`);
    });
  }

  lines.push(
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
    `ðŸ”— Toutes les offres â†’ ${SITE_URL}`,
    `ðŸ“„ CV Professionnel 199 MAD â†’ ${SITE_URL}/services-cv`,
    `ðŸ“² ${WA_CHANNEL}`,
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
    `ðŸ’¬ Partagez avec quelqu'un qui cherche un emploi ðŸ‡²ðŸ‡¦`,
  );
  return lines.join('\n');
}

async function formatSoirWithClaude(expiring, freshJobs, concours) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const expiringList = expiring.map((j) => ({
    titre: j.title, ville: j.city, expire: j.date_expires ? shortDate(j.date_expires) : null,
  }));
  const freshList = freshJobs.map((j) => ({
    titre: j.title, ville: j.city, contrat: j.contractType, secteur: j.sector,
  }));
  const concoursList = concours.map((c) => ({
    org: c.organization_fr, cloture: c.deadline ? shortDate(c.deadline) : null,
  }));

  const prompt =
    `RÃ©dige un message WhatsApp "Bilan Fin de JournÃ©e" pour la chaÃ®ne InteractJob.ma.\n\n` +
    `Format OBLIGATOIRE (respecte les emojis et sÃ©parateurs) :\n` +
    `ðŸŒ† Bilan Fin de JournÃ©e â€” InteractJob.ma\n` +
    `ðŸ“… ${todayLabel()}\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    (expiring.length > 0 ?
      `â° POSTULEZ AVANT EXPIRATION\nâ–¸ [titre] â€” [ville] (expire le [date])\n` : '') +
    `ðŸ’¼ OFFRES Ã€ NE PAS MANQUER\nâ–¸ [titre] â€” [ville] ([contrat])\nâ–¸ [titre] â€” [ville] ([contrat])\n` +
    (concours.length > 0 ?
      `ðŸ›ï¸ CONCOURS EN COURS\nâ–¸ [organisation] â€” ClÃ´ture: [date]\n` : '') +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `ðŸ”— ${SITE_URL} | ðŸ“„ CV Pro â†’ ${SITE_URL}/services-cv\n` +
    `ðŸ“² ${WA_CHANNEL}\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `ðŸ’¬ Partagez avec quelqu'un qui cherche un emploi ðŸ‡²ðŸ‡¦\n\n` +
    `DonnÃ©es :\n` +
    `Offres expirant bientÃ´t : ${JSON.stringify(expiringList)}\n` +
    `Offres fraÃ®ches : ${JSON.stringify(freshList)}\n` +
    (concours.length > 0 ? `Concours : ${JSON.stringify(concoursList)}\n` : '') +
    `Retourne UNIQUEMENT le message formatÃ©.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system:
      "Tu es le community manager d'InteractJob.ma. " +
      "Tu rÃ©diges un message WhatsApp de fin de journÃ©e engageant pour la communautÃ© marocaine Ã  la recherche d'emploi. " +
      "CrÃ©e un sentiment d'urgence pour les offres qui expirent. Ton professionnel, emojis stratÃ©giques.",
    messages: [{ role: 'user', content: prompt }],
  });
  return (response.content[0]?.text || '').trim();
}

async function sendSoirDigest() {
  const allJobs   = loadAllJobs();
  const expiring  = getExpiringSoon(allJobs);
  const freshJobs = allJobs
    .filter((j) => !j.expired && !expiring.find((e) => e.id === j.id))
    .slice(0, 5);
  const concours  = loadActiveConcours();

  log(`WhatsApp soir: ${expiring.length} expirant bientÃ´t, ${freshJobs.length} offres fraÃ®ches, ${concours.length} concours`);

  let message;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      message = await formatSoirWithClaude(expiring, freshJobs, concours);
      log('WhatsApp soir: message formatÃ© par Claude âœ“');
    } catch (err) {
      log(`WhatsApp soir: Claude indisponible (${err.message}) â€” fallback`);
      message = buildSoirFallback(expiring, freshJobs, concours);
    }
  } else {
    message = buildSoirFallback(expiring, freshJobs, concours);
  }

  await dispatchMessage(message, 'ðŸŒ† WhatsApp Soir InteractJob');
}

// â”€â”€ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”€â”€
//    SLOT NUIT â€” 21:00 : Bonne SoirÃ©e
// â”€â”€ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”€â”€

function buildNuitFallback(article, activeCount) {
  const lines = [
    `ðŸŒ™ Bonne SoirÃ©e â€” InteractJob.ma`,
    `ðŸ“… ${todayLabel()}`,
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
  ];

  if (article) {
    lines.push(
      `âœï¸ L'ARTICLE DU JOUR`,
      `ðŸ“Œ ${article.title}`,
      article.excerpt ? `${article.excerpt.slice(0, 100)}â€¦` : '',
      `â†’ ${SITE_URL}/blog/${article.slug}`,
      ``,
    );
  }

  lines.push(
    `ðŸ’¡ CONSEIL CV DU SOIR`,
    `Adaptez votre CV Ã  chaque offre : titre, compÃ©tences clÃ©s, lettre de motivation personnalisÃ©e.`,
    ``,
    `ðŸ“„ CV PROFESSIONNEL â€” 199 MAD`,
    `RÃ©digÃ© par un DRH expert Â· Format Word + PDF Â· Livraison 48h`,
    `â†’ ${SITE_URL}/services-cv`,
    ``,
    `ðŸ’¼ ${activeCount}+ offres actives sur InteractJob.ma`,
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
    `ðŸ”— ${SITE_URL}`,
    `ðŸ“² ${WA_CHANNEL}`,
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
    `ðŸ’¬ Bonne chance pour votre recherche d'emploi ðŸ‡²ðŸ‡¦`,
  );
  return lines.join('\n');
}

async function formatNuitWithClaude(article, activeCount) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt =
    `RÃ©dige un message WhatsApp "Bonne SoirÃ©e" pour la chaÃ®ne InteractJob.ma.\n\n` +
    `Format OBLIGATOIRE :\n` +
    `ðŸŒ™ Bonne SoirÃ©e â€” InteractJob.ma\n` +
    `ðŸ“… ${todayLabel()}\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    (article ?
      `âœï¸ L'ARTICLE DU JOUR\nðŸ“Œ "${article.title}"\n[1 phrase d'accroche sur l'utilitÃ© de cet article]\nâ†’ ${SITE_URL}/blog/${article.slug}\n\n` :
      ``) +
    `ðŸ’¡ CONSEIL CV DU SOIR\n[1 conseil pratique et original sur le CV ou la recherche d'emploi au Maroc â€” pas de gÃ©nÃ©ralitÃ©s, sois prÃ©cis]\n\n` +
    `ðŸ“„ CV PROFESSIONNEL â€” 199 MAD\nRÃ©digÃ© par un DRH expert (8 ans exp.) Â· Format Word + PDF Â· Livraison 48h\nâ†’ ${SITE_URL}/services-cv\n\n` +
    `ðŸ’¼ ${activeCount}+ offres actives sur InteractJob.ma\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `ðŸ”— ${SITE_URL}\n` +
    `ðŸ“² ${WA_CHANNEL}\n` +
    `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
    `ðŸ’¬ Bonne chance pour votre recherche d'emploi ðŸ‡²ðŸ‡¦\n\n` +
    (article ? `Article : "${article.title}" â€” ${article.excerpt}\n` : ``) +
    `Retourne UNIQUEMENT le message formatÃ©.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system:
      "Tu es le community manager d'InteractJob.ma. " +
      "RÃ©dige un message WhatsApp du soir chaleureux, inspirant et pratique pour les candidats marocains. " +
      "Le conseil CV doit Ãªtre concret et actionnable â€” pas de platitude. " +
      "Ton positif, emojis appropriÃ©s, donne envie d'agir ce soir.",
    messages: [{ role: 'user', content: prompt }],
  });
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
      log('WhatsApp nuit: message formatÃ© par Claude âœ“');
    } catch (err) {
      log(`WhatsApp nuit: Claude indisponible (${err.message}) â€” fallback`);
      message = buildNuitFallback(article, activeCount);
    }
  } else {
    message = buildNuitFallback(article, activeCount);
  }

  await dispatchMessage(message, 'ðŸŒ™ WhatsApp Nuit InteractJob');
}

// â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function sendWhatsAppDigest(slot = 'matin') {
  log(`WhatsApp: dÃ©marrage slot "${slot}"`);
  if (slot === 'soir') return sendSoirDigest();
  if (slot === 'nuit') return sendNuitDigest();
  return sendMatinDigest();
}


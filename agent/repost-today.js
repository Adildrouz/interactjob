/**
 * One-shot script — re-post today's 6 jobs to LinkedIn with correct URLs + hashtags.
 * Usage: node repost-today.js
 * Run from the agent/ directory with .env loaded.
 */
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { log, initLogger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH  = path.join(__dirname, '../data/jobs.json');
const SITE_URL   = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const DELAY_MS   = 15 * 60 * 1000; // 15 min

// ── Hashtag sets ──────────────────────────────────────────────────────────────

const SECTOR_TAGS = {
  'IT':            '#IT #Tech #Informatique #Développeur',
  'Commerce':      '#Commerce #Vente #Business',
  'Marketing':     '#Marketing #Digital #Communication',
  'Finance':       '#Finance #Comptabilité #Audit',
  'RH':            '#RH #RessourcesHumaines #GRH',
  'Industrie':     '#Industrie #Ingénierie #Technique',
  'Logistique':    '#Logistique #SupplyChain #Transport',
  'Santé':         '#Santé #Médical #Pharmacie',
  'Hôtellerie':    '#Hôtellerie #Tourisme #Restauration',
  'BTP':           '#BTP #Construction #Immobilier',
  'Éducation':     '#Éducation #Formation #Enseignement',
  'Administratif': '#Administratif #Secrétariat #Gestion',
  'Autre':         '#Emploi #Opportunité',
};

const CONTRACT_TAGS = {
  CDI:   '#CDI',
  CDD:   '#CDD',
  Stage: '#Stage #Stagiaire',
};

const CITY_TAGS = {
  Casablanca: '#Casablanca',
  Rabat:      '#Rabat',
  Marrakech:  '#Marrakech',
  Tanger:     '#Tanger',
  Agadir:     '#Agadir',
  Fès:        '#Fès',
  Oujda:      '#Oujda',
  Meknès:     '#Meknès',
};

function buildHashtags(job) {
  const tags = ['#EmploiMaroc', '#Recrutement', '#Maroc', '#InteractJob'];

  const sector = SECTOR_TAGS[job.sector] || SECTOR_TAGS['Autre'];
  tags.push(sector);

  const contract = CONTRACT_TAGS[job.contractType];
  if (contract) tags.push(contract);

  const city = CITY_TAGS[job.city];
  if (city) tags.push(city);

  return tags.join(' ');
}

function buildCaption(job) {
  const canonicalUrl = `${SITE_URL}/offres/${job.slug}`;
  const hashtags     = buildHashtags(job);

  // Take the existing caption body but strip any old interactjob.ma/offres/* URL
  let body = (job.linkedin_caption || '')
    .replace(/https?:\/\/(?:www\.)?interactjob\.ma\/offres\/[^\s\n]*/g, '')
    .replace(/Postuler\s*→\s*/g, '')
    .trim();

  // Remove trailing WhatsApp line if already there (we'll re-add clean)
  body = body.replace(/📲.*whatsapp\.com[^\n]*/gi, '').trim();

  return (
    `${body}\n\n` +
    `🔗 Postuler → ${canonicalUrl}\n\n` +
    `📲 Offres quotidiennes sur notre chaîne WhatsApp → https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j\n\n` +
    hashtags
  );
}

async function resolvePersonUrn(accessToken) {
  if (process.env.LINKEDIN_AUTHOR_URN) return process.env.LINKEDIN_AUTHOR_URN;
  const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const id = res.data.sub;
  if (!id) throw new Error('Impossible de récupérer le person ID LinkedIn');
  return `urn:li:person:${id}`;
}

async function publishJob(job, personUrn, accessToken) {
  const url     = `${SITE_URL}/offres/${job.slug}`;
  const text    = buildCaption(job);
  const title   = (job.meta_title || `${job.title} – ${job.city}`).slice(0, 200);
  const desc    = (job.meta_description || `Offre d'emploi ${job.contractType} à ${job.city}`).slice(0, 256);

  const res = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary:    { text },
          shareMediaCategory: 'ARTICLE',
          media: [{ status: 'READY', originalUrl: url, title: { text: title }, description: { text: desc } }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    },
    {
      headers: {
        Authorization:               `Bearer ${accessToken}`,
        'Content-Type':              'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );
  return res.headers['x-restli-id'] || res.data?.id || 'ok';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  initLogger();

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!accessToken) { log('LINKEDIN_ACCESS_TOKEN manquant'); process.exit(1); }

  const allJobs = await fs.readJson(JOBS_PATH);
  const today   = new Date().toISOString().split('T')[0];

  const toPost = allJobs
    .filter(j => j.date_scraped && j.date_scraped.startsWith(today) && j.slug)
    .sort((a, b) => new Date(a.date_scraped) - new Date(b.date_scraped))
    .slice(0, 6);

  if (toPost.length === 0) {
    log('Aucun job trouvé pour aujourd\'hui');
    process.exit(0);
  }

  log(`${toPost.length} jobs à reposter — intervalle 15 min entre chaque`);

  const personUrn = await resolvePersonUrn(accessToken);
  log(`Profil LinkedIn : ${personUrn}`);

  for (let i = 0; i < toPost.length; i++) {
    const job = toPost[i];
    const num = `[${i + 1}/${toPost.length}]`;

    log(`${num} Publication : "${job.title}" — ${SITE_URL}/offres/${job.slug}`);

    try {
      const postId = await publishJob(job, personUrn, accessToken);
      log(`${num} ✓ Posté — ${postId}`);
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message || err.message;
      log(`${num} ✗ ERREUR [${status || 'ERR'}] — ${msg}`);
    }

    if (i < toPost.length - 1) {
      const mins = DELAY_MS / 60000;
      log(`${num} Pause ${mins} min avant le prochain post...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  log('✓ Re-post terminé');
}

main().catch(err => { console.error(err); process.exit(1); });

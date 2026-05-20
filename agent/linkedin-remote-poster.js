/**
 * InteractJob — LinkedIn Remote Jobs Poster
 * Reads data/remote-jobs.json, picks 5 recent jobs (last 24h),
 * generates a formatted post for each, publishes with 30-min delay.
 * Reuses the same LINKEDIN_ACCESS_TOKEN as the main agent.
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { publishTextPost } from './linkedin.js';
import { initLogger, log } from './logger.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const DATA_PATH     = path.join(__dirname, '../data/remote-jobs.json');
const REMOTE_URL    = 'https://interactjob.ma/offres/remote';
const DELAY_MS      = process.env.REMOTE_POST_DELAY ? parseInt(process.env.REMOTE_POST_DELAY) : 30 * 60 * 1000;
const MAX_POSTS     = 5;
const WINDOW_24H    = 24 * 60 * 60 * 1000;

const HASHTAGS = '#RemoteWork #TravailDistanciel #JobsRemote #MarocJobs #InteractJob #WorkFromAnywhere';

const CATEGORY_HASHTAG = {
  Development:       '#Development #Tech #Coding',
  Marketing:         '#Marketing #DigitalMarketing',
  Design:            '#Design #UX #UI',
  HR:                '#RH #HumanResources',
  Finance:           '#Finance #Comptabilité',
  'Customer Support':'#CustomerSuccess #Support',
  Product:           '#ProductManagement #PM',
  General:           '#Remote',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const min = Math.floor(diff / 60_000);
  if (h >= 24) return `il y a ${Math.floor(h / 24)}j`;
  if (h >= 1)  return `il y a ${h}h`;
  return `il y a ${min}min`;
}

function buildPost(job) {
  const summary = (job.summary || '').slice(0, 150);
  const catTag  = CATEGORY_HASHTAG[job.category] ?? '#Remote';
  const pubStr  = relativeTime(job.published);

  return [
    `🌍 ${job.title} — Remote Global`,
    ``,
    `🏢 Entreprise : ${job.company}`,
    `📂 Catégorie : ${job.category}`,
    `⏰ Publié : ${pubStr}`,
    ``,
    summary ? summary : '100% remote, candidature ouverte à l\'international.',
    ``,
    `✅ 100% Remote — Travaillez de partout`,
    `✅ Candidature internationale acceptée`,
    ``,
    `🔗 Postuler directement :`,
    job.link,
    ``,
    `📌 Plus d'offres remote → ${REMOTE_URL}`,
    ``,
    `${HASHTAGS} ${catTag}`,
  ].join('\n');
}

async function main() {
  initLogger();
  log('LinkedIn Remote: démarrage');

  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    log('LinkedIn Remote: LINKEDIN_ACCESS_TOKEN non défini — publication ignorée');
    return;
  }

  // Load remote jobs
  let jobs = [];
  try {
    jobs = await fs.readJson(DATA_PATH);
  } catch {
    log('LinkedIn Remote: remote-jobs.json introuvable — exécute d\'abord remote-scraper.js');
    return;
  }

  // Filter last 24h
  const cutoff = Date.now() - WINDOW_24H;
  const recent = jobs.filter(j => new Date(j.published).getTime() > cutoff);

  if (recent.length === 0) {
    log('LinkedIn Remote: aucune offre récente (24h) — publication ignorée');
    return;
  }

  // Shuffle and pick MAX_POSTS
  const shuffled = recent.sort(() => Math.random() - 0.5).slice(0, MAX_POSTS);
  const delayMin = Math.round(DELAY_MS / 60000);
  log(`LinkedIn Remote: ${shuffled.length} post(s) à publier (délai ${delayMin > 0 ? delayMin + ' min' : DELAY_MS / 1000 + 's'} entre chaque)`);

  for (let i = 0; i < shuffled.length; i++) {
    const job  = shuffled[i];
    const text = buildPost(job);

    const postId = await publishTextPost(text);
    if (postId) {
      log(`LinkedIn Remote: ✓ [${i + 1}/${shuffled.length}] "${job.title}" — ${postId}`);
    } else {
      log(`LinkedIn Remote: ✗ [${i + 1}/${shuffled.length}] "${job.title}" — publication échouée`);
    }

    if (i < shuffled.length - 1) {
      log(`LinkedIn Remote: pause de ${Math.round(DELAY_MS / 1000)}s avant le prochain post…`);
      await sleep(DELAY_MS);
    }
  }

  log('LinkedIn Remote: terminé avec succès');
}

main().catch(err => {
  log(`LinkedIn Remote: ERREUR FATALE — ${err.message}`);
  console.error(err);
  process.exit(1);
});

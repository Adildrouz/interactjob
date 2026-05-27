/**
 * InteractJob — LinkedIn Remote Jobs Poster
 * Reads data/remote-jobs.json, picks up to 3 recent jobs not yet posted,
 * generates a formatted post for each, publishes with 3-min delay.
 * Reuses the same LINKEDIN_ACCESS_TOKEN as the main agent.
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { publishTextPost } from './linkedin.js';
import { pushToGithub } from './github-sync.js';
import { initLogger, log } from './logger.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const DATA_PATH        = path.join(__dirname, '../data/remote-jobs.json');
const POSTED_PATH      = path.join(__dirname, '../data/posted-remote-jobs.json');
const REMOTE_URL       = 'https://www.interactjob.ma/offres/remote';
const DELAY_MS         = 3 * 60 * 1000; // 3 min between posts
const MAX_POSTS        = 3;
const WINDOW_RECENT    = 30 * 24 * 60 * 60 * 1000; // prefer jobs from the last 30 days
const POSTED_RETENTION = 60 * 24 * 60 * 60 * 1000; // remember posted jobs 60 days → never re-share

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

function loadPostedIds() {
  try {
    const data = fs.readJsonSync(POSTED_PATH);
    // Clean entries older than the retention window to avoid unbounded growth
    const cutoff = Date.now() - POSTED_RETENTION;
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, ts]) => new Date(ts).getTime() > cutoff)
    );
    return cleaned;
  } catch {
    return {};
  }
}

function savePostedId(jobId) {
  const posted = loadPostedIds();
  posted[jobId] = new Date().toISOString();
  fs.writeJsonSync(POSTED_PATH, posted, { spaces: 2 });
}

function buildPost(job) {
  const summary = (job.summary || '').slice(0, 150);
  const catTag  = CATEGORY_HASHTAG[job.category] ?? '#Remote';
  const pubStr  = relativeTime(job.published);
  const jobUrl  = `${REMOTE_URL}/${job.id}`;

  return [
    `🌍 ${job.title} — Remote Global`,
    ``,
    `🏢 Entreprise : ${job.company}`,
    `📂 Catégorie : ${job.category}`,
    `⏰ Publié : ${pubStr}`,
    ``,
    summary || '100% remote, candidature ouverte à l\'international.',
    ``,
    `✅ 100% Remote — Travaillez de partout`,
    `✅ Candidature internationale acceptée`,
    ``,
    `🔗 Voir l'offre complète :`,
    jobUrl,
    ``,
    `${HASHTAGS} ${catTag}`,
  ].join('\n');
}

async function main() {
  initLogger();
  log('LinkedIn Remote: démarrage');

  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    log('LinkedIn Remote: LINKEDIN_ACCESS_TOKEN non défini — publication ignorée');
    process.exit(0);
  }

  // Load remote jobs
  let jobs = [];
  try {
    jobs = await fs.readJson(DATA_PATH);
  } catch {
    log('LinkedIn Remote: remote-jobs.json introuvable — exécute d\'abord remote-scraper.js');
    process.exit(0);
  }

  // Load already-posted IDs
  const postedIds = loadPostedIds();

  // Always post fresh content: pick the most recent UNPOSTED jobs.
  // Prefer the last 30 days; if none, fall back to any unposted job so the
  // USA/global audience always gets new remote offers.
  const recentCutoff = Date.now() - WINDOW_RECENT;
  const byNewest = (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime();

  let candidates = jobs
    .filter(j => !postedIds[j.id] && new Date(j.published).getTime() > recentCutoff)
    .sort(byNewest);

  if (candidates.length === 0) {
    candidates = jobs.filter(j => !postedIds[j.id]).sort(byNewest);
  }

  if (candidates.length === 0) {
    log('LinkedIn Remote: aucune offre non publiée disponible — publication ignorée');
    process.exit(0);
  }

  // Pick the most recent MAX_POSTS unposted offers
  const toPost = candidates.slice(0, MAX_POSTS);
  log(`LinkedIn Remote: ${toPost.length} post(s) à publier sur ${candidates.length} offre(s) non publiée(s) — délai ${DELAY_MS / 60000} min`);

  for (let i = 0; i < toPost.length; i++) {
    const job  = toPost[i];
    const text = buildPost(job);

    const postId = await publishTextPost(text);
    if (postId) {
      savePostedId(job.id);
      // Persist dedup state to GitHub (survives Railway's ephemeral filesystem)
      try { await pushToGithub('chore: remote posted state [skip ci]'); }
      catch (err) { log(`LinkedIn Remote: persist state échoué — ${err.message}`); }
      log(`LinkedIn Remote: ✓ [${i + 1}/${toPost.length}] "${job.title}" — ${postId}`);
    } else {
      log(`LinkedIn Remote: ✗ [${i + 1}/${toPost.length}] "${job.title}" — publication échouée`);
    }

    if (i < toPost.length - 1) {
      log(`LinkedIn Remote: pause de ${DELAY_MS / 60000} min…`);
      await sleep(DELAY_MS);
    }
  }

  log('LinkedIn Remote: terminé avec succès');
  process.exit(0);
}

main().catch(err => {
  log(`LinkedIn Remote: ERREUR FATALE — ${err.message}`);
  console.error(err);
  process.exit(1);
});

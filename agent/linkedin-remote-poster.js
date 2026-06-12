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
import Anthropic from '@anthropic-ai/sdk';
import { publishTextPost } from './linkedin.js';
import { pushToGithub } from './github-sync.js';
import { initLogger, log } from './logger.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const DATA_PATH        = path.join(__dirname, '../data/remote-jobs.json');
const POSTED_PATH      = path.join(__dirname, '../data/posted-remote-jobs.json');
// Traffic directed to .com — English-speaking / US-global audience
const REMOTE_URL       = 'https://www.interactjob.com/jobs/remote';
const DELAY_MS         = 3 * 60 * 1000; // 3 min between posts
const MAX_POSTS        = 3;
const WINDOW_RECENT    = 30 * 24 * 60 * 60 * 1000; // prefer jobs from the last 30 days
const POSTED_RETENTION = 60 * 24 * 60 * 60 * 1000; // remember posted jobs 60 days → never re-share

// High-reach, US/global-oriented hashtags (English audience)
const HASHTAGS = '#RemoteJobs #RemoteWork #WorkFromHome #NowHiring #RemoteHiring #WorkFromAnywhere #USAJobs #JobSearch';

const CATEGORY_HASHTAG = {
  Development:       '#SoftwareEngineer #DeveloperJobs #TechJobs',
  Marketing:         '#MarketingJobs #DigitalMarketing #GrowthMarketing',
  Design:            '#DesignJobs #UXDesign #ProductDesign',
  HR:                '#HRJobs #Recruiting #TalentAcquisition',
  Finance:           '#FinanceJobs #Accounting #FinTech',
  'Customer Support':'#CustomerSuccess #SupportJobs',
  Product:           '#ProductManagement #ProductJobs',
  General:           '#RemoteOpportunity #Careers',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Summary cleanup + AI teaser ──────────────────────────────────────────────
let _ai = null;
function getClient() {
  if (!_ai) _ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _ai;
}

// Strip scraped boilerplate prefixes, collapse whitespace, cut at a sentence boundary
function cleanSummary(raw) {
  let s = (raw || '').replace(/\s+/g, ' ').trim();
  const prefix = /^(this is a remote position\.?|job description|description|company overview|company background|role overview|about (the )?(role|us|company|team|position)?|overview|summary)\s*[:.\-–]?\s*/i;
  let prev;
  do { prev = s; s = s.replace(prefix, '').trim(); } while (s !== prev && s);
  if (s.length > 200) {
    const cut = s.slice(0, 200);
    const lastDot = cut.lastIndexOf('. ');
    s = lastDot > 80 ? cut.slice(0, lastDot + 1) : cut.replace(/\s\S*$/, '') + '…';
  }
  return s.trim();
}

// Generate a clean, engaging 1-2 sentence English teaser (falls back to cleanup)
async function makeSummary(job) {
  const fallback = cleanSummary(job.summary) || 'Fully remote role — open to applicants worldwide.';
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const res = await getClient().messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 120,
      system:
        'You write concise, engaging 1-2 sentence English teasers for remote job posts on LinkedIn. ' +
        'No hashtags, no emojis, no "apply now". Just a compelling, factual hook about the role and company. Max 200 characters.',
      messages: [{
        role: 'user',
        content:
          `Job title: ${job.title}\nCompany: ${job.company || 'N/A'}\nField: ${job.category || 'General'}\n` +
          `Raw description: ${(job.summary || '').slice(0, 500)}\n\n` +
          `Write a clean 1-2 sentence English teaser (max 200 characters).`,
      }],
    });
    const text = (res.content[0]?.text || '').trim();
    return text || fallback;
  } catch (err) {
    log(`LinkedIn Remote: résumé IA échoué (${err.message}) — fallback texte brut`);
    return fallback;
  }
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const min = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h >= 1)  return `${h}h ago`;
  return `${min}min ago`;
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

function buildPost(job, summary) {
  const catTag  = CATEGORY_HASHTAG[job.category] ?? '#RemoteOpportunity';
  const pubStr  = relativeTime(job.published);
  const jobUrl  = `${REMOTE_URL}/${job.id}`;

  const company = (job.company || '').trim();
  const hasCompany = company && !/^n\/?a$/i.test(company);

  const lines = [
    `🚀 We're hiring — 100% Remote 🌍`,
    ``,
    `💼 ${job.title}`,
  ];
  if (hasCompany) lines.push(`🏢 Company: ${company}`);
  if (job.category) lines.push(`📂 Field: ${job.category}`);
  lines.push(`🕒 Posted: ${pubStr}`);
  lines.push(``);
  lines.push(summary || 'Fully remote role — open to applicants worldwide.');
  lines.push(``);
  lines.push(`✅ Work from anywhere — US & global applicants welcome`);
  lines.push(`✅ Fully remote, flexible schedule`);
  lines.push(``);
  lines.push(`🔗 View details & apply:`);
  lines.push(jobUrl);
  lines.push(``);
  lines.push(`${HASHTAGS} ${catTag}`);

  return lines.join('\n');
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
    const job     = toPost[i];
    const summary = await makeSummary(job);
    const text    = buildPost(job, summary);

    const postId = await publishTextPost(text);
    if (postId) {
      savePostedId(job.id);
      // Persist dedup state to GitHub (survives Railway's ephemeral filesystem)
      try { await pushToGithub('chore: remote posted state [skip ci]', ['data/posted-remote-jobs.json']); }
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

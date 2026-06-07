/**
 * Twitter/X Job Poster
 *
 * Posts 3 unposted jobs per run to X using OAuth 1.0a.
 * Tracking is stored in MongoDB (collection: x_posted_jobs) so it
 * survives Railway container restarts.
 *
 * Schedule (registered in agent.js):
 *   08:00, 13:00, 18:00 Africa/Casablanca
 *
 * Env vars required:
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 *   MONGODB_URI
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs-extra';
import { log } from './logger.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH  = path.join(__dirname, '../data/jobs.json');
const SITE_URL   = 'https://www.interactjob.ma';

// ── Sector → clean hashtag ────────────────────────────────────────────────────
function sectorTag(sector) {
  return (sector || 'Emploi')
    .split(/[&,\/]/)[0]           // take first word before separators
    .trim()
    .normalize('NFC')
    .replace(/[^a-zA-ZÀ-ÿ0-9]/g, '') // keep letters (incl. accented) + digits
    .slice(0, 20) || 'Emploi';
}

// ── Build tweet (max 280 chars — Twitter counts t.co URLs as 23 chars) ────────
function buildTweet(job) {
  const url     = `${SITE_URL}/offres/${job.slug}`;
  const tag     = sectorTag(job.sector);
  const hashtags = `#EmploiMaroc #Recrutement #JobMaroc #${tag}`;

  // Lines 2–4 are fixed; line 1 may need truncation
  const line2 = `📍 ${job.city || 'Maroc'}, Maroc`;
  const line3 = `➡️ Postulez : ${url}`;
  const line4 = hashtags;

  // Twitter shortens every URL to 23 chars → adjust budget
  const urlActualLen  = url.length;
  const urlTwitterLen = 23;
  const fixedChars    = [line2, line3, line4].join('\n').length
    - urlActualLen + urlTwitterLen + 1; // +1 for the leading newline of line1
  const budgetLine1   = 280 - fixedChars;

  let line1 = `🆕 ${job.title} — ${job.company}`;
  if (line1.length > budgetLine1) {
    line1 = line1.slice(0, budgetLine1 - 1) + '…';
  }

  return [line1, line2, line3, line4].join('\n');
}

// ── MongoDB helpers ───────────────────────────────────────────────────────────
let _mongoClient = null;

async function getCollection() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  if (!_mongoClient) {
    _mongoClient = new MongoClient(process.env.MONGODB_URI);
    await _mongoClient.connect();
  }
  return _mongoClient.db().collection('x_posted_jobs');
}

async function getPostedSlugs(slugs) {
  const col  = await getCollection();
  const docs = await col.find({ slug: { $in: slugs } }, { projection: { slug: 1 } }).toArray();
  return new Set(docs.map((d) => d.slug));
}

async function markPosted(slug) {
  const col = await getCollection();
  await col.updateOne({ slug }, { $set: { slug, postedAt: new Date() } }, { upsert: true });
}

// ── Twitter client ────────────────────────────────────────────────────────────
function getTwitterClient() {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    throw new Error('X credentials not set (X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET)');
  }
  return new TwitterApi({
    appKey:      X_API_KEY,
    appSecret:   X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_TOKEN_SECRET,
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main exported function ────────────────────────────────────────────────────
export async function runTwitterPoster() {
  log('[twitter] Starting...');

  // Load jobs
  let allJobs;
  try {
    allJobs = await fs.readJson(JOBS_PATH);
  } catch (err) {
    log(`[twitter] ❌ Cannot read jobs.json: ${err.message}`);
    return;
  }

  // Filter: active jobs with a slug
  const candidates = allJobs.filter((j) => !j.expired && j.slug);
  if (!candidates.length) {
    log('[twitter] No eligible jobs found');
    return;
  }

  // Check which slugs are already posted in MongoDB
  const slugs = candidates.map((j) => j.slug);
  let postedSet;
  try {
    postedSet = await getPostedSlugs(slugs);
  } catch (err) {
    log(`[twitter] ❌ MongoDB error: ${err.message}`);
    return;
  }

  const toPost = candidates.filter((j) => !postedSet.has(j.slug)).slice(0, 3);

  if (!toPost.length) {
    log('[twitter] No new jobs to post (all already on X)');
    return;
  }

  log(`[twitter] Posting ${toPost.length} job(s)...`);

  let twitterClient;
  try {
    twitterClient = getTwitterClient();
  } catch (err) {
    log(`[twitter] ❌ ${err.message}`);
    return;
  }

  for (let i = 0; i < toPost.length; i++) {
    const job = toPost[i];
    const text = buildTweet(job);

    try {
      await twitterClient.v1.tweet(text);
      await markPosted(job.slug);
      log(`[twitter] ✅ Posted: "${job.title}" (${job.slug})`);
    } catch (err) {
      log(`[twitter] ❌ Failed to post "${job.title}": ${err.message}`);
    }

    // 2-minute cooldown between tweets (except after the last one)
    if (i < toPost.length - 1) {
      log('[twitter] Waiting 2 minutes before next tweet...');
      await sleep(2 * 60 * 1000);
    }
  }

  log('[twitter] Done');
}

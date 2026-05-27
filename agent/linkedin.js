import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { log } from './logger.js';
import { pushToGithub } from './github-sync.js';

const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
const PUBLISHED_PATH = path.join(__dirname2, '../data/published-posts.json');

const MAX_POSTS_PER_RUN = 6;
const POST_DELAY_MS     = 15 * 60 * 1000; // 15 min entre chaque post

// ── Per-job dedup: track each job slug posted to LinkedIn ─────────────────
function loadPublished() {
  try { return fs.readJsonSync(PUBLISHED_PATH); } catch { return {}; }
}
function markJobPosted(slug, postId) {
  const p = loadPublished();
  p[`linkedin-job|${slug}`] = { slug, postId, postedAt: new Date().toISOString() };
  fs.writeJsonSync(PUBLISHED_PATH, p, { spaces: 2 });
}
function wasJobPosted(slug) {
  const p = loadPublished();
  return !!p[`linkedin-job|${slug}`];
}

// ── Anti-spam: never publish the same text content twice within 7 days ───────
const TEXT_DEDUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function textHash(text) {
  const norm = (text || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return crypto.createHash('sha1').update(norm).digest('hex').slice(0, 16);
}
function wasTextPosted(hash) {
  const p = loadPublished();
  const rec = p[`texthash|${hash}`];
  if (!rec) return false;
  return (Date.now() - new Date(rec.postedAt).getTime()) < TEXT_DEDUP_WINDOW_MS;
}
function markTextPosted(hash, postId) {
  const p = loadPublished();
  p[`texthash|${hash}`] = { hash, postId, postedAt: new Date().toISOString() };
  fs.writeJsonSync(PUBLISHED_PATH, p, { spaces: 2 });
}

// Persist dedup state to GitHub so it survives Railway's ephemeral filesystem.
export async function persistDedupState() {
  try { await pushToGithub('chore: linkedin dedup state [skip ci]'); }
  catch (err) { log(`LinkedIn: persist dedup state échoué — ${err.message}`); }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function publishPost(job, authorUrn, accessToken, siteUrl) {
  const url  = `${siteUrl}/offres/${job.slug || job.id}`;
  // The caption already contains the job URL via [SLUG] replacement — don't duplicate it
  const text = job.linkedin_caption || `${job.title} chez ${job.company} — ${job.city}\n\n${url}`;

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary:    { text },
        shareMediaCategory: 'ARTICLE',
        media: [{
          status:      'READY',
          originalUrl: url,
          title:       { text: job.meta_title.slice(0, 200) },
          description: { text: job.meta_description.slice(0, 256) },
        }],
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
    headers: {
      Authorization:               `Bearer ${accessToken}`,
      'Content-Type':              'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  return res.headers['x-restli-id'] || res.data?.id || 'ok';
}

// ── Text-only post (no article link) — used for digest/soir/nuit posts ────────

export async function publishTextPost(text) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!accessToken) {
    log('LinkedIn text: LINKEDIN_ACCESS_TOKEN non défini — publication ignorée');
    return null;
  }

  // ── Anti-spam guard: refuse identical content already posted recently ──────
  const hash = textHash(text);
  if (wasTextPosted(hash)) {
    log('LinkedIn text: ⛔ contenu identique déjà publié récemment — IGNORÉ (anti-spam)');
    return null;
  }

  try {
    const personUrn = await resolvePersonUrn(accessToken);
    const body = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary:    { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
      headers: {
        Authorization:               `Bearer ${accessToken}`,
        'Content-Type':              'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    const postId = res.headers['x-restli-id'] || res.data?.id || 'ok';
    markTextPosted(hash, postId);
    await persistDedupState();
    log(`LinkedIn text: ✓ post publié — ${postId}`);
    return postId;
  } catch (err) {
    const status = err.response?.status;
    const msg    = err.response?.data?.message || err.message;
    log(`LinkedIn text: ✗ ERREUR [${status || 'ERR'}] — ${msg}`);
    return null;
  }
}

// ── Job posts (existing) ───────────────────────────────────────────────────────

export async function postJobsToLinkedIn(enrichedJobs, siteUrl) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!accessToken) {
    log('LinkedIn: LINKEDIN_ACCESS_TOKEN non d�fini — publication ignor�e');
    return;
  }

  if (enrichedJobs.length === 0) {
    log('LinkedIn: aucun nouveau job à publier');
    return;
  }

  const toPost = enrichedJobs.slice(0, MAX_POSTS_PER_RUN);

  try {
    const personUrn = await resolvePersonUrn(accessToken);
    log(`LinkedIn: profil personnel → ${personUrn}`);
    log(`LinkedIn: publication de ${toPost.length} post(s)`);
    let posted = 0;

    for (let i = 0; i < toPost.length; i++) {
      const job = toPost[i];
      const jobKey = job.slug || job.id;
      // Dedup: skip if this job was already posted to LinkedIn
      if (jobKey && wasJobPosted(jobKey)) {
        log(`LinkedIn: ↩ "${job.title}" déjà publié — ignoré`);
        continue;
      }
      try {
        const postId = await publishPost(job, personUrn, accessToken, siteUrl);
        log(`LinkedIn: ✓ "${job.title}" — ${postId}`);
        if (jobKey) { markJobPosted(jobKey, postId); await persistDedupState(); }
        posted++;
      } catch (err) {
        const status = err.response?.status;
        const msg    = err.response?.data?.message || err.message;
        log(`LinkedIn: ✗ "${job.title}" [${status || 'ERR'}] — ${msg}`);
      }
      if (i < toPost.length - 1) await sleep(POST_DELAY_MS);
    }

    log(`LinkedIn: ${posted}/${toPost.length} post(s) publi�s`);
  } catch (err) {
    log(`LinkedIn: impossible de r�soudre le profil personnel — ${err.message}`);
  }
}

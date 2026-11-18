import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { log } from './logger.js';
import { pushToGithub } from './github-sync.js';
import { recordFailure } from './lib/alert.js';
import { validateDateClaim } from './lib/date-guard.js';
import { directJobCaption, isActiveDirectJob } from './direct-job-sharing.js';

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
export function wasJobPosted(slug) {
  const p = loadPublished();
  return !!p[`linkedin-job|${slug}`];
}
export function directJobNeedsSharing(job) {
  const state = loadPublished();
  const keys = [job.id, job.slug].filter(Boolean);
  const personal = process.env.LINKEDIN_ACCESS_TOKEN && !keys.some(key => state[`linkedin-job|${key}`]);
  const company = process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_CHANNEL_ID &&
    !keys.some(key => state[`linkedin-company-job|${key}`]);
  return Boolean(personal || company);
}

function markCompanyJobPosted(job, postId) {
  const state = loadPublished();
  for (const key of [job.id, job.slug].filter(Boolean)) {
    state[`linkedin-company-job|${key}`] = { postId, postedAt: new Date().toISOString() };
  }
  fs.writeJsonSync(PUBLISHED_PATH, state, { spaces: 2 });
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
  try { await pushToGithub('chore: linkedin dedup state [skip ci]', ['data/published-posts.json']); }
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
          title:       { text: (job.meta_title || job.title || '').slice(0, 200) },
          description: { text: (job.meta_description || job.description || '').slice(0, 256) },
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

  // ── Date guard: never let a wrong day name reach LinkedIn, regardless of
  //    which generator produced this text ────────────────────────────────
  if (!(await validateDateClaim('LinkedIn text (profil)', text))) {
    log('LinkedIn text: ⛔ jour erroné détecté dans le texte — publication bloquée');
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
    await recordFailure('LinkedIn text (profil personnel)', err, { status });
    return null;
  }
}

// ── Post to Company Page via Buffer GraphQL API ───────────────────────────────
// LinkedIn blocks w_organization_social for new apps. Buffer has the LinkedIn
// partnership and exposes a GraphQL API that posts to company pages.
//
// Required Railway env vars:
//   BUFFER_ACCESS_TOKEN  — OIDC token from Buffer session (works with GraphQL)
//   BUFFER_CHANNEL_ID    — LinkedIn page channel ID from Buffer
//                          (visible in Buffer URL: /channels/<ID>/schedule)
//
// GraphQL endpoint: https://api.buffer.com/graphql
// Mutation: createPost with mode: shareNow, schedulingType: automatic

export async function publishTextPostToCompany(text) {
  const bufferToken     = process.env.BUFFER_ACCESS_TOKEN;
  const bufferChannelId = process.env.BUFFER_CHANNEL_ID;

  if (!bufferToken || !bufferChannelId) {
    log('LinkedIn company: Buffer non configuré (BUFFER_ACCESS_TOKEN / BUFFER_CHANNEL_ID manquants) — publication page ignorée');
    return null;
  }

  // Anti-spam: separate dedup namespace from personal posts
  const hash     = textHash(text);
  const dedupKey = `org-texthash|${hash}`;
  const pub      = loadPublished();
  const rec      = pub[dedupKey];
  if (rec && (Date.now() - new Date(rec.postedAt).getTime()) < TEXT_DEDUP_WINDOW_MS) {
    log('LinkedIn company: ⛔ contenu identique déjà publié récemment — IGNORÉ (anti-spam)');
    return null;
  }

  if (!(await validateDateClaim('LinkedIn text (page entreprise)', text))) {
    log('LinkedIn company: ⛔ jour erroné détecté dans le texte — publication bloquée');
    return null;
  }

  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess  { post { id status } }
        ... on NotFoundError      { message }
        ... on UnauthorizedError  { message }
        ... on InvalidInputError  { message }
        ... on RestProxyError     { message }
        ... on LimitReachedError  { message }
        ... on UnexpectedError    { message }
      }
    }
  `;

  try {
    const res = await axios.post(
      'https://api.buffer.com/graphql',
      {
        query: mutation,
        variables: {
          input: {
            channelId:      bufferChannelId,
            text,
            schedulingType: 'automatic',
            mode:           'shareNow',
          },
        },
      },
      { headers: { Authorization: `Bearer ${bufferToken}`, 'Content-Type': 'application/json' } }
    );

    const payload = res.data?.data?.createPost;
    if (payload?.post?.id) {
      const postId = payload.post.id;
      const fresh  = loadPublished();
      fresh[dedupKey] = { hash, postId, postedAt: new Date().toISOString() };
      fs.writeJsonSync(PUBLISHED_PATH, fresh, { spaces: 2 });
      await persistDedupState();
      log(`LinkedIn company (Buffer): ✓ post publié — ${postId}`);
      return postId;
    } else {
      const errMsg = payload?.message || JSON.stringify(res.data?.errors || res.data).slice(0, 120);
      log(`LinkedIn company (Buffer): ✗ ERREUR — ${errMsg}`);
      await recordFailure('LinkedIn company (Buffer)', new Error(errMsg));
      return null;
    }
  } catch (err) {
    const status = err.response?.status;
    const msg    = err.response?.data?.errors?.[0]?.message || err.message;
    log(`LinkedIn company (Buffer): ✗ ERREUR [${status || 'ERR'}] — ${msg}`);
    await recordFailure('LinkedIn company (Buffer)', err, { status });
    return null;
  }
}

// ── Job posts (existing) ───────────────────────────────────────────────────────

let jobPublishing = false;

export async function postJobsToLinkedIn(enrichedJobs, siteUrl, { maxPosts = MAX_POSTS_PER_RUN } = {}) {
  if (jobPublishing) {
    log('LinkedIn jobs: une publication est déjà en cours — reprise au prochain passage');
    return;
  }
  jobPublishing = true;
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const toPost = enrichedJobs.filter(job => {
      if (job.source === 'Direct' || job.source_site === 'Direct') {
        return isActiveDirectJob(job) && directJobNeedsSharing(job);
      }
      return accessToken && !wasJobPosted(job.slug || job.id);
    }).slice(0, maxPosts);
    if (!toPost.length) return;

    let personUrn = null;
    if (accessToken) {
      try { personUrn = await resolvePersonUrn(accessToken); }
      catch (error) { await recordFailure('LinkedIn jobs: accès profil personnel', error); }
    }
    for (let index = 0; index < toPost.length; index++) {
      const job = toPost[index];
      const direct = job.source === 'Direct' || job.source_site === 'Direct';
      const keys = [job.id, job.slug].filter(Boolean);
      if (direct) {
        const url = `${siteUrl.replace(/\/$/, '')}/offres/${encodeURIComponent(job.slug || job.id)}`;
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
          await response.body?.cancel();
          if (!response.ok || !new URL(response.url).pathname.includes('/offres/')) {
            throw new Error(`Annonce pas encore accessible (HTTP ${response.status})`);
          }
        } catch (error) {
          log(`LinkedIn direct: ${job.title} — ${error.message}; nouvelle tentative au prochain passage`);
          continue;
        }
      }
      const caption = direct ? directJobCaption(job, siteUrl) : job.linkedin_caption;
      if (personUrn && !keys.some(wasJobPosted)) {
        try {
          const postId = await publishPost({ ...job, linkedin_caption: caption }, personUrn, accessToken, siteUrl);
          for (const key of keys) markJobPosted(key, postId);
          await persistDedupState();
          log(`LinkedIn profil: ✓ ${job.title} — ${postId}`);
        } catch (error) { await recordFailure('LinkedIn offre: profil personnel', error); }
      }
      if (direct && process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_CHANNEL_ID) {
        const state = loadPublished();
        if (!keys.some(key => state[`linkedin-company-job|${key}`])) {
          const prior = state[`org-texthash|${textHash(caption)}`];
          const postId = prior?.postId || await publishTextPostToCompany(caption);
          if (postId) {
            markCompanyJobPosted(job, postId);
            await persistDedupState();
          }
        }
      }
      if (index < toPost.length - 1) await sleep(POST_DELAY_MS);
    }
  } finally { jobPublishing = false; }
}

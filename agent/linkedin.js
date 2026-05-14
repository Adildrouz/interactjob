import axios from 'axios';
import { log } from './logger.js';

const MAX_POSTS_PER_RUN = 6;
const POST_DELAY_MS     = 15000; // 15s entre chaque post

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
  const url  = `${siteUrl}/offres/${job.slug}`;
  const text = `${job.linkedin_caption}\n\n${url}`;

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

export async function postJobsToLinkedIn(enrichedJobs, siteUrl) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!accessToken) {
    log('LinkedIn: LINKEDIN_ACCESS_TOKEN non défini — publication ignorée');
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
      try {
        const postId = await publishPost(job, personUrn, accessToken, siteUrl);
        log(`LinkedIn: ✓ "${job.title}" — ${postId}`);
        posted++;
      } catch (err) {
        const status = err.response?.status;
        const msg    = err.response?.data?.message || err.message;
        log(`LinkedIn: ✗ "${job.title}" [${status || 'ERR'}] — ${msg}`);
      }
      if (i < toPost.length - 1) await sleep(POST_DELAY_MS);
    }

    log(`LinkedIn: ${posted}/${toPost.length} post(s) publiés`);
  } catch (err) {
    log(`LinkedIn: impossible de résoudre le profil personnel — ${err.message}`);
  }
}

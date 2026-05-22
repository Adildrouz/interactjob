/**
 * One-shot script — post the 2 most recent French blog articles to LinkedIn.
 * Usage: node post-articles-now.js
 */
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { log, initLogger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');
const SITE_URL = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');

const HASHTAGS = {
  'Recrutement':    '#emploimaroc #recrutement #carri�re #RH',
  'Juridique & RH': '#droitdutravail #RH #emploimaroc #codedutravail',
};

async function main() {
  initLogger();

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!accessToken) { log('LINKEDIN_ACCESS_TOKEN manquant'); process.exit(1); }

  // Get 2 most recent FR articles
  const all = await fs.readJson(ARTICLES_PATH);
  const frArticles = all
    .filter((a) => (a.lang ?? 'fr') === 'fr')
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 2);

  if (frArticles.length === 0) { log('Aucun article FR trouv�'); process.exit(0); }

  // Resolve person URN
  const userinfo = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const personUrn = `urn:li:person:${userinfo.data.sub}`;
  log(`Profil : ${personUrn}`);

  for (let i = 0; i < frArticles.length; i++) {
    const article = frArticles[i];
    const url = `${SITE_URL}/blog/${article.slug}`;
    const hashtags = HASHTAGS[article.category] || '#emploimaroc #RH #carri�re';
    const text =
      `${article.coverEmoji} ${article.title}\n\n` +
      `${article.excerpt}\n\n` +
      `Lire l'article complet ↗\n\n` +
      hashtags;

    try {
      const res = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text },
              shareMediaCategory: 'ARTICLE',
              media: [{
                status: 'READY',
                originalUrl: url,
                title: { text: article.title.slice(0, 200) },
                description: { text: article.excerpt.slice(0, 256) },
              }],
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );
      const postId = res.headers['x-restli-id'] || res.data?.id || 'ok';
      log(`✓ "${article.title}" — ${postId}`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      log(`✗ "${article.title}" [${status || 'ERR'}] — ${msg}`);
    }

    if (i < frArticles.length - 1) await new Promise((r) => setTimeout(r, 15000));
  }

  log('Termin�');
}

main().finally(() => process.exit(0));

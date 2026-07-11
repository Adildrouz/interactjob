/**
 * Phase 4 — daily link health check.
 *
 * Re-verifies every article ever referenced in a published LinkedIn post
 * (data/published-posts.json → articleSlug) and writes a fresh snapshot to
 * data/link-health.json — the source the admin dashboard reads for its
 * 🟢/🔴 badges and counts. Alerts by email if a link that was previously
 * fine has broken (article deleted, slug changed, deploy regression, etc.).
 */
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs-extra';
import { log } from './logger.js';
import { sendEmail } from './mailer.js';
import { pushToGithub } from './github-sync.js';
import { verifyArticleLive, articleUrl } from './lib/verify-article-live.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_PATH    = path.join(__dirname, '../data/articles.json');
const PUBLISHED_PATH   = path.join(__dirname, '../data/published-posts.json');
const LINK_HEALTH_PATH = path.join(__dirname, '../data/link-health.json');
const SITE_URL = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');

function loadJson(p, fallback) {
  try { return fs.readJsonSync(p); } catch { return fallback; }
}

export async function runArticleLinkHealthCheck() {
  log('Link health: démarrage de la vérification quotidienne des liens articles');

  const articles  = loadJson(ARTICLES_PATH, []);
  const published = loadJson(PUBLISHED_PATH, {});
  const previous   = loadJson(LINK_HEALTH_PATH, { items: [] });
  const prevBySlug = new Map((previous.items || []).map((i) => [i.slug, i]));

  const articleBySlug = new Map(articles.map((a) => [a.slug, a]));

  // Every slug ever referenced by a published post, with its publish count.
  const slugStats = new Map(); // slug -> { count, lastDate }
  for (const rec of Object.values(published)) {
    if (!rec.articleSlug) continue;
    const s = slugStats.get(rec.articleSlug) || { count: 0, lastDate: null };
    s.count++;
    if (!s.lastDate || rec.date > s.lastDate) s.lastDate = rec.date;
    slugStats.set(rec.articleSlug, s);
  }

  const items = [];
  const regressions = [];

  for (const [slug, stats] of slugStats) {
    const article = articleBySlug.get(slug);
    const url = articleUrl(SITE_URL, slug);
    let check;
    if (!article) {
      check = { ok: false, status: 0, reason: 'article_missing_from_data' };
    } else {
      check = await verifyArticleLive(url, { expectedPathIncludes: '/blog/', expectedTitle: article.title });
      article.verified_live = check.ok;
      article.verified_at = new Date().toISOString();
    }

    const wasOk = prevBySlug.get(slug)?.ok;
    if (wasOk === true && !check.ok) {
      regressions.push({ slug, url, reason: check.reason, status: check.status });
    }

    items.push({
      slug, url,
      title: article?.title || null,
      ok: check.ok,
      status: check.status,
      reason: check.reason,
      postCount: stats.count,
      lastPublishedDate: stats.lastDate,
      checkedAt: new Date().toISOString(),
    });
  }

  const verifiedCount = items.filter((i) => i.ok).length;
  const brokenCount = items.length - verifiedCount;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    totalPosts: items.length,
    verifiedCount,
    brokenCount,
    items,
  };

  await fs.writeJson(LINK_HEALTH_PATH, snapshot, { spaces: 2 });
  await fs.writeJson(ARTICLES_PATH, articles, { spaces: 2 });

  log(`Link health: ${verifiedCount}/${items.length} liens vérifiés OK, ${brokenCount} cassé(s), ${regressions.length} régression(s)`);

  try {
    await pushToGithub('chore: daily link health check [skip ci]', [
      'data/link-health.json',
      'data/articles.json',
    ]);
  } catch (err) {
    log(`Link health: sync GitHub échoué — ${err.message}`);
  }

  if (regressions.length > 0 || brokenCount > 0) {
    try {
      const lines = items.filter((i) => !i.ok).map((i) =>
        `- ${i.slug} (${i.postCount} post(s), dernier: ${i.lastPublishedDate}) — ${i.reason} (HTTP ${i.status})\n  ${i.url}`
      );
      await sendEmail({
        to: 'contact@interactjob.ma',
        subject: regressions.length > 0
          ? `🔴 ${regressions.length} lien(s) article LinkedIn viennent de casser`
          : `🔴 Rapport quotidien — ${brokenCount} lien(s) article cassé(s)`,
        text:
          `Vérification quotidienne des liens articles référencés dans les posts LinkedIn.\n\n` +
          `Total suivi : ${items.length} | Vérifiés OK : ${verifiedCount} | Cassés : ${brokenCount}\n\n` +
          (regressions.length > 0
            ? `⚠️ RÉGRESSIONS (fonctionnaient hier, cassés aujourd'hui) :\n${regressions.map((r) => `- ${r.slug} — ${r.reason} (HTTP ${r.status})\n  ${r.url}`).join('\n')}\n\n`
            : '') +
          `Détail complet des liens cassés :\n${lines.join('\n')}\n\n` +
          `---\nVoir l'admin InteractJob pour agir (publier l'article manquant ou retirer la référence).`,
      });
    } catch (err) {
      log(`Link health: envoi email échoué — ${err.message}`);
    }
  }

  return snapshot;
}

// Allow standalone run: `node link-health-cron.mjs`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runArticleLinkHealthCheck().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

/**
 * Phase 1 — retroactive audit.
 *
 * Scans every LinkedIn post ever recorded in data/published-posts.json that
 * references a blog article, resolves the live URL, and reports which links
 * are actually working vs dead. Run manually: `node audit-linkedin-article-links.mjs`
 *
 * Also flags legacy log entries where the specific article referenced by a
 * published post was never recorded (a data-model gap closed going forward
 * by Phase 3's article_id linkage).
 */
import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyArticleLive, articleUrl } from './lib/verify-article-live.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_PATH   = path.join(__dirname, '../data/articles.json');
const PUBLISHED_PATH  = path.join(__dirname, '../data/published-posts.json');
const SITE_URL        = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');

async function main() {
  const articles  = await fs.readJson(ARTICLES_PATH);
  const published = await fs.readJson(PUBLISHED_PATH);

  const articleBySlug = new Map(articles.map((a) => [a.slug, a]));

  // Group tracked article-post events by slug
  const bySlug = new Map(); // slug -> [{date, postId, publishedAt}]
  let untrackedArticleBlogEntries = 0;

  for (const [key, rec] of Object.entries(published)) {
    if (rec.articleSlug) {
      if (!bySlug.has(rec.articleSlug)) bySlug.set(rec.articleSlug, []);
      bySlug.get(rec.articleSlug).push(rec);
    } else if ((rec.label || '').includes('ARTICLE BLOG')) {
      untrackedArticleBlogEntries++;
    }
  }

  console.log(`\n=== PHASE 1 — AUDIT DES LIENS D'ARTICLES DANS LES POSTS LINKEDIN ===\n`);
  console.log(`Slugs d'articles distincts référencés (traçabilité complète) : ${bySlug.size}`);
  console.log(`Événements de post trackés avec slug                        : ${[...bySlug.values()].reduce((a, l) => a + l.length, 0)}`);
  console.log(`Entrées "ARTICLE BLOG" historiques SANS slug tracé          : ${untrackedArticleBlogEntries} (gap fermé par la Phase 3)\n`);

  const results = { ok: [], broken: [] };

  for (const [slug, events] of bySlug) {
    const article = articleBySlug.get(slug);
    const url = articleUrl(SITE_URL, slug);
    const dates = events.map((e) => e.date).sort();
    const postIds = events.map((e) => e.postId).filter(Boolean);

    if (!article) {
      results.broken.push({
        slug, url, dates, postIds,
        reason: 'article_missing_from_data',
        detail: 'Aucune entrée correspondante dans data/articles.json — l\'article n\'existe plus (ou jamais existé) dans les données.',
      });
      continue;
    }

    const check = await verifyArticleLive(url, {
      expectedPathIncludes: '/blog/',
      expectedTitle: article.title,
    });

    if (check.ok) {
      results.ok.push({ slug, url, dates, postIds, title: article.title });
    } else {
      results.broken.push({
        slug, url, dates, postIds,
        reason: check.reason,
        status: check.status,
        title: article.title,
        detail: `HTTP ${check.status} — ${check.reason}`,
      });
    }
  }

  console.log(`✅ Liens fonctionnels : ${results.ok.length}`);
  for (const r of results.ok) {
    console.log(`   ✅ [${r.dates.join(', ')}] ${r.slug}`);
    console.log(`      → ${r.url}`);
  }

  console.log(`\n🔴 Liens cassés : ${results.broken.length}`);
  for (const r of results.broken) {
    console.log(`   🔴 [${r.dates.join(', ')}] ${r.slug}`);
    console.log(`      → ${r.url}`);
    console.log(`      Raison : ${r.detail}`);
    console.log(`      Post IDs LinkedIn : ${r.postIds.join(', ') || '(non enregistré)'}`);
  }

  // Persist machine-readable report
  const reportPath = path.join(__dirname, '../data/link-audit-report.json');
  await fs.writeJson(reportPath, {
    generatedAt: new Date().toISOString(),
    trackedSlugCount: bySlug.size,
    untrackedArticleBlogEntries,
    ok: results.ok,
    broken: results.broken,
  }, { spaces: 2 });

  console.log(`\nRapport JSON écrit dans : ${reportPath}\n`);

  if (results.broken.length > 0) {
    console.log('⚠️  ACTION REQUISE — voir data/link-audit-report.json pour les détails.');
    process.exitCode = 1;
  } else {
    console.log('✅ Tous les liens d\'articles postés sur LinkedIn sont actuellement en ligne et fonctionnels.');
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exitCode = 1;
});

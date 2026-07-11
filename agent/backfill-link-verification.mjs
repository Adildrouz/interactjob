/**
 * One-off Phase 3 migration: backfills verified_live/verified_at onto
 * data/articles.json and link_verified onto data/published-posts.json,
 * using the results from the Phase 1 audit (data/link-audit-report.json).
 * Safe to re-run — idempotent.
 *
 * Usage: node backfill-link-verification.mjs
 * (run audit-linkedin-article-links.mjs first to produce a fresh report)
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_PATH  = path.join(__dirname, '../data/articles.json');
const PUBLISHED_PATH = path.join(__dirname, '../data/published-posts.json');
const REPORT_PATH    = path.join(__dirname, '../data/link-audit-report.json');

async function main() {
  const report = await fs.readJson(REPORT_PATH);
  const articles = await fs.readJson(ARTICLES_PATH);
  const published = await fs.readJson(PUBLISHED_PATH);

  const verifiedAt = report.generatedAt || new Date().toISOString();
  const okSlugs = new Set(report.ok.map((r) => r.slug));
  const brokenSlugs = new Set(report.broken.filter((r) => r.slug).map((r) => r.slug));

  let articlesUpdated = 0;
  for (const article of articles) {
    if (okSlugs.has(article.slug)) {
      article.verified_live = true;
      article.verified_at = verifiedAt;
      articlesUpdated++;
    } else if (brokenSlugs.has(article.slug)) {
      article.verified_live = false;
      article.verified_at = verifiedAt;
      articlesUpdated++;
    }
  }
  await fs.writeJson(ARTICLES_PATH, articles, { spaces: 2 });
  console.log(`articles.json — ${articlesUpdated} article(s) marqué(s) avec verified_live/verified_at`);

  let postsUpdated = 0;
  for (const rec of Object.values(published)) {
    if (!rec.articleSlug) continue;
    if (okSlugs.has(rec.articleSlug) && rec.link_verified !== true) {
      rec.link_verified = true;
      postsUpdated++;
    } else if (brokenSlugs.has(rec.articleSlug) && rec.link_verified !== false) {
      rec.link_verified = false;
      postsUpdated++;
    }
  }
  await fs.writeJson(PUBLISHED_PATH, published, { spaces: 2 });
  console.log(`published-posts.json — ${postsUpdated} entrée(s) marquée(s) avec link_verified`);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exitCode = 1;
});

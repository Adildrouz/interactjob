/**
 * Backfill article views from GSC (clicks) + GA4 (screenPageViews).
 * Writes cumulative totals into data/article-views.json.
 *
 * Usage: node scripts/backfill-article-views.mjs
 *
 * Sources:
 *   - Google Search Console API  → organic clicks per /blog/<slug> URL
 *   - GA4 Data API               → pageviews per /blog/<slug> path
 *
 * The two counts are complementary (GSC = organic only, GA4 = all traffic).
 * We take max(gsc_clicks, ga4_views) per article so we don't double-count.
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
// Credentials are in agent/.env
dotenv.config({ path: path.join(ROOT, 'agent/.env') });

const SERVICE_ACCOUNT = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const GA4_PROPERTY   = process.env.GA4_PROPERTY_ID;   // e.g. "properties/537887356"
const GSC_SITE       = process.env.GSC_SITE_URL;       // e.g. "sc-domain:interactjob.ma"

// ── JWT / Access Token ────────────────────────────────────────────────────────

async function getAccessToken(scopes) {
  const { default: crypto } = await import('crypto');

  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: SERVICE_ACCOUNT.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(SERVICE_ACCOUNT.private_key, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Read articles list ────────────────────────────────────────────────────────

async function getArticles() {
  const raw = await readFile(path.join(ROOT, 'data/articles.json'), 'utf-8');
  return JSON.parse(raw).map(a => ({
    slug: a.slug,
    publishedAt: a.publishedAt || a.date || '2024-01-01',
  }));
}

// ── GSC: organic clicks per slug ─────────────────────────────────────────────

async function fetchGSC(token, articles) {
  const views = {};

  // GSC allows max 16 months back; use earliest article date
  const earliest = articles.map(a => a.publishedAt).sort()[0].slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\n📡 GSC: fetching clicks from ${earliest} to ${today}…`);

  const siteUrl = GSC_SITE.startsWith('sc-domain:')
    ? GSC_SITE
    : encodeURIComponent(GSC_SITE);

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: earliest,
        endDate: today,
        dimensions: ['page'],
        rowLimit: 5000,
      }),
    }
  );

  const data = await res.json();
  if (data.error) { console.error('GSC error:', data.error.message); return views; }

  for (const row of data.rows || []) {
    const url  = row.keys[0]; // full URL like https://www.interactjob.ma/fr/blog/some-slug
    const match = url.match(/\/blog\/([^/?#]+)/);
    if (!match) continue;
    const slug = match[1];
    views[slug] = (views[slug] || 0) + Math.round(row.clicks);
  }

  console.log(`   ✅ GSC: ${Object.keys(views).length} slugs with clicks`);
  return views;
}

// ── GA4: pageviews per slug ───────────────────────────────────────────────────

async function fetchGA4(token, articles) {
  const views = {};

  const earliest = articles.map(a => a.publishedAt).sort()[0].slice(0, 10);
  console.log(`\n📡 GA4: fetching pageviews from ${earliest} to today…`);

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: earliest, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics:    [{ name: 'screenPageViews' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: { matchType: 'CONTAINS', value: '/blog/' },
          },
        },
        limit: 10000,
      }),
    }
  );

  const data = await res.json();
  if (data.error) { console.error('GA4 error:', data.error.message); return views; }

  for (const row of data.rows || []) {
    const pagePath = row.dimensionValues[0].value;
    const match = pagePath.match(/\/blog\/([^/?#]+)/);
    if (!match) continue;
    const slug  = match[1];
    const count = parseInt(row.metricValues[0].value, 10) || 0;
    views[slug] = (views[slug] || 0) + count;
  }

  console.log(`   ✅ GA4: ${Object.keys(views).length} slugs with pageviews`);
  return views;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Backfilling article views from GSC + GA4…\n');

  const articles = await getArticles();
  console.log(`📚 ${articles.length} articles found in articles.json`);

  // Get separate tokens (different scopes)
  const [gscToken, ga4Token] = await Promise.all([
    getAccessToken(['https://www.googleapis.com/auth/webmasters.readonly']),
    getAccessToken(['https://www.googleapis.com/auth/analytics.readonly']),
  ]);

  const [gscViews, ga4Views] = await Promise.all([
    fetchGSC(gscToken, articles),
    fetchGA4(ga4Token, articles),
  ]);

  // Merge: take max of GSC clicks vs GA4 pageviews per slug
  // (GSC = organic, GA4 = all — avoid simple addition to not double-count)
  const merged = {};
  const allSlugs = new Set([...Object.keys(gscViews), ...Object.keys(ga4Views)]);

  for (const slug of allSlugs) {
    const gsc = gscViews[slug] || 0;
    const ga4 = ga4Views[slug] || 0;
    merged[slug] = Math.max(gsc, ga4);
  }

  // Log top 10
  const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]);
  console.log('\n🏆 Top 10 articles par vues :');
  sorted.slice(0, 10).forEach(([slug, count], i) => {
    console.log(`   ${i + 1}. ${slug.padEnd(55)} ${count.toLocaleString('fr-FR')} vues`);
  });

  // Write to file
  const outPath = path.join(ROOT, 'data/article-views.json');
  await writeFile(outPath, JSON.stringify(merged, null, 2));
  console.log(`\n✅ Écrit dans data/article-views.json — ${allSlugs.size} articles, ${Object.values(merged).reduce((a, b) => a + b, 0).toLocaleString('fr-FR')} vues totales`);
}

main().catch(err => { console.error(err); process.exit(1); });

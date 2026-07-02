/**
 * LinkedIn Followers Scraper — InteractJob company page + Adil DROUZ profile.
 *
 * The official API only exposes organization follower counts (and the token
 * scope keeps expiring), so this reuses the Playwright session from
 * linkedin-feed-scraper.mjs (agent/data/linkedin-cookies.json) to read the
 * real numbers straight from the pages, then pushes them to the site via
 * /api/admin/update-stat (SiteConfig + revalidate).
 *
 * Stored keys:
 *   linkedin_followers            "18 600 abonnés"  (legacy display string)
 *   linkedin_followers_count      "18643"           (raw int, company)
 *   linkedin_followers_adil_count "20250"           (raw int, personal)
 *
 * Usage:
 *   node linkedin-followers-scrape.mjs            # headless scrape + push
 *   node linkedin-followers-scrape.mjs --dry-run  # scrape only, no push
 *
 * If the session is expired, run: node linkedin-feed-scraper.mjs --setup
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env') });

const COOKIES_PATH = path.join(__dirname, 'data/linkedin-cookies.json');
const SITE_URL     = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const DRY_RUN      = process.argv.includes('--dry-run');

const COMPANY_URL = 'https://www.linkedin.com/company/interact-job/';
const PROFILE_URL = 'https://www.linkedin.com/in/adildrouz/';

/** "18 643 abonnés" / "18,643 followers" / "18 k abonnés" → 18643 (int) */
function parseFollowerText(text) {
  const m = text.match(/([\d\s.,  ]+)\s*(k|K)?\s*(abonn|follower|متابع)/i);
  if (!m) return null;
  let num = m[1].replace(/[\s  ]/g, '').replace(/,(?=\d{3}\b)/g, '');
  // "18,6" or "18.6" with k suffix
  if (m[2]) return Math.round(parseFloat(num.replace(',', '.')) * 1000);
  const n = parseInt(num.replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

async function extractFollowers(page, url, label) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  if (page.url().includes('/login') || page.url().includes('/authwall')) {
    throw new Error('Session LinkedIn expirée — relancez: node linkedin-feed-scraper.mjs --setup');
  }

  // Trigger lazy-rendered sections (profile pages need it)
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(2500);

  // Leaf elements mentioning followers, in DOM order. The page's own count
  // appears in the top card, i.e. BEFORE any "similar pages / people" rail —
  // so the first plausible match wins (a max() would grab suggested pages).
  const texts = await page.$$eval('main *, body *', (els) =>
    els
      .filter((el) => el.children.length === 0 && /abonn|follower|متابع/i.test(el.textContent || ''))
      .map((el) => (el.textContent || '').trim())
      .filter((t) => t.length < 80)
  );

  let count = null;
  for (const t of texts) {
    const n = parseFollowerText(t);
    if (n && n > 100) { count = n; break; }
  }
  console.log(`[followers] ${label}: ${count ?? 'introuvable'} (${texts.length} candidats: ${texts.slice(0, 3).join(' | ')})`);
  return count;
}

async function updateStat(key, value) {
  // Preferred: HTTP endpoint (also revalidates the pages instantly)
  if (ADMIN_SECRET) {
    const { data } = await axios.post(
      `${SITE_URL}/api/admin/update-stat`,
      { key, value: String(value) },
      { headers: { 'x-admin-secret': ADMIN_SECRET }, timeout: 10_000 },
    );
    return data;
  }
  // Fallback: write SiteConfig directly (site revalidates within the hour)
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    await client.db('interactjob').collection('siteconfigs').updateOne(
      { key },
      { $set: { key, value: String(value), updatedAt: new Date() } },
      { upsert: true },
    );
    return { ok: true, via: 'mongo' };
  } finally { await client.close(); }
}

function formatFr(count) {
  const rounded = Math.floor(count / 100) * 100;
  return `${rounded.toLocaleString('fr-FR')} abonnés`;
}

async function main() {
  console.log(`[followers] Démarrage (dry-run=${DRY_RUN})`);

  if (!(await fs.pathExists(COOKIES_PATH))) {
    console.error('[followers] Pas de cookies LinkedIn — lancez linkedin-feed-scraper.mjs --setup');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: { 'Accept-Language': 'fr-MA,fr;q=0.9,en;q=0.8' },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
  });
  await context.addCookies(await fs.readJson(COOKIES_PATH));

  const page = await context.newPage();
  let company = null, adil = null;
  try {
    company = await extractFollowers(page, COMPANY_URL, 'Page InteractJob');
  } catch (e) { console.error(`[followers] company: ${e.message}`); }
  try {
    adil = await extractFollowers(page, PROFILE_URL, 'Profil Adil DROUZ');
  } catch (e) { console.error(`[followers] profil: ${e.message}`); }
  await browser.close();

  if (!company && !adil) {
    console.error('[followers] Aucun compteur récupéré — site inchangé');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`[followers] DRY RUN — company=${company} adil=${adil} (rien envoyé)`);
    return;
  }
  if (!ADMIN_SECRET && !process.env.MONGODB_URI) {
    console.error('[followers] Ni ADMIN_SECRET ni MONGODB_URI — impossible de pousser');
    process.exit(1);
  }

  if (company) {
    await updateStat('linkedin_followers', formatFr(company));
    await updateStat('linkedin_followers_count', company);
    console.log(`[followers] ✅ Company → ${company}`);
  }
  if (adil) {
    await updateStat('linkedin_followers_adil_count', adil);
    console.log(`[followers] ✅ Adil → ${adil}`);
  }
  console.log('[followers] Terminé — site mis à jour');
}

main().catch((e) => { console.error('[followers] ❌', e.message); process.exit(1); });

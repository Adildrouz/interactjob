/**
 * LinkedIn Company Followers Tracker
 *
 * Fetches the InteractJob company page follower count via LinkedIn API,
 * then stores it via the admin update-stat endpoint so the website
 * displays the live count without a redeploy.
 *
 * Schedule: daily at 08:00 Casablanca (07:00 UTC) — see ecosystem.config.cjs
 *
 * Requires in agent/.env:
 *   LINKEDIN_ACCESS_TOKEN  — must have r_organization_social scope
 *   LINKEDIN_ORG_ID        — e.g. 103873598
 *   ADMIN_SECRET           — same secret as on the Next.js site
 *   SITE_URL               — https://www.interactjob.ma
 *
 * If the LinkedIn API call fails (token expired / missing scope),
 * the script exits cleanly — the last stored value stays on the site.
 * Update personal followers manually via:
 *   GET /api/admin/update-stat?secret=XXX&key=linkedin_followers&value=19+000+abonnés
 */

import 'dotenv/config';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL     = (process.env.SITE_URL     || 'https://www.interactjob.ma').replace(/\/$/, '');
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const LI_TOKEN     = process.env.LINKEDIN_ACCESS_TOKEN;
const LI_ORG_ID    = process.env.LINKEDIN_ORG_ID;

// Format e.g. 18643 → "18 600 abonnés" (rounded to nearest 100, French locale)
function formatFollowers(count) {
  const rounded = Math.floor(count / 100) * 100;
  return `${rounded.toLocaleString('fr-FR')} abonnés`;
}

async function fetchCompanyFollowers() {
  const orgUrn = `urn:li:organization:${LI_ORG_ID}`;
  const { data } = await axios.get(
    'https://api.linkedin.com/v2/organizationalEntityFollowerStatistics',
    {
      params: { q: 'organizationalEntity', organizationalEntity: orgUrn },
      headers: {
        Authorization: `Bearer ${LI_TOKEN}`,
        'LinkedIn-Version': '202405',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      timeout: 10_000,
    }
  );

  const elements = data.elements ?? [];
  if (!elements.length) throw new Error('Empty response from LinkedIn followers API');

  let total = 0;
  for (const el of elements) {
    total += el.followerCounts?.organicFollowerCount ?? 0;
    total += el.followerCounts?.paidFollowerCount    ?? 0;
  }
  return total;
}

async function updateStat(key, value) {
  const { data } = await axios.post(
    `${SITE_URL}/api/admin/update-stat`,
    { key, value },
    { headers: { 'x-admin-secret': ADMIN_SECRET }, timeout: 10_000 }
  );
  return data;
}

async function main() {
  log('[linkedin-followers] Starting...');

  if (!LI_TOKEN || !LI_ORG_ID) {
    log('[linkedin-followers] ⚠️  LINKEDIN_ACCESS_TOKEN or LINKEDIN_ORG_ID not set — skipping');
    return;
  }
  if (!ADMIN_SECRET) {
    log('[linkedin-followers] ⚠️  ADMIN_SECRET not set — cannot update site');
    return;
  }

  try {
    const count   = await fetchCompanyFollowers();
    const display = formatFollowers(count);
    log(`[linkedin-followers] Company page: ${count} followers → "${display}"`);

    await updateStat('linkedin_followers', display);
    log('[linkedin-followers] ✅ Site updated successfully');
  } catch (err) {
    log(`[linkedin-followers] ❌ ${err.message}`);
    log('[linkedin-followers] Personal followers must be updated manually:');
    log(`[linkedin-followers] ${SITE_URL}/api/admin/update-stat?secret=***&key=linkedin_followers&value=19+000+abonnés`);
    // Non-fatal — don't throw so PM2 doesn't mark it as crashed
  }
}

main();

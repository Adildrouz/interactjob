'use strict';
/**
 * Google Indexing API — request crawling for key InteractJob pages.
 *
 * Prerequisites:
 *   1. Enable "Web Search Indexing API" in Google Cloud Console
 *   2. Create a Service Account and download its JSON key
 *   3. Add the service account email as an OWNER in Google Search Console
 *      (Settings → Users and permissions → Add user → Owner)
 *   4. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in agent/.env
 *
 * Run:
 *   node scripts/request-indexing.js
 */

const path = require('path');
const agentDir = path.join(__dirname, '..', 'agent');

// Load env from agent/.env
require(path.join(agentDir, 'node_modules', 'dotenv')).config({
  path: path.join(agentDir, '.env'),
});

const { google } = require(path.join(agentDir, 'node_modules', 'googleapis'));

const URLS = [
  'https://www.interactjob.ma/',
  'https://www.interactjob.ma/offres',
  'https://www.interactjob.ma/blog',
  'https://www.interactjob.ma/cv-checker',
  'https://www.interactjob.ma/concours',
];

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !key) {
    console.error('❌  GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_SERVICE_ACCOUNT_KEY manquant dans agent/.env');
    console.error('    → Créez un Service Account sur console.cloud.google.com');
    console.error('    → Activez "Web Search Indexing API"');
    console.error('    → Ajoutez le compte comme OWNER dans Google Search Console');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const client = await auth.getClient();

  console.log(`\n🔍 Demande d'indexation pour ${URLS.length} URLs — ${new Date().toLocaleString('fr-MA')}\n`);

  for (const url of URLS) {
    try {
      const res = await client.request({
        url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
        method: 'POST',
        data: { url, type: 'URL_UPDATED' },
      });
      console.log(`  ✅  ${url}  [HTTP ${res.status}]`);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message;
      console.error(`  ❌  ${url}  — ${msg}`);
    }
    // Respect API quota: 200 req/day, stagger requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nTerminé. Les URLs seront recrawlées par Google dans les prochaines heures.');
}

main().catch((err) => {
  console.error('ERREUR FATALE:', err.message);
  process.exit(1);
});

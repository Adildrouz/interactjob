'use strict';
/**
 * Google Indexing API — request crawling for key InteractJob pages.
 *
 * Prerequisites:
 *   1. Enable "Web Search Indexing API" in Google Cloud Console
 *   2. Add your Google account as OWNER in Google Search Console
 *      (Settings → Users and permissions → Add user → Owner)
 *   3. Run once in terminal:
 *        gcloud auth application-default login
 *        gcloud config set project project-c2e033b9-371c-40df-8b2
 *
 * Run:
 *   node scripts/request-indexing.js
 */

const path = require('path');
const agentDir = path.join(__dirname, '..', 'agent');

const { google } = require(path.join(agentDir, 'node_modules', 'googleapis'));

const URLS = [
  'https://www.interactjob.ma/',
  'https://www.interactjob.ma/offres',
  'https://www.interactjob.ma/blog',
  'https://www.interactjob.ma/cv-checker',
  'https://www.interactjob.ma/concours',
];

async function main() {
  // Uses credentials from: gcloud auth application-default login
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  let client;
  try {
    client = await auth.getClient();
  } catch (err) {
    console.error('❌  Credentials introuvables.');
    console.error('    Exécutez d\'abord :');
    console.error('      gcloud auth application-default login');
    console.error('      gcloud config set project project-c2e033b9-371c-40df-8b2');
    process.exit(1);
  }

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
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nTerminé. Les URLs seront recrawlées par Google dans les prochaines heures.');
}

main().catch((err) => {
  console.error('ERREUR FATALE:', err.message);
  process.exit(1);
});

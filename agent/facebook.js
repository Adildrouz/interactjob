/**
 * Facebook Page poster — publishes job digests to the InteractJob Facebook page
 * via the Meta Graph API.
 *
 * Required env vars:
 *   FACEBOOK_PAGE_ID            — numeric page id (visible in page → À propos → ID de Page)
 *   FACEBOOK_PAGE_ACCESS_TOKEN  — long-lived Page access token with pages_manage_posts
 *
 * Token setup (one-time, ~10 min):
 *   1. developers.facebook.com → Créer une app (type Business)
 *   2. Outils → Explorateur de l'API Graph → sélectionner l'app + la Page
 *   3. Permissions : pages_manage_posts, pages_read_engagement → Generate Access Token
 *   4. Échanger contre un token longue durée (60 j) puis token de Page (n'expire pas) :
 *      GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}
 *          &client_secret={app-secret}&fb_exchange_token={short-token}
 *      GET /{page-id}?fields=access_token&access_token={long-user-token}
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';
import { pushToGithub } from './github-sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname, '../data/jobs.json');
const POSTED_PATH = path.join(__dirname, '../data/posted-facebook.json');
const SITE_URL = 'https://www.interactjob.ma';
const GRAPH = 'https://graph.facebook.com/v21.0';
const MAX_JOBS_PER_POST = 5;

async function loadPosted() {
  try { return JSON.parse(await fs.readFile(POSTED_PATH, 'utf-8')); }
  catch { return []; }
}
async function savePosted(ids) {
  await fs.writeFile(POSTED_PATH, JSON.stringify(ids.slice(-500), null, 2), 'utf-8');
}

function buildDigest(jobs) {
  const lines = jobs.map(j => {
    const salary = j.salary ? ` — 💰 ${j.salary}` : '';
    return `🔹 ${j.title}\n   ${j.company} · ${j.city} · ${j.contractType}${salary}\n   👉 ${SITE_URL}/offres/${j.slug || j.id}`;
  }).join('\n\n');

  return `🇲🇦 Nouvelles offres d'emploi au Maroc — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}

${lines}

📌 Toutes les offres : ${SITE_URL}/offres
🔔 Alertes WhatsApp : https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j

#EmploiMaroc #RecrutementMaroc #Travail #Casablanca #Rabat #OffreEmploi`;
}

export async function runFacebookPoster() {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token  = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    log('Facebook: FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN non définis — skip');
    return;
  }

  const jobs = JSON.parse(await fs.readFile(JOBS_PATH, 'utf-8'));
  const posted = await loadPosted();
  const postedSet = new Set(posted);

  const fresh = jobs
    .filter(j => !j.expired && !postedSet.has(j.id))
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, MAX_JOBS_PER_POST);

  if (!fresh.length) { log('Facebook: aucune nouvelle offre à publier'); return; }

  const message = buildDigest(fresh);

  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: token }),
  });
  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(`Graph API: ${json.error?.message || res.status}`);
  }

  await savePosted([...posted, ...fresh.map(j => j.id)]);
  log(`Facebook: ✓ digest publié (${fresh.length} offres) — post ${json.id}`);

  // Persist dedup state to GitHub — Railway's filesystem is ephemeral
  try { await pushToGithub('chore: facebook posted state [skip ci]', ['data/posted-facebook.json']); }
  catch (err) { log(`Facebook: persist state échoué — ${err.message}`); }
}

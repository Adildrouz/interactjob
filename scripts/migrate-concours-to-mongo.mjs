/**
 * One-off: import the existing data/concours.json entries (alwadifa-maroc.com,
 * ~289 records) into the MongoDB "concours" collection, so the front-end can
 * be cut over from static JSON import to a live DB query.
 *
 * Idempotent — upserts by slug, safe to re-run.
 *
 * Usage:
 *   node scripts/migrate-concours-to-mongo.mjs --dev   # MONGODB_URI_DEV, test first
 *   node scripts/migrate-concours-to-mongo.mjs         # MONGODB_URI (prod), after review
 */
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

function loadEnvFile(relPath) {
  let text;
  try {
    text = readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), 'utf-8');
  } catch {
    return; // optional file
  }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// agent/.env holds MONGODB_URI (prod); root .env.local holds MONGODB_URI_DEV.
loadEnvFile('../agent/.env');
loadEnvFile('../.env.local');

const DEV = process.argv.includes('--dev');
const uri = DEV ? process.env.MONGODB_URI_DEV : process.env.MONGODB_URI;
if (!uri) {
  console.error(`${DEV ? 'MONGODB_URI_DEV' : 'MONGODB_URI'} manquant`);
  process.exit(1);
}

// Prod and dev URIs share the same cluster, different DB names (interactjob
// vs interactjob_dev) — always take the name from the URI, never hardcode it,
// so --dev can never accidentally land in the production database.
const dbName = new URL(uri).pathname.replace(/^\//, '');
if (!dbName) {
  console.error('URI MongoDB sans nom de base dans le chemin');
  process.exit(1);
}

function isExpired(deadline) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

const concoursJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/concours.json', import.meta.url)), 'utf-8'),
);

const client = new MongoClient(uri);
await client.connect();
const col = client.db(dbName).collection('concours');
await col.createIndex({ slug: 1 }, { unique: true });
await col.createIndex({ source: 1 });
await col.createIndex({ status: 1 });
await col.createIndex({ deadline: 1 });

let upserted = 0, skipped = 0;

for (const c of concoursJson) {
  if (!c.slug || !c.title_fr) { skipped++; continue; }

  const doc = {
    legacy_id: c.id || null,
    sourceId: String(c.sourceId ?? c.id),
    source: 'alwadifa-maroc.com',
    source_url: c.sourceUrl || '',
    source_urls: c.sourceUrl ? [c.sourceUrl] : [],
    organization_fr: c.organization_fr || '',
    organization_ar: c.organization_ar || '',
    title_fr: c.title_fr,
    title_ar: c.title_ar || '',
    slug: c.slug,
    datePosted: c.datePosted || null,
    deadline: c.deadline || null,
    date_concours: null,
    postes: c.postes ?? null,
    niveau: c.niveau ?? null,
    specialites: [],
    content_ar: c.content_ar || '',
    summary_fr: c.summary_fr || '',
    analysis_fr: '',
    faq: [],
    meta_title: c.meta_title || '',
    meta_description: c.meta_description || '',
    status: isExpired(c.deadline) ? 'expired' : 'active',
    scraped_at: c.datePosted ? new Date(c.datePosted) : new Date(),
  };

  await col.updateOne(
    { slug: doc.slug },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  upserted++;
}

console.log(`Migration ${DEV ? '[DEV]' : '[PROD]'}: ${upserted} upserted, ${skipped} skipped (missing slug/title) — total in file: ${concoursJson.length}`);
await client.close();

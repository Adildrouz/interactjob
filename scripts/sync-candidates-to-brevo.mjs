/**
 * One-off: sync all existing MongoDB candidates → Brevo contact list
 * so they receive the weekly newsletter from day one.
 *
 * Run: node scripts/sync-candidates-to-brevo.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// Minimal .env parser
const envFile = readFileSync(fileURLToPath(new URL('../agent/.env', import.meta.url)), 'utf-8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { MongoClient } = await import('mongodb');
const BREVO_KEY    = process.env.BREVO_API_KEY;
const BREVO_LIST   = parseInt(process.env.BREVO_LIST_CANDIDATS_ID || '0');
const MONGODB_URI  = process.env.MONGODB_URI;

if (!BREVO_KEY || !BREVO_LIST) { console.error('BREVO_API_KEY ou BREVO_LIST_CANDIDATS_ID manquant'); process.exit(1); }
if (!MONGODB_URI) { console.error('MONGODB_URI manquant'); process.exit(1); }

async function brevoUpsert(email, firstName, lastName, city, position) {
  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      attributes: {
        PRENOM: firstName || '',
        NOM: lastName || '',
        VILLE: city || '',
        POSTE: position || '',
      },
      listIds: [BREVO_LIST],
      updateEnabled: true,
    }),
  });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text();
    // 400 "Contact already in list" is fine — updateEnabled handles it
    if (!txt.includes('already') && res.status !== 400) throw new Error(`${res.status}: ${txt}`);
  }
}

const client = new MongoClient(MONGODB_URI);
await client.connect();
const candidates = await client.db('interactjob').collection('candidates').find({}).toArray();
await client.close();

console.log(`Candidats à synchroniser: ${candidates.length}`);

let ok = 0, err = 0;
for (const c of candidates) {
  if (!c.email || !c.email.includes('@')) { err++; continue; }
  try {
    await brevoUpsert(c.email, c.firstName || '', c.lastName || '', c.city || '', c.position || '');
    ok++;
    if (ok % 10 === 0) console.log(`  ${ok}/${candidates.length} synced…`);
    // Brevo rate limit: 10 req/s
    await new Promise(r => setTimeout(r, 110));
  } catch (e) {
    console.error(`  ✗ ${c.email}: ${e.message}`);
    err++;
  }
}

console.log(`\n✅ Sync terminé: ${ok} ajoutés/mis à jour, ${err} erreurs`);

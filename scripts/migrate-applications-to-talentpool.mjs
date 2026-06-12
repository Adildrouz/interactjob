/**
 * One-off: copy job applications (collection "applications") into the talent
 * pool (collection "candidates") so candidate profiles are kept and visible
 * in /admin/candidats. Dedupes by email (existing candidates win).
 * CV binaries are already in "candidatecvs" keyed by application id, so
 * cvPath = /api/cv/{applicationId} works as-is.
 */
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// Minimal .env parser — avoids a dotenv dependency at repo root
const envFile = readFileSync(fileURLToPath(new URL('../agent/.env', import.meta.url)), 'utf-8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI manquant'); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const db = client.db('interactjob');

const apps = await db.collection('applications').find({}).sort({ created_at: 1 }).toArray();
const existingEmails = new Set(
  (await db.collection('candidates').find({}, { projection: { email: 1 } }).toArray())
    .map(c => (c.email || '').toLowerCase())
);
const cvIds = new Set(
  (await db.collection('candidatecvs').find({}, { projection: { candidateId: 1 } }).toArray())
    .map(c => c.candidateId)
);

let created = 0, skipped = 0;
const seenThisRun = new Set();

for (const app of apps) {
  const email = (app.applicant_email || '').toLowerCase();
  if (!email || existingEmails.has(email) || seenThisRun.has(email)) { skipped++; continue; }
  seenThisRun.add(email);

  const name = (app.applicant_name || '').trim();
  const [firstName, ...rest] = name.split(/\s+/);
  const hasCv = cvIds.has(app.id);

  await db.collection('candidates').insertOne({
    id: app.id,
    firstName: firstName || email.split('@')[0],
    lastName: rest.join(' ') || '',
    email,
    phone: (app.cover_letter || '').match(/T[ée]l\s*:\s*([+\d][\d\s.-]{7,})/)?.[1]?.trim() || '',
    city: '',
    sectors: [],
    position: app.job_title || '',
    experienceLevel: '',
    availability: '',
    languages: [],
    linkedin: '',
    about: `Candidature à « ${app.job_title} » chez ${app.company || '—'} le ${new Date(app.created_at).toLocaleDateString('fr-FR')}.${app.cover_letter ? '\n\n' + app.cover_letter : ''}`,
    cvFilename: hasCv ? `cv-${app.id}.pdf` : '',
    cvPath: hasCv ? `/api/cv/${app.id}` : '',
    submittedAt: new Date(app.created_at).toISOString(),
    status: 'Nouveau',
    notes: '',
    starred: false,
    viewed: false,
    tags: ['candidature-offre'],
    source: 'application-import',
  });
  created++;
}

console.log(`✅ Migration terminée : ${created} candidats créés, ${skipped} ignorés (doublons/sans email) sur ${apps.length} candidatures.`);
await client.close();

/**
 * Backfill localisation and niveau fields for existing jobs in jobs.json
 * Run once: node scripts/backfill-localisation-niveau.js
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname, '../data/jobs.json');

function inferLocalisation(job) {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  if (/full.?remote|remote.?global|remote.?world|remote.?anywhere|work.?anywhere/.test(text)) return 'full-remote';
  if (/remote.?uk|remote.?europ|remote.?eu\b|uk.?remote|europe.?remote/.test(text)) return 'remote-uk-eu';
  if (/remote.?maroc|télétravail|teletravail|remote.?morocco/.test(text)) return 'remote-maroc';
  if (/hybride|hybrid/.test(text)) return 'hybride';
  return 'presentiel';
}

function inferNiveau(job) {
  if (job.contractType === 'Stage') return 'stage';

  const title = (job.title || '').toLowerCase();
  const desc  = (job.description || '').toLowerCase();
  const text  = `${title} ${desc}`;

  if (/\bstagiaire\b/.test(title)) return 'stage';
  if (/\bdébutant|\bdebutant\b|0.?1\s*an|sans expérience|premier emploi/.test(text)) return 'early-pro';
  if (/\bjunior\b/.test(text)) return 'junior';
  if (/\bsenior\b|\blead\b|\bmanager\b|\bdirecteur\b|\bdirectrice\b|\bchef\s+(de\s+)?projet\b|\bresponsable\b|\bhead\s+of\b|\bvp\b/.test(text)) return 'senior';

  // Experience keywords in description
  if (/\b(1|2)\s*ans?\s*(d.expérience|minimum)/.test(text)) return 'junior';
  if (/\b(3|4|5)\s*ans?\s*(d.expérience|minimum)/.test(text)) return 'intermediaire';
  if (/\b(5|6|7|8|9|10)\s*ans?\s*(d.expérience|minimum)/.test(text)) return 'senior';

  return 'intermediaire';
}

const jobs = JSON.parse(readFileSync(JOBS_PATH, 'utf-8'));

let updated = 0;
const result = jobs.map((job) => {
  const hadLocalisation = 'localisation' in job;
  const hadNiveau = 'niveau' in job;

  const newJob = {
    ...job,
    localisation: job.localisation || inferLocalisation(job),
    niveau:       job.niveau       || inferNiveau(job),
  };

  if (!hadLocalisation || !hadNiveau) updated++;
  return newJob;
});

writeFileSync(JOBS_PATH, JSON.stringify(result, null, 2), 'utf-8');
console.log(`✓ ${updated} jobs backfilled out of ${jobs.length} total`);

// Stats
const locStats = {};
const nivStats = {};
result.forEach(j => {
  locStats[j.localisation] = (locStats[j.localisation] || 0) + 1;
  nivStats[j.niveau]       = (nivStats[j.niveau]       || 0) + 1;
});
console.log('\nLocalisation distribution:', locStats);
console.log('Niveau distribution:', nivStats);

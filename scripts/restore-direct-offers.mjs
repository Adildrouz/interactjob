/**
 * One-time restore: merges the 36 Direct offers hard-deleted by
 * agent/expirer.js's MAX_JOBS trim (accidental, never manually closed —
 * see fix/direct-offers-expiry branch investigation) back into
 * data/jobs.json. Sets expired:false and removes the 30-day expiry
 * fields per the new "Direct offers never auto-expire" policy.
 *
 * Safety: dry run by default (prints what would change, writes nothing).
 *   node scripts/restore-direct-offers.mjs           → dry run
 *   node scripts/restore-direct-offers.mjs --commit   → writes data/jobs.json
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const COMMIT = process.argv.includes('--commit');
const RECOVERED_PATH = process.argv.find(a => a.startsWith('--source='))?.split('=')[1]
  || 'C:/Users/Adil/AppData/Local/Temp/claude/C--Users-Adil-interactjob/eb30dcda-2caf-47ac-ab6c-cfbd2aa30c7f/scratchpad/recovered-direct-offers.json';
const JOBS_PATH = path.join(process.cwd(), 'data/jobs.json');

const recovered = JSON.parse(readFileSync(RECOVERED_PATH, 'utf-8'));
const jobs = JSON.parse(readFileSync(JOBS_PATH, 'utf-8'));
const existingIds = new Set(jobs.map(j => j.id));

let restored = 0, skipped = 0;
const toAdd = [];

for (const job of recovered) {
  if (existingIds.has(job.id)) {
    skipped++;
    console.log(`SKIP (already present): ${job.id} — ${job.title}`);
    continue;
  }
  const restoredJob = {
    ...job,
    expired: false,
    date_expires: null,
    schema: job.schema ? { ...job.schema, validThrough: undefined } : job.schema,
  };
  // Clean up the undefined key rather than serializing "validThrough": null
  if (restoredJob.schema) delete restoredJob.schema.validThrough;

  toAdd.push(restoredJob);
  restored++;
}

console.log(`\n${COMMIT ? 'Restoring' : 'Would restore'}: ${restored} jobs. Skipped (already present): ${skipped}.`);

if (!COMMIT) {
  console.log('Dry run only — nothing written. Re-run with --commit to write.');
  process.exit(0);
}

const finalJobs = [...jobs, ...toAdd];
writeFileSync(JOBS_PATH, JSON.stringify(finalJobs, null, 2), 'utf-8');
console.log(`✓ Wrote data/jobs.json — ${jobs.length} → ${finalJobs.length} total jobs.`);

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname, '../data/jobs.json');

// loadJobs() must never silently treat a read/parse failure as "no existing
// jobs" — that fallback previously let the pipeline rebuild jobs.json from
// scratch on a transient glitch, dropping dozens of Direct offers. A missing
// file (first run) is the only legitimate reason to return [].
export function loadJobs() {
  if (!fs.existsSync(JOBS_PATH)) return [];

  const raw = fs.readFileSync(JOBS_PATH, 'utf-8').trim();
  if (!raw) {
    throw new Error(`loadJobs: ${JOBS_PATH} exists but is empty — aborting rather than treating as zero jobs`);
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`loadJobs: failed to parse ${JOBS_PATH} (${err.message}) — aborting rather than treating as zero jobs`);
  }
}

export function deduplicate(newItems, existingJobs) {
  // Build a set of every URL already tracked (website uses sourceUrl, agent uses source_url)
  const existingUrls = new Set(
    existingJobs
      .flatMap((j) => [j.sourceUrl, j.source_url])
      .filter(Boolean)
  );

  const newJobs = [];
  // Track per source_site: { fetched, new, skipped }
  const statsBySite = {};

  for (const item of newItems) {
    const site = item.source_site;
    if (!statsBySite[site]) statsBySite[site] = { fetched: 0, new: 0, skipped: 0 };
    statsBySite[site].fetched++;

    if (existingUrls.has(item.source_url)) {
      statsBySite[site].skipped++;
    } else {
      newJobs.push(item);
      existingUrls.add(item.source_url); // prevent intra-batch duplicates
      statsBySite[site].new++;
    }
  }

  return { newJobs, statsBySite };
}

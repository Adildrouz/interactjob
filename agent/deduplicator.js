import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname, '../data/jobs.json');

export function loadJobs() {
  try {
    if (!fs.existsSync(JOBS_PATH)) return [];
    const raw = fs.readFileSync(JOBS_PATH, 'utf-8').trim();
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
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

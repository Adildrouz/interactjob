/**
 * InteractJob Agent — main entry point
 * Designed to run once and exit; scheduling is handled by PM2 cron_restart.
 * Flags:
 *   --test   fetch & enrich without writing any files
 *   --blog   run weekly blog writer instead of job scraping
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '.env') });
import fs from 'fs-extra';

import { initLogger, log }        from './logger.js';
import { fetchFeeds }             from './parser.js';
import { loadJobs, deduplicate }  from './deduplicator.js';
import { enrichJobs }             from './enricher.js';
import { expireJobs }             from './expirer.js';
import { postJobsToLinkedIn }    from './linkedin.js';
import { writeBlogArticles }      from './blog-writer.js';

const JOBS_PATH          = path.join(__dirname, '../data/jobs.json');
const LINKEDIN_QUEUE     = path.join(__dirname, '../data/linkedin-queue.txt');
const TEST_MODE          = process.argv.includes('--test');
const SITE_URL           = (process.env.SITE_URL || 'https://interactjob.vercel.app').replace(/\/$/, '');

// ──────────────────────────────────────────────────────────────────────────────
async function run() {
  initLogger();
  log(`Agent started${TEST_MODE ? ' [TEST MODE]' : ''}`);

  try {
    // ── 1. Fetch all RSS feeds ──────────────────────────────────────────────
    const { items, feedStats } = await fetchFeeds();

    // ── 2. Load existing jobs & deduplicate ────────────────────────────────
    const existingJobs = loadJobs();
    const { newJobs, statsBySite } = deduplicate(items, existingJobs);

    // Log per-feed results
    for (const stat of feedStats) {
      if (stat.error) {
        log(`${stat.name}: ERREUR — ${stat.error}`);
      } else {
        const s = statsBySite[stat.siteName] || { fetched: stat.count, new: 0, skipped: stat.count };
        log(`${stat.name}: ${s.fetched} fetched, ${s.new} new, ${s.skipped} skipped (duplicate)`);
      }
    }

    // ── 3. [TEST MODE] Limit to first 2 new jobs per source ───────────────
    let jobsToEnrich = newJobs;
    if (TEST_MODE) {
      const countBySite = {};
      jobsToEnrich = [];
      for (const job of newJobs) {
        const site = job.source_site;
        countBySite[site] = (countBySite[site] || 0);
        if (countBySite[site] < 2) {
          jobsToEnrich.push(job);
          countBySite[site]++;
        }
      }
      const total = jobsToEnrich.length;
      log(`TEST MODE: ${total} job(s) sélectionné(s) pour enrichissement (max 2 par source)`);
    }

    // ── 4. Enrich with Claude ──────────────────────────────────────────────
    const { enriched, failed } = await enrichJobs(jobsToEnrich, TEST_MODE);
    log(`Claude enrichment: ${enriched.length} jobs enriched, ${failed} failed`);

    // ── TEST MODE: print results and stop — do NOT touch any files ─────────
    if (TEST_MODE) {
      console.log('\n' + '═'.repeat(60));
      console.log('TEST MODE — Enriched job objects:');
      console.log('═'.repeat(60));
      console.log(JSON.stringify(enriched, null, 2));
      log('TEST MODE — no files were modified');
      return;
    }

    // ── 5. Expire old jobs ─────────────────────────────────────────────────
    const { jobs: updatedExisting, expiredCount } = expireJobs(existingJobs);
    log(`Expired: ${expiredCount} jobs marked as expired`);

    // ── 6. Merge and save jobs.json ────────────────────────────────────────
    // New enriched jobs go at the front (most recent)
    const finalJobs = [...enriched, ...updatedExisting];
    await fs.writeJson(JOBS_PATH, finalJobs, { spaces: 2 });
    log(`jobs.json: ${enriched.length} new jobs added. Total: ${finalJobs.length} jobs`);

    // ── 7. Append LinkedIn captions ────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    if (enriched.length > 0) {
      const lines = enriched.map((job) => {
        const caption = `${job.linkedin_caption} ↗`;
        const url     = `${SITE_URL}/offres/${job.slug}`;
        return `[${today}] | [${job.source_site}] | ${caption} | ${url}`;
      });
      await fs.appendFile(LINKEDIN_QUEUE, lines.join('\n') + '\n', 'utf-8');
    }
    log(`linkedin-queue.txt: ${enriched.length} captions added`);

    // ── 8. Post to LinkedIn ────────────────────────────────────────────────
    await postJobsToLinkedIn(enriched, SITE_URL);

    log('Agent completed successfully');
  } catch (err) {
    log(`ERREUR FATALE: ${err.message}`);
    // Never rethrow — keep the process alive for the next cron tick
    console.error(err);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
async function runBlog() {
  initLogger();
  log('Blog writer: démarrage hebdomadaire (lundi 09:00)');
  try {
    await writeBlogArticles();
    log('Blog writer: terminé avec succès');
  } catch (err) {
    log(`Blog writer: ERREUR FATALE: ${err.message}`);
    console.error(err);
  }
}

// ── Entry point — run once and exit (PM2 cron_restart owns the schedule) ─────
const BLOG_MODE = process.argv.includes('--blog');

if (BLOG_MODE) {
  runBlog().finally(() => process.exit(0));
} else {
  run().finally(() => process.exit(0));
}

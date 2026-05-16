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
import { execSync } from 'child_process';

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
import { writeBlogArticles, writeBlogArticle } from './blog-writer.js';
import { fetchConcours }          from './concours-parser.js';
import { sendWhatsAppDigest }     from './whatsapp.js';
import { generateLinkedInDigests } from './linkedin-digests.js';
import cron                       from 'node-cron';

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
    // Ensure slug uniqueness: new jobs must not collide with existing slugs
    const existingSlugs = new Set(updatedExisting.map((j) => j.slug).filter(Boolean));
    for (const job of enriched) {
      let candidate = job.slug;
      let suffix = 2;
      while (existingSlugs.has(candidate)) {
        candidate = `${job.slug}-${suffix++}`;
      }
      job.slug = candidate;
      existingSlugs.add(candidate);
    }

    // New enriched jobs go at the front (most recent)
    const finalJobs = [...enriched, ...updatedExisting];
    await fs.writeJson(JOBS_PATH, finalJobs, { spaces: 2 });
    log(`jobs.json: ${enriched.length} new jobs added. Total: ${finalJobs.length} jobs`);

    // ── 7. Append LinkedIn captions ────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    if (enriched.length > 0) {
      const lines = enriched.map((job) => {
        const caption = `${job.linkedin_caption} ↗`;
        const url     = `${SITE_URL}/offres/${job.slug || job.id}`;
        return `[${today}] | [${job.source_site}] | ${caption} | ${url}`;
      });
      await fs.appendFile(LINKEDIN_QUEUE, lines.join('\n') + '\n', 'utf-8');
    }
    log(`linkedin-queue.txt: ${enriched.length} captions added`);

    // ── 7b. Generate 5 LinkedIn digest posts ──────────────────────────────
    try {
      await generateLinkedInDigests(enriched);
    } catch (err) {
      log(`LinkedIn digests: ERREUR — ${err.message}`);
    }

    // ── 8. Scrape concours fonction publique ───────────────────────────────
    await fetchConcours();

    // ── 9. Git push data → triggers Vercel rebuild ────────────────────────
    try {
      const repoRoot = path.join(__dirname, '..');
      execSync('git add data/jobs.json data/articles.json data/concours.json', { cwd: repoRoot, stdio: 'pipe' });
      execSync('git diff --cached --quiet || git commit -m "chore: daily data update [skip ci]"', { cwd: repoRoot, stdio: 'pipe', shell: true });
      execSync('git push origin main', { cwd: repoRoot, stdio: 'pipe' });
      log('Git: data pushed to Vercel ✓');
    } catch (gitErr) {
      log(`Git: push ignoré — ${gitErr.message?.split('\n')[0]}`);
    }

    // ── 10. Attendre que Vercel finisse de déployer avant de poster ────────
    if (enriched.length > 0) {
      const VERCEL_WAIT_MS = 5 * 60 * 1000; // 5 minutes
      log(`LinkedIn: attente de ${VERCEL_WAIT_MS / 60000} min pour que Vercel déploie…`);
      await new Promise(resolve => setTimeout(resolve, VERCEL_WAIT_MS));
    }

    // ── 11. Post to LinkedIn (après déploiement) ───────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
async function runWhatsApp() {
  initLogger();
  log('WhatsApp digest: démarrage quotidien (09:00)');
  try {
    await sendWhatsAppDigest();
    log('WhatsApp digest: terminé avec succès');
  } catch (err) {
    log(`WhatsApp digest: ERREUR FATALE: ${err.message}`);
    console.error(err);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
const BLOG_MODE     = process.argv.includes('--blog');
const WHATSAPP_MODE = process.argv.includes('--whatsapp');

if (BLOG_MODE) {
  // One-shot: generate blog article and exit
  runBlog().finally(() => process.exit(0));
} else if (WHATSAPP_MODE) {
  // One-shot: send WhatsApp digest and exit
  runWhatsApp().finally(() => process.exit(0));
} else if (TEST_MODE) {
  // One-shot test: run scraping without writing files and exit
  run().finally(() => process.exit(0));
} else {
  // Default daemon mode:
  // 1. Run main scraping immediately (PM2 cron_restart fires this at 08:00)
  // 2. Set up internal crons for WhatsApp (09:00) and Blog (10:00 MWF)
  // 3. Stay alive — PM2 cron_restart kills and restarts at 08:00 next day
  run().catch((err) => log(`ERREUR FATALE: ${err.message}`));

  // WhatsApp + LinkedIn digests — every day at 09:00 Africa/Casablanca
  cron.schedule('0 9 * * *', async () => {
    log('WhatsApp digest: démarrage (cron 09:00)');
    try {
      await sendWhatsAppDigest();
      log('WhatsApp digest: terminé avec succès');
    } catch (err) {
      log(`WhatsApp digest: ERREUR — ${err.message}`);
    }
  }, { timezone: 'Africa/Casablanca' });

  // Blog article writer — Monday, Wednesday, Friday at 10:00 Africa/Casablanca
  cron.schedule('0 10 * * 1,3,5', async () => {
    log('Blog writer: démarrage (cron 10:00 lun/mer/ven)');
    try {
      await writeBlogArticle();
      log('Blog writer: article publié avec succès');
    } catch (err) {
      log(`Blog writer: ERREUR — ${err.message}`);
    }
  }, { timezone: 'Africa/Casablanca' });

  log('Agent: crons internes actifs (WhatsApp 09:00, Blog 10:00 lun/mer/ven) — processus en attente');
}

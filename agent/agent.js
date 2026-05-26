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
import http from 'http';
import { fork } from 'child_process';


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '.env') });
import fs from 'fs-extra';

import { initLogger, log }        from './logger.js';
import { fetchFeeds }             from './parser.js';
import { loadJobs, deduplicate }  from './deduplicator.js';
import { enrichJobs }             from './enricher.js';
import { expireJobs }             from './expirer.js';
import { postJobsToLinkedIn }                          from './linkedin.js';
import { writeBlogArticles, writeBlogArticle }          from './blog-writer.js';
import { fetchConcours }                               from './concours-parser.js';
import { sendWhatsAppDigest }                          from './whatsapp.js';
import { generateLinkedInDigests, postLinkedInNuit, postLinkedInGeneralJobs, postDigestByLabel } from './linkedin-digests.js';
import { pushToGithub }           from './github-sync.js';
import { notifyIndexNow }         from './indexnow.js';
import { checkDailyBudget, getDailyReport } from './token-tracker.js';
import cron                       from 'node-cron';

// ── Health check HTTP server (required by Railway) ────────────────────────────
const PORT = process.env.PORT || 3001;
let lastRunTime   = 'Never';
let lastRunStatus = 'Pending';

const healthServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:        'ok',
    service:       'InteractJob Agent',
    lastRun:       lastRunTime,
    lastRunStatus: lastRunStatus,
    nextRun:       '08:00 Africa/Casablanca',
    timezone:      'Africa/Casablanca',
    uptime:        Math.floor(process.uptime()) + 's',
  }));
});
healthServer.listen(PORT, () => {
  console.log(`[health] server listening on port ${PORT}`);
});

const DATA_DIR           = path.join(__dirname, '../data');
const JOBS_PATH          = path.join(DATA_DIR, 'jobs.json');
const LINKEDIN_QUEUE     = path.join(DATA_DIR, 'linkedin-queue.txt');
const TEST_MODE          = process.argv.includes('--test');
const SITE_URL           = (process.env.SITE_URL || 'https://interactjob.vercel.app').replace(/\/$/, '');

// Ensure data directory exists (Railway container may start without it)
fs.ensureDirSync(DATA_DIR);

// ──────────────────────────────────────────────────────────────────────────────
async function run() {
  initLogger();
  log(`Agent started${TEST_MODE ? ' [TEST MODE]' : ''}`);

  try {
    // OPTIMIZATION 6 & 7: Check daily budget guard (100,000 tokens = ~$0.70/day)
    const withinBudget = await checkDailyBudget(100000);
    if (!withinBudget) {
      log('[BUDGET] Daily token limit exceeded — stopping execution');
      return;
    }
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
      log(`TEST MODE: ${total} job(s) s�lectionn�(s) pour enrichissement (max 2 par source)`);
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
    const concoursResult = await fetchConcours();

    // ── 9. Git push data → triggers Vercel rebuild ────────────────────────
    await pushToGithub();

    // ── 9b. IndexNow — notifie Bing imm�diatement des nouvelles URLs ───────
    const newJobUrls      = enriched.map(j => `${SITE_URL}/offres/${j.slug}`);
    const newConcoursUrls = (concoursResult.newItems || []).map(c => `${SITE_URL}/concours/${c.slug}`);
    await notifyIndexNow([...newJobUrls, ...newConcoursUrls]);

    // ── 10. Attendre que Vercel finisse de d�ployer avant de poster ────────
    if (enriched.length > 0) {
      const VERCEL_WAIT_MS = 5 * 60 * 1000; // 5 minutes
      log(`LinkedIn: attente de ${VERCEL_WAIT_MS / 60000} min pour que Vercel d�ploie…`);
      await new Promise(resolve => setTimeout(resolve, VERCEL_WAIT_MS));
    }

    // ── 11. Post to LinkedIn (apr�s d�ploiement) ───────────────────────────
    await postJobsToLinkedIn(enriched, SITE_URL);

    // OPTIMIZATION 7 & 8: Print daily token usage report
    const report = await getDailyReport();
    if (report) {
      log('═══════════════════════════════════════════════════════════');
      log('📊 DAILY TOKEN USAGE REPORT');
      log('═══════════════════════════════════════════════════════════');
      for (const [func, usage] of Object.entries(report.functions || {})) {
        log(`  ${func}: ${usage.input} in + ${usage.output} out (${usage.calls} calls, $${usage.cost.toFixed(4)})`);
      }
      log(`  TOTAL: ${report.totalInput} input + ${report.totalOutput} output = $${report.totalCost.toFixed(4)}`);
      log('═══════════════════════════════════════════════════════════');
    }

    lastRunTime   = new Date().toISOString();
    lastRunStatus = 'success';
    log('Agent completed successfully');
  } catch (err) {
    lastRunTime   = new Date().toISOString();
    lastRunStatus = `error: ${err.message?.slice(0, 80)}`;
    log(`ERREUR FATALE: ${err.message}`);
    // Never rethrow — keep the process alive for the next cron tick
    console.error(err);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
async function runBlog() {
  initLogger();
  log('Blog writer: d�marrage hebdomadaire (lundi 09:00)');
  try {
    await writeBlogArticles();
    log('Blog writer: termin� avec succ�s');
  } catch (err) {
    log(`Blog writer: ERREUR FATALE: ${err.message}`);
    console.error(err);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
async function runWhatsApp(slot = 'matin') {
  initLogger();
  log(`WhatsApp digest: d�marrage (slot: ${slot})`);
  try {
    await sendWhatsAppDigest(slot);
    log(`WhatsApp digest ${slot}: termin� avec succ�s`);
  } catch (err) {
    log(`WhatsApp digest ${slot}: ERREUR FATALE: ${err.message}`);
    console.error(err);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
const BLOG_MODE           = process.argv.includes('--blog');
const JOBS_MODE           = process.argv.includes('--jobs');
const WHATSAPP_MODE       = process.argv.includes('--whatsapp');
const WHATSAPP_SOIR_MODE  = process.argv.includes('--whatsapp-soir');
const WHATSAPP_NUIT_MODE  = process.argv.includes('--whatsapp-nuit');
// LINKEDIN_SOIR_MODE removed — urgence expiration post supprimé
const LINKEDIN_NUIT_MODE  = process.argv.includes('--linkedin-nuit');
const LINKEDIN_JOBS_MODE  = process.argv.includes('--linkedin-jobs');

const WHATSAPP_SLOT = WHATSAPP_SOIR_MODE ? 'soir' : WHATSAPP_NUIT_MODE ? 'nuit' : 'matin';
const ANY_WHATSAPP  = WHATSAPP_MODE || WHATSAPP_SOIR_MODE || WHATSAPP_NUIT_MODE;

async function runLinkedInSlot(slot) {
  initLogger();
  log(`LinkedIn ${slot}: d�marrage`);
  try {
    if (slot === 'soir') await postLinkedInSoir();
    else await postLinkedInNuit();
    log(`LinkedIn ${slot}: termin� avec succ�s`);
  } catch (err) {
    log(`LinkedIn ${slot}: ERREUR FATALE: ${err.message}`);
    console.error(err);
  }
}

if (BLOG_MODE) {
  // One-shot: generate blog article and exit
  runBlog().finally(() => process.exit(0));
} else if (JOBS_MODE) {
  // One-shot: scrape + enrich + post LinkedIn + exit (used for 09h/14h/19h waves)
  run().finally(() => process.exit(0));
} else if (LINKEDIN_NUIT_MODE) {
  runLinkedInSlot('nuit').finally(() => process.exit(0));
} else if (LINKEDIN_JOBS_MODE) {
  // One-shot: post offres g�n�rales tous secteurs + exit
  (async () => {
    initLogger();
    log('LinkedIn jobs: d�marrage post offres g�n�rales');
    try {
      await postLinkedInGeneralJobs();
      log('LinkedIn jobs: termin� avec succ�s');
    } catch (err) {
      log(`LinkedIn jobs: ERREUR FATALE: ${err.message}`);
      console.error(err);
    }
  })().finally(() => process.exit(0));
} else if (ANY_WHATSAPP) {
  // One-shot: send WhatsApp digest for the given slot and exit
  runWhatsApp(WHATSAPP_SLOT).finally(() => process.exit(0));
} else if (TEST_MODE) {
  // One-shot test: run scraping without writing files and exit
  run().finally(() => process.exit(0));
} else {
  // Default daemon mode:
  // 1. Run main scraping immediately (PM2 cron_restart fires this at 08:00)
  // 2. Set up internal crons for WhatsApp (09:00, 17:00, 21:00) and Blog (10:00 MWF)
  // 3. Stay alive — PM2 cron_restart kills and restarts at 08:00 next day
  run().catch((err) => log(`ERREUR FATALE: ${err.message}`));

  // WhatsApp matin — 09:00 Casablanca
  cron.schedule('0 9 * * *', async () => {
    log('WhatsApp matin: d�marrage (cron 09:00)');
    try { await sendWhatsAppDigest('matin'); }
    catch (err) { log(`WhatsApp matin: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // WhatsApp soir — 17:00 Casablanca
  cron.schedule('0 17 * * *', async () => {
    log('WhatsApp soir: d�marrage (cron 17:00)');
    try { await sendWhatsAppDigest('soir'); }
    catch (err) { log(`WhatsApp soir: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // WhatsApp nuit — 21:00 Casablanca
  cron.schedule('0 21 * * *', async () => {
    log('WhatsApp nuit: d�marrage (cron 21:00)');
    try { await sendWhatsAppDigest('nuit'); }
    catch (err) { log(`WhatsApp nuit: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // LinkedIn nuit — 21:00 Casablanca
  cron.schedule('0 21 * * *', async () => {
    log('LinkedIn nuit: d�marrage (cron 21:00)');
    try { await postLinkedInNuit(); }
    catch (err) { log(`LinkedIn nuit: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // LinkedIn offres g�n�rales — 21:10 Casablanca
  cron.schedule('10 21 * * *', async () => {
    log('LinkedIn jobs: d�marrage (cron 21:10)');
    try { await postLinkedInGeneralJobs(); }
    catch (err) { log(`LinkedIn jobs: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // LinkedIn digests — publish from queue at scheduled times
  // 08:00 — Hôtellerie
  cron.schedule('0 8 * * *', async () => {
    log('LinkedIn digest 08:00: démarrage (cron 08:00)');
    try { await postDigestByLabel('08:00 HÔTELLERIE'); }
    catch (err) { log(`LinkedIn digest 08:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // 10:00 — IT & Digital
  cron.schedule('0 10 * * *', async () => {
    log('LinkedIn digest 10:00: démarrage (cron 10:00)');
    try { await postDigestByLabel('10:00 IT & DIGITAL'); }
    catch (err) { log(`LinkedIn digest 10:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // 12:00 — RH & Finance
  cron.schedule('0 12 * * *', async () => {
    log('LinkedIn digest 12:00: démarrage (cron 12:00)');
    try { await postDigestByLabel('12:00 RH & FINANCE'); }
    catch (err) { log(`LinkedIn digest 12:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // 19:00 — Article Blog
  cron.schedule('0 19 * * *', async () => {
    log('LinkedIn digest 19:00: démarrage (cron 19:00)');
    try { await postDigestByLabel('19:00 ARTICLE BLOG'); }
    catch (err) { log(`LinkedIn digest 19:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // Blog article writer — Monday, Wednesday, Friday at 10:00 Casablanca
  cron.schedule('0 10 * * 1,3,5', async () => {
    log('Blog writer: d�marrage (cron 10:00 lun/mer/ven)');
    try { await writeBlogArticle(); log('Blog writer: article publi� avec succ�s'); }
    catch (err) { log(`Blog writer: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Scraping jobs — 3 vagues/jour (remplacement PM2 cron_restart) ─────────
  // Vague 1 — 09:00 Casablanca
  cron.schedule('0 9 * * *', async () => {
    log('Scraping vague 1: démarrage (cron 09:00)');
    try { await run(); }
    catch (err) { log(`Scraping vague 1: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // Vague 2 — 14:00 Casablanca
  cron.schedule('0 14 * * *', async () => {
    log('Scraping vague 2: démarrage (cron 14:00)');
    try { await run(); }
    catch (err) { log(`Scraping vague 2: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // Vague 3 — 19:00 Casablanca
  cron.schedule('0 19 * * *', async () => {
    log('Scraping vague 3: démarrage (cron 19:00)');
    try { await run(); }
    catch (err) { log(`Scraping vague 3: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Remote scraper — toutes les heures ───────────────────────────────────
  cron.schedule('0 * * * *', () => {
    log('Remote scraper: démarrage (cron horaire)');
    const child = fork(path.join(__dirname, 'remote-scraper.js'), [], { silent: false });
    child.on('exit', (code) => log(`Remote scraper: terminé (code ${code})`));
    child.on('error', (err) => log(`Remote scraper: ERREUR — ${err.message}`));
  }, { timezone: 'Africa/Casablanca' });

  // ── LinkedIn remote — 11:00 Casablanca (décalé pour éviter conflit avec scraping 09h) ──
  cron.schedule('0 11 * * *', () => {
    log('LinkedIn remote: démarrage (cron 11:00)');
    const child = fork(path.join(__dirname, 'linkedin-remote-poster.js'), [], { silent: false });
    child.on('exit', (code) => log(`LinkedIn remote: terminé (code ${code})`));
    child.on('error', (err) => log(`LinkedIn remote: ERREUR — ${err.message}`));
  }, { timezone: 'Africa/Casablanca' });

  log('Agent: crons actifs — Scraping 09h/14h/19h · WA 09h/17h/21h · LinkedIn 08h/10h/12h/19h/21h/21h10 · LinkedIn Remote 11h · Blog 10h lun/mer/ven · Remote scraper 1x/h · processus en attente');
}

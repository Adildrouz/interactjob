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
import { sendWhatsAppDigest } from './whatsapp.js';
import { generateLinkedInDigests, postLinkedInNuit, postLinkedInGeneralJobs, postDigestByLabel } from './linkedin-digests.js';
import { pushToGithub, syncJobsFromGithub } from './github-sync.js';
import { notifyIndexNow }         from './indexnow.js';
import { checkDailyBudget, getDailyReport } from './token-tracker.js';
import cron                       from 'node-cron';
import { runTwitterPoster }        from './twitter-poster.js';
import { runKPIReporter }          from './kpi-reporter.js';
import { runLinkedInMessages, registerTelegramWebhook } from './linkedin-messages.js';
import { runStatsReporter, runWeeklyReport, runMonthlyReport, runMonthlyReview } from './stats-reporter.js';
import { runWeeklyNewsletter } from './brevo-newsletter.js';
import { runAlertsSender } from './alerts-sender.js';

// ── Health check HTTP server (required by Railway) ────────────────────────────
const PORT = process.env.PORT || 3001;
let lastRunTime   = 'Never';
let lastRunStatus = 'Pending';

const healthServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`);

  if (url.pathname === '/api/kpi-now' && req.method === 'GET') {
    const secret = url.searchParams.get('secret');
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Report sent to email' }));
    log('[kpi] /api/kpi-now déclenché manuellement');
    runKPIReporter().catch((err) => log(`[kpi] Error: ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/whatsapp-soir' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'WhatsApp soir triggered' }));
    log('[trigger] /trigger/whatsapp-soir appelé manuellement');
    sendWhatsAppDigest('soir').catch((err) => log(`[trigger] WhatsApp soir: ERREUR — ${err.message}`));
    return;
  }

  // Manually publish a LinkedIn digest by its queue label, e.g.
  // POST /trigger/linkedin-digest?label=08:00%20OFFRES%20MATIN
  // postDigestByLabel lazily generates today's entry if missing and skips if
  // already published for today (dedup via published-posts.json).
  if (url.pathname === '/trigger/linkedin-digest' && req.method === 'POST') {
    const label = (url.searchParams.get('label') || '').trim();
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', label }));
    log(`[trigger] /trigger/linkedin-digest label="${label}"`);
    postDigestByLabel(label).catch((err) => log(`[trigger] linkedin-digest "${label}": ERREUR — ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/twitter' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'Twitter poster triggered' }));
    log('[trigger] /trigger/twitter appelé manuellement');
    runTwitterPoster().catch((err) => log(`[trigger] Twitter: ERREUR — ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/linkedin-messages' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'LinkedIn messages agent triggered' }));
    log('[trigger] /trigger/linkedin-messages appelé manuellement');
    runLinkedInMessages().catch((err) => log(`[trigger] LinkedIn messages: ERREUR — ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/newsletter' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'Newsletter Brevo triggered' }));
    log('[trigger] /trigger/newsletter appelé manuellement');
    runWeeklyNewsletter().catch((err) => log(`[trigger] Newsletter: ERREUR — ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/stats' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'Stats reporter triggered' }));
    log('[trigger] /trigger/stats appelé manuellement');
    runStatsReporter().catch((err) => log(`[trigger] Stats: ERREUR — ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/weekly' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'Weekly report triggered' }));
    log('[trigger] /trigger/weekly appelé manuellement');
    runWeeklyReport().catch((err) => log(`[trigger] Weekly: ERREUR — ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/monthly' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'Monthly report triggered' }));
    log('[trigger] /trigger/monthly appelé manuellement');
    runMonthlyReport().catch((err) => log(`[trigger] Monthly: ERREUR — ${err.message}`));
    return;
  }

  if (url.pathname === '/trigger/review' && req.method === 'POST') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', message: 'Monthly review PPTX triggered' }));
    log('[trigger] /trigger/review appelé manuellement');
    runMonthlyReview().catch((err) => log(`[trigger] Review: ERREUR — ${err.message}`));
    return;
  }

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
// ── Telegram helper (inline, no external dep) ─────────────────────────────────
async function notifyTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const https = await import('https');
    const body  = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
    await new Promise((resolve) => {
      const req = https.default.request(
        `https://api.telegram.org/bot${token}/sendMessage`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
        (res) => { res.resume(); res.on('end', resolve); }
      );
      req.on('error', resolve);
      req.write(body);
      req.end();
    });
  } catch (_) { /* never crash because of a notification failure */ }
}

// ── Crash guard — notify Telegram on unhandled errors then exit ───────────────
process.on('uncaughtException', async (err) => {
  console.error('[CRASH] uncaughtException:', err);
  await notifyTelegram(`🔴 *Agent Railway CRASH*\n\`uncaughtException\`\n\`${err.message}\`\n\nVérifiez les logs Railway.`);
  process.exit(1);
});
process.on('unhandledRejection', async (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('[CRASH] unhandledRejection:', reason);
  await notifyTelegram(`🔴 *Agent Railway CRASH*\n\`unhandledRejection\`\n\`${msg}\`\n\nVérifiez les logs Railway.`);
  process.exit(1);
});

healthServer.listen(PORT, () => {
  console.log(`[health] server listening on port ${PORT}`);
  registerTelegramWebhook().catch(err => log(`[telegram] Webhook setup error: ${err.message}`));
  // Startup notification — confirms agent is alive after each Railway deploy/restart
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
  notifyTelegram(`✅ *Agent Railway démarré*\n${now} (Casablanca)\nPort ${PORT} · tous les modules chargés.`);
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
    const withinBudget = await checkDailyBudget(300000);
    if (!withinBudget) {
      log('[BUDGET] Daily token limit (300k) exceeded — stopping execution');
      return;
    }
    // ── 0. Sync jobs.json from GitHub to preserve employer Direct jobs ─────
    await syncJobsFromGithub();

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
    if (typeof gc === 'function') gc(); // release heap after large write

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

// WHATSAPP DISABLED 2026-05-30
// async function runWhatsApp(slot = 'matin') {
//   initLogger();
//   log(`WhatsApp digest: démarrage (slot: ${slot})`);
//   try {
//     await sendWhatsAppDigest(slot);
//     log(`WhatsApp digest ${slot}: terminé avec succès`);
//   } catch (err) {
//     log(`WhatsApp digest ${slot}: ERREUR FATALE: ${err.message}`);
//     console.error(err);
//   }
// }

// ── Entry point ───────────────────────────────────────────────────────────────
const BLOG_MODE           = process.argv.includes('--blog');
const JOBS_MODE           = process.argv.includes('--jobs');
// WHATSAPP DISABLED 2026-05-30
// const WHATSAPP_MODE      = process.argv.includes('--whatsapp');
// const WHATSAPP_SOIR_MODE = process.argv.includes('--whatsapp-soir');
// const WHATSAPP_NUIT_MODE = process.argv.includes('--whatsapp-nuit');
// const WHATSAPP_SLOT      = WHATSAPP_SOIR_MODE ? 'soir' : WHATSAPP_NUIT_MODE ? 'nuit' : 'matin';
// const ANY_WHATSAPP       = WHATSAPP_MODE || WHATSAPP_SOIR_MODE || WHATSAPP_NUIT_MODE;
// LINKEDIN_SOIR_MODE removed — urgence expiration post supprimé
const LINKEDIN_NUIT_MODE  = process.argv.includes('--linkedin-nuit');
const LINKEDIN_JOBS_MODE  = process.argv.includes('--linkedin-jobs');

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
// WHATSAPP DISABLED 2026-05-30
// } else if (ANY_WHATSAPP) {
//   runWhatsApp(WHATSAPP_SLOT).finally(() => process.exit(0));
} else if (TEST_MODE) {
  // One-shot test: run scraping without writing files and exit
  run().finally(() => process.exit(0));
} else {
  // DAEMON MODE — used by Railway (node agent/agent.js with no flags).
  // ecosystem.config.cjs PM2 processes are LOCAL ONLY (cwd: C:/Users/Adil/...).
  // On Railway, all scheduling must live here as internal node-cron jobs.
  log('Agent daemon: démarrage — Railway mode, crons internes actifs');

  // ── Scraping jobs — 3 vagues/jour ────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    log('Scraping vague 1: démarrage (cron 09:00)');
    try { await run(); }
    catch (err) { log(`Scraping vague 1: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  cron.schedule('0 14 * * *', async () => {
    log('Scraping vague 2: démarrage (cron 14:00)');
    try { await run(); }
    catch (err) { log(`Scraping vague 2: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  cron.schedule('0 19 * * *', async () => {
    log('Scraping vague 3: démarrage (cron 19:00)');
    try { await run(); }
    catch (err) { log(`Scraping vague 3: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── LinkedIn digests — publish from queue ────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    log('LinkedIn digest 08:00: démarrage');
    try { await postDigestByLabel('08:00 OFFRES MATIN'); }
    catch (err) { log(`LinkedIn digest 08:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  cron.schedule('0 10 * * *', async () => {
    log('LinkedIn digest 10:00: démarrage');
    try { await postDigestByLabel('10:00 OFFRES MID'); }
    catch (err) { log(`LinkedIn digest 10:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  cron.schedule('0 12 * * *', async () => {
    log('LinkedIn digest 12:00: démarrage');
    try { await postDigestByLabel('12:00 OFFRES MIDI'); }
    catch (err) { log(`LinkedIn digest 12:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  cron.schedule('0 19 * * *', async () => {
    log('LinkedIn digest 19:00: démarrage');
    try { await postDigestByLabel('19:00 ARTICLE BLOG'); }
    catch (err) { log(`LinkedIn digest 19:00: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── LinkedIn nuit + jobs généraux ─────────────────────────────────────────
  cron.schedule('0 21 * * *', async () => {
    log('LinkedIn nuit: démarrage (cron 21:00)');
    try { await postLinkedInNuit(); }
    catch (err) { log(`LinkedIn nuit: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  cron.schedule('10 21 * * *', async () => {
    log('LinkedIn jobs: démarrage (cron 21:10)');
    try { await postLinkedInGeneralJobs(); }
    catch (err) { log(`LinkedIn jobs: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Blog article writer — Lun / Mer / Ven 10:00 ───────────────────────────
  cron.schedule('0 10 * * 1,3,5', async () => {
    log('Blog writer: démarrage (cron 10:00 lun/mer/ven)');
    try { await writeBlogArticle(); log('Blog writer: article publié avec succès'); }
    catch (err) { log(`Blog writer: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Remote scraper — toutes les heures ───────────────────────────────────
  cron.schedule('0 * * * *', () => {
    log('Remote scraper: démarrage (cron horaire)');
    const child = fork(path.join(__dirname, 'remote-scraper.js'), [], { silent: false });
    child.on('exit', (code) => log(`Remote scraper: terminé (code ${code})`));
    child.on('error', (err) => log(`Remote scraper: ERREUR — ${err.message}`));
  }, { timezone: 'Africa/Casablanca' });

  // ── LinkedIn remote poster — ciblage US peak, Marocains dormants ────────
  // 02:00 Casablanca = 01:00 UTC = 21:00 ET → prime time LinkedIn US ✅
  cron.schedule('0 2 * * *', () => {
    log('LinkedIn remote: démarrage (cron 02:00 Casa = 21:00 ET)');
    const child = fork(path.join(__dirname, 'linkedin-remote-poster.js'), [], { silent: false });
    child.on('exit', (code) => log(`LinkedIn remote: terminé (code ${code})`));
    child.on('error', (err) => log(`LinkedIn remote: ERREUR — ${err.message}`));
  }, { timezone: 'Africa/Casablanca' });

  // 04:00 Casablanca = 03:00 UTC = 23:00 ET → late US, Marocains dormants ✅
  cron.schedule('0 4 * * *', () => {
    log('LinkedIn remote: démarrage (cron 04:00 Casa = 23:00 ET)');
    const child = fork(path.join(__dirname, 'linkedin-remote-poster.js'), [], { silent: false });
    child.on('exit', (code) => log(`LinkedIn remote: terminé (code ${code})`));
    child.on('error', (err) => log(`LinkedIn remote: ERREUR — ${err.message}`));
  }, { timezone: 'Africa/Casablanca' });

  // ── Daily stats report — 08:05 Casablanca (décalé pour éviter le redémarrage Railway) ──
  cron.schedule('5 8 * * *', async () => {
    log('Stats reporter: démarrage (cron 08:05 Casablanca)');
    try { await runStatsReporter(); }
    catch (err) { log(`Stats reporter: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Weekly stats report — lundi 08:15 Casablanca ────────────────────────
  cron.schedule('15 8 * * 1', async () => {
    log('Weekly stats: démarrage (cron lundi 08:15 Casablanca)');
    try { await runWeeklyReport(); }
    catch (err) { log(`Weekly stats: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Monthly stats + PPTX review — 1er du mois 08:30 Casablanca ──────────
  cron.schedule('30 8 1 * *', async () => {
    log('Monthly stats: démarrage (cron 1er du mois 08:30 Casablanca)');
    try { await runMonthlyReport(); }
    catch (err) { log(`Monthly stats: ERREUR — ${err.message}`); }
    try { await runMonthlyReview(); }
    catch (err) { log(`Monthly review PPTX: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Alertes emploi par email — 20:30 Casablanca (après la vague de scraping 19:00) ──
  cron.schedule('30 20 * * *', async () => {
    log('Alerts: démarrage (cron 20:30 Casablanca)');
    try { await runAlertsSender(); }
    catch (err) { log(`Alerts: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── Brevo newsletter hebdomadaire — lundi 10:30 Casablanca ──────────────
  cron.schedule('30 10 * * 1', async () => {
    log('Newsletter Brevo: démarrage (cron lundi 10:30 Casablanca)');
    try { await runWeeklyNewsletter(); }
    catch (err) { log(`Newsletter Brevo: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── LinkedIn Message Response Agent — 07:30 chaque jour ─────────────────
  cron.schedule('30 7 * * *', async () => {
    log('LinkedIn messages: démarrage (cron 07:30)');
    try { await runLinkedInMessages(); }
    catch (err) { log(`LinkedIn messages: ERREUR — ${err.message}`); }
  }, { timezone: 'Africa/Casablanca' });

  // ── WhatsApp — 3x/jour via Baileys ──────────────────────────────────────────
  cron.schedule('0 9 * * *',  async () => { await sendWhatsAppDigest('matin'); }, { timezone: 'Africa/Casablanca' });
  cron.schedule('0 17 * * *', async () => { await sendWhatsAppDigest('soir');  }, { timezone: 'Africa/Casablanca' });
  cron.schedule('0 21 * * *', async () => { await sendWhatsAppDigest('nuit');  }, { timezone: 'Africa/Casablanca' });

  // ── KPI reporter — chaque lundi 07:00 UTC = 08:00 Africa/Casablanca ──────────
  cron.schedule('0 7 * * 1', async () => {
    log('KPI reporter: démarrage (cron lundi 07:00 UTC)');
    try { await runKPIReporter(); }
    catch (err) { log(`KPI reporter: ERREUR — ${err.message}`); }
  }, { timezone: 'UTC' });

  // ── Twitter/X poster DISABLED 2026-06-07 (API v2 write = Basic plan $100/mois requis)
  // cron.schedule('0 8 * * *',  async () => { await runTwitterPoster(); });
  // cron.schedule('0 13 * * *', async () => { await runTwitterPoster(); });
  // cron.schedule('0 18 * * *', async () => { await runTwitterPoster(); });

  log('Agent daemon: crons actifs — Scraping 09h/14h/19h · LinkedIn 08h/10h/12h/19h/21h · Blog 10h lun/mer/ven · Remote 1x/h · LinkedIn remote 02h/04h · KPI lundi 07h UTC · Stats 08h daily · Weekly lundi 08h15 · Monthly 1er 08h30');
}

/**
 * PM2 Ecosystem — InteractJob Agent
 *
 * Scheduling strategy: PM2 cron_restart restarts the process on schedule.
 * The agent runs once and exits (no internal cron loop).
 * dotenv loads secrets from agent/.env at startup.
 *
 * Deploy:
 *   pm2 delete all
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *
 * Manual trigger:
 *   pm2 restart interactjob-agent          → scraping 09:00
 *   pm2 restart interactjob-agent-14h      → scraping 14:00
 *   pm2 restart interactjob-agent-19h      → scraping 19:00
 *   pm2 restart interactjob-blog
 *
 * Horaires (UTC → Casablanca summer UTC+1) :
 *   08h UTC = 09h Casablanca  |  13h UTC = 14h Casablanca  |  18h UTC = 19h Casablanca
 *   16h UTC = 17h Casablanca  |  20h UTC = 21h Casablanca
 *
 * Staggering (FIX 2): 09:00 processes separated by 6 min to avoid ~1 GB RAM spike.
 * Removed (FIX 1): interactjob-linkedin-17h  — had --linkedin-soir which is unhandled,
 *                  fell into daemon mode and duplicated all internal crons.
 * Removed (FIX 3): all WhatsApp PM2 processes — API token expired, WhatsApp disabled.
 */

module.exports = {
  apps: [
    // ── Vague 1 — Scraping 09:00 Casablanca ─────────────────────────────────
    {
      name: 'interactjob-agent',
      script: './agent.js',
      args: '--jobs',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 08:00 UTC = 09:00 Casablanca (summer)
      cron_restart: '0 8 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Vague 2 — Scraping 14:00 Casablanca ─────────────────────────────────
    {
      name: 'interactjob-agent-14h',
      script: './agent.js',
      args: '--jobs',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 13:00 UTC = 14:00 Casablanca (summer)
      cron_restart: '0 13 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Vague 3 — Scraping 19:00 Casablanca ─────────────────────────────────
    {
      name: 'interactjob-agent-19h',
      script: './agent.js',
      args: '--jobs',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 18:00 UTC = 19:00 Casablanca (summer)
      cron_restart: '0 18 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Blog writer — Lun / Mer / Ven à 10:00 Casablanca ────────────────────
    {
      name: 'interactjob-blog',
      script: './agent.js',
      args: '--blog',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 09:00 UTC = 10:00 Casablanca (summer)
      cron_restart: '0 9 * * 1,3,5',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── LinkedIn NUIT — 21:00 Casablanca : Promotion article blog ───────────
    {
      name: 'interactjob-linkedin-21h',
      script: './agent.js',
      args: '--linkedin-nuit',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 20:00 UTC = 21:00 Casablanca (summer)
      cron_restart: '0 20 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── LinkedIn JOBS — 21:10 Casablanca : Offres générales tous secteurs ───
    {
      name: 'interactjob-linkedin-jobs-21h',
      script: './agent.js',
      args: '--linkedin-jobs',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 20:10 UTC = 21:10 Casablanca (summer) — already offset from linkedin-21h
      cron_restart: '10 20 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Remote scraper — toutes les heures ──────────────────────────────────
    {
      name: 'interactjob-remote-scraper',
      script: './remote-scraper.js',
      cwd: 'C:/Users/Adil/interactjob/agent',
      cron_restart: '0 * * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── LinkedIn Followers — 08:00 Casablanca : mise à jour compteur abonnés ──
    {
      name: 'linkedin-followers',
      script: './linkedin-followers.js',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 07:00 UTC = 08:00 Casablanca (Morocco = UTC+1 permanent depuis 2023)
      cron_restart: '0 7 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '64M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── LinkedIn Remote — 09:06 Casablanca : 5 offres remote du jour ────────
    // FIX 2: was '0 8 * * *' (same second as interactjob-agent — ~256 MB spike)
    // Staggered +6 min to '6 8 * * *' so only one heavy process runs at a time.
    {
      name: 'interactjob-remote-linkedin',
      script: './linkedin-remote-poster.js',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 08:06 UTC = 09:06 Casablanca (summer) — staggered +6 min after agent
      cron_restart: '6 8 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Stats reporter — 08:05 Casablanca : rapport Telegram quotidien ───────
    // Runs as one-shot (--stats flag) so it exits cleanly after sending.
    // 07:05 UTC = 08:05 Casablanca (summer UTC+1) — after scraping vague 1
    {
      name: 'interactjob-stats',
      script: './agent.js',
      args: '--stats',
      cwd: 'C:/Users/Adil/interactjob/agent',
      cron_restart: '5 7 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Weekly stats — lundi 08:15 Casablanca ───────────────────────────────
    {
      name: 'interactjob-stats-weekly',
      script: './agent.js',
      args: '--weekly',
      cwd: 'C:/Users/Adil/interactjob/agent',
      cron_restart: '15 7 * * 1',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Monthly stats — 1er du mois 08:30 Casablanca ────────────────────────
    {
      name: 'interactjob-stats-monthly',
      script: './agent.js',
      args: '--monthly',
      cwd: 'C:/Users/Adil/interactjob/agent',
      cron_restart: '30 7 1 * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

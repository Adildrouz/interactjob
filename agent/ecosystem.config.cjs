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
 *   pm2 restart interactjob-whatsapp       → matin  09:00
 *   pm2 restart interactjob-whatsapp-17h   → soir   17:00
 *   pm2 restart interactjob-whatsapp-21h   → nuit   21:00
 *
 * Horaires (UTC → Casablanca summer UTC+1) :
 *   08h UTC = 09h Casablanca  |  13h UTC = 14h Casablanca  |  18h UTC = 19h Casablanca
 *   16h UTC = 17h Casablanca  |  20h UTC = 21h Casablanca
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

    // ── WhatsApp MATIN — 09:00 Casablanca : Offres du Jour ──────────────────
    {
      name: 'interactjob-whatsapp',
      script: './agent.js',
      args: '--whatsapp',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 08:00 UTC = 09:00 Casablanca (summer)
      cron_restart: '0 8 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── WhatsApp SOIR — 17:00 Casablanca : Bilan Fin de Journée ─────────────
    {
      name: 'interactjob-whatsapp-17h',
      script: './agent.js',
      args: '--whatsapp-soir',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 16:00 UTC = 17:00 Casablanca (summer)
      cron_restart: '0 16 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── WhatsApp NUIT — 21:00 Casablanca : Bonne Soirée ─────────────────────
    {
      name: 'interactjob-whatsapp-21h',
      script: './agent.js',
      args: '--whatsapp-nuit',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 20:00 UTC = 21:00 Casablanca (summer)
      cron_restart: '0 20 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── LinkedIn SOIR — 17:00 Casablanca : Offres qui expirent ──────────────
    {
      name: 'interactjob-linkedin-17h',
      script: './agent.js',
      args: '--linkedin-soir',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 16:00 UTC = 17:00 Casablanca (summer)
      cron_restart: '0 16 * * *',
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
      // 20:10 UTC = 21:10 Casablanca (summer)
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

    // ── LinkedIn Remote — 09:00 Casablanca : 5 offres remote du jour ────────
    {
      name: 'interactjob-remote-linkedin',
      script: './linkedin-remote-poster.js',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // 08:00 UTC = 09:00 Casablanca (summer)
      cron_restart: '0 8 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

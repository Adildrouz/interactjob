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
 *   pm2 restart interactjob-agent
 *   pm2 restart interactjob-blog
 */

module.exports = {
  apps: [
    {
      name: 'interactjob-agent',
      script: './agent.js',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // Run daily at 08:00 Morocco time (07:00 UTC in summer, 08:00 UTC in winter)
      // Using 07:00 UTC covers UTC+1 (Morocco DST, Apr–Oct) — adjust if needed
      cron_restart: '0 7 * * *',
      autorestart: false,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'interactjob-blog',
      script: './agent.js',
      args: '--blog',
      cwd: 'C:/Users/Adil/interactjob/agent',
      // Run every Monday at 09:00 Morocco time (08:00 UTC in summer)
      cron_restart: '0 8 * * 1',
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

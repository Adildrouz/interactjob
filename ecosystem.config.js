module.exports = {
  apps: [
    {
      name: 'interactjob',
      script: './start-server-direct.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './.pm2/logs/error.log',
      out_file: './.pm2/logs/out.log',
      log_file: './.pm2/logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

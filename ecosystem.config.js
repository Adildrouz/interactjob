module.exports = {
  apps: [
    {
      name: 'interactjob-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'interactjob-agent',
      script: 'agent/agent.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'node --input-type=module',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/agent-error.log',
      out_file: './logs/agent-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:repo.git',
      path: '/var/www/interactjob'
    }
  }
};

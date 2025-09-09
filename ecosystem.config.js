module.exports = {
  apps: [{
    name: 'helium-inviter-server',
    script: 'server.js',
    cwd: '/var/www/helium-inviter',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/helium-inviter-error.log',
    out_file: '/var/log/pm2/helium-inviter-out.log',
    log_file: '/var/log/pm2/helium-inviter-combined.log',
    time: true
  }]
};

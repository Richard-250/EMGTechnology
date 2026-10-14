const path = require('path');

const common = {
  restart_delay: 4000,
  exp_backoff_restart_delay: 1000,
  max_restarts: 30,
  min_uptime: '10s',
  kill_timeout: 8000,
  autorestart: true,
};

let nextBin;
try {
  nextBin = require.resolve('next/dist/bin/next');
} catch {
  nextBin = path.resolve(__dirname, 'node_modules/next/dist/bin/next');
}

module.exports = {
  apps: [
    {
      ...common,
      name: 'emg-server',
      cwd: './apps/server',
      script: 'node',
      args: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '1200M',
    },
    {
      ...common,
      name: 'emg-worker',
      cwd: './apps/server',
      script: 'node',
      args: 'dist/index-worker.js',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '800M',
    },
    {
      ...common,
      name: 'emg-storefront',
      cwd: './apps/storefront',
      // Run Next directly — do NOT wrap with `npm run`.
      // npm stays "online" (~40MB) after Next hangs/dies, which caused nginx 502s.
      script: 'node',
      args: `${nextBin} start --port 3002 --hostname 127.0.0.1`,
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOSTNAME: '127.0.0.1',
      },
      max_memory_restart: '900M',
    },
    {
      ...common,
      name: 'emg-storefront-watchdog',
      cwd: '.',
      script: 'node',
      args: 'scripts/storefront-watchdog.js',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '80M',
    },
  ],
};

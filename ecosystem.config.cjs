module.exports = {
  apps: [
    {
      name: 'emg-server',
      cwd: './apps/server',
      script: 'node',
      args: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: 'emg-worker',
      cwd: './apps/server',
      script: 'node',
      args: 'dist/index-worker.js',
      env: {
        NODE_ENV: 'production',
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: 'emg-storefront',
      cwd: './apps/storefront',
      script: 'node_modules/.bin/next',
      args: 'start --port 3002',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};

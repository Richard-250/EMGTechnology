#!/usr/bin/env bash
# Build the Vendure admin dashboard on production and restart the API.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

echo ">>> Pulling latest code..."
git pull origin main

echo ">>> Installing dependencies..."
npm install

bash scripts/build-server-production.sh

echo ">>> Restarting Vendure..."
pm2 restart emg-server emg-worker --update-env
pm2 save

echo ">>> Waiting for dashboard..."
for i in $(seq 1 30); do
  STATUS=$(curl -sf http://127.0.0.1:3001/dashboard/__status 2>/dev/null || true)
  if echo "$STATUS" | grep -q '"hasBuiltFiles":true'; then
    echo "Dashboard is serving built files (ready after ${i}s)."
    exit 0
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Dashboard still on placeholder page."
    echo "Status: ${STATUS:-"(no response)"}"
    echo "Check: pm2 logs emg-server --lines 30"
    echo "On disk: ls -la apps/server/dist/dashboard/"
    exit 1
  fi
  sleep 1
done

#!/usr/bin/env bash
# Build the Vendure admin dashboard on production and restart the API.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

echo ">>> Pulling latest code..."
git pull origin main

echo ">>> Installing dependencies..."
npm install

echo ">>> Building server + dashboard..."
rm -rf apps/server/dist/dashboard
npm run build -w server

DASHBOARD_JS=$(grep -o 'assets/index-[^"]*\.js' apps/server/dist/dashboard/index.html | head -1)
if [ -z "$DASHBOARD_JS" ] || [ ! -f "apps/server/dist/dashboard/${DASHBOARD_JS}" ]; then
  echo "ERROR: Dashboard build failed — index.html and JS bundle do not match."
  exit 1
fi
echo "Dashboard built: ${DASHBOARD_JS}"

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
    echo "ERROR: Dashboard still on placeholder page. Check: pm2 logs emg-server --lines 30"
    exit 1
  fi
  sleep 1
done

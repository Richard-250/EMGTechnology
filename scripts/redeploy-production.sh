#!/usr/bin/env bash
# Safe production redeploy for EMG Technology (run on the server as root)
set -euo pipefail

APP_DIR="/var/www/EMGTechnology"
cd "$APP_DIR"

echo ">>> Pulling latest code..."
git checkout -- apps/server/src/gql/graphql-env.d.ts package-lock.json 2>/dev/null || true
git pull origin main

echo ">>> Installing dependencies..."
npm install

echo ">>> Building backend (server + worker + dashboard)..."
bash scripts/build-server-production.sh

echo ">>> Restarting Vendure with new build..."
pm2 restart emg-server emg-worker --update-env

echo ">>> Syncing database schema (custom fields, etc.)..."
bash scripts/sync-database-schema.sh

echo ">>> Waiting for Vendure API..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3001/shop-api \
    -X POST -H "Content-Type: application/json" \
    -d '{"query":"{ activeChannel { id } }"}' >/dev/null; then
    echo "API ready after ${i}s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Vendure API did not start. Check: pm2 logs emg-server --lines 50"
    exit 1
  fi
  sleep 1
done

echo ">>> Verifying admin dashboard assets..."
DASHBOARD_JS=$(grep -o 'assets/index-[^"]*\.js' apps/server/dist/dashboard/index.html | head -1 || true)
if [ -n "$DASHBOARD_JS" ]; then
  if [ ! -f "apps/server/dist/dashboard/${DASHBOARD_JS}" ]; then
    echo "ERROR: Dashboard build incomplete — missing apps/server/dist/dashboard/${DASHBOARD_JS}"
    echo "Re-run: npm run build -w server"
    exit 1
  fi
  echo "Dashboard asset OK: ${DASHBOARD_JS}"
else
  echo "ERROR: Dashboard index.html missing JS bundle reference."
  exit 1
fi

DASHBOARD_STATUS=$(curl -sf http://127.0.0.1:3001/dashboard/__status 2>/dev/null || true)
if ! echo "$DASHBOARD_STATUS" | grep -q '"hasBuiltFiles":true'; then
  echo "ERROR: Dashboard is still serving the placeholder page."
  echo "Run: bash scripts/fix-production-dashboard.sh"
  exit 1
fi
echo "Dashboard status OK (built files served)."

echo ">>> Building storefront..."
rm -f apps/storefront/.next/lock
rm -rf apps/storefront/.next
npm run build -w storefront

echo ">>> Restarting storefront..."
pm2 restart emg-storefront --update-env
pm2 save

echo ">>> Health check..."
sleep 3
curl -sf http://127.0.0.1:3002/en >/dev/null || {
  echo "ERROR: Storefront not responding. Check: pm2 logs emg-storefront --lines 50"
  exit 1
}

pm2 status

echo ">>> Revalidating storefront caches..."
REVALIDATION_SECRET=$(grep -E '^REVALIDATION_SECRET=' apps/storefront/.env.local 2>/dev/null | cut -d= -f2- || true)
if [ -n "$REVALIDATION_SECRET" ]; then
  curl -sf http://127.0.0.1:3002/api/revalidate \
    -X POST \
    -H "Authorization: Bearer ${REVALIDATION_SECRET}" \
    -H "Content-Type: application/json" \
    -d '{"tags":["products","featured","deals","home-catalog","category-products","collection","collections"]}' \
    && echo "Cache revalidated." \
    || echo "WARNING: Cache revalidation failed (storefront may serve stale data until next request)."
else
  echo "WARNING: REVALIDATION_SECRET not set in apps/storefront/.env.local — skipping cache revalidation."
fi

echo ">>> Deploy complete."

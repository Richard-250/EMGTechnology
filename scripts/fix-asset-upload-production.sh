#!/usr/bin/env bash
# Stretch Cloud: restore traditional local asset uploads + working admin dashboard.
# IMPORTANT: use build-server-production.sh so Vite dashboard is built LAST
# (vendure build all builds dashboard first; tsc/clean can leave the placeholder UI).
set -euo pipefail

cd /var/www/EMGTechnology

echo "==> Pull latest main"
git fetch origin main
git checkout main
git pull origin main

echo "==> Current commit:"
git log -1 --oneline

echo "==> Verify Cloudinary storage strategy is NOT wired"
if grep -q "storageStrategyFactory" apps/server/src/vendure-config.ts; then
  echo "ERROR: storageStrategyFactory still present — stop and contact developer."
  exit 1
fi
if grep -E '^\s*EmgCloudinaryAssetPlugin' apps/server/src/vendure-config.ts; then
  echo "ERROR: EmgCloudinaryAssetPlugin still active in plugins list."
  exit 1
fi
echo "OK: traditional AssetServerPlugin only"

echo "==> Ensure asset upload directory exists and is writable"
mkdir -p apps/server/static/assets/source apps/server/static/assets/preview apps/server/static/assets/cache
chmod -R u+rwX apps/server/static/assets

echo "==> Tip: if large uploads fail, set nginx client_max_body_size 25m; for the API location and reload nginx"

echo "==> Install + production build (server/worker, then dashboard last)"
npm install
bash scripts/build-server-production.sh

echo "==> Confirm built config has no Cloudinary storage factory"
if grep -q "storageStrategyFactory" apps/server/dist/vendure-config.js 2>/dev/null; then
  echo "ERROR: built vendure-config.js still has storageStrategyFactory"
  exit 1
fi
echo "OK: built config uses default local asset storage"

echo "==> Confirm dashboard files exist"
test -f apps/server/dist/dashboard/index.html
grep -q 'id="app"' apps/server/dist/dashboard/index.html
echo "OK: dashboard index.html is a real build (not placeholder)"

echo "==> Restart PM2"
pm2 restart emg-server emg-worker --update-env
pm2 save
pm2 status

echo ""
echo "Done. Hard-refresh /dashboard (Cmd/Ctrl+Shift+R)."
echo "If placeholder remains: bash scripts/fix-production-dashboard.sh"

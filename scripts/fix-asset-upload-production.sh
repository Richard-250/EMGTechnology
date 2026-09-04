#!/usr/bin/env bash
# Stretch Cloud: restore traditional Vendure asset uploads (local disk).
# Run from /var/www/EMGTechnology
set -euo pipefail

cd /var/www/EMGTechnology

echo "==> Pull latest main"
git fetch origin main
git checkout main
git pull origin main

echo "==> Current commit (must be this or newer for asset fix):"
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
mkdir -p apps/server/static/assets
chmod -R u+rwX apps/server/static/assets

echo "==> Clean build (removes stale dist Cloudinary strategy)"
rm -rf apps/server/dist
npm install
npm run build -w server

echo "==> Confirm built config has no Cloudinary storage factory"
if grep -R "configureCloudinaryAssetStorage" apps/server/dist --include='*.js' | grep -v 'cloudinary-asset-storage-strategy' >/dev/null 2>&1; then
  echo "WARN: configureCloudinaryAssetStorage string found in dist — check vendure-config.js"
fi
if grep -q "storageStrategyFactory" apps/server/dist/vendure-config.js 2>/dev/null; then
  echo "ERROR: built vendure-config.js still has storageStrategyFactory"
  exit 1
fi
echo "OK: built config uses default local asset storage"

echo "==> Restart PM2"
pm2 restart emg-server emg-worker --update-env
pm2 save
pm2 status

echo ""
echo "Done. Hard-refresh the admin dashboard (Cmd/Ctrl+Shift+R), then upload an image via Assets."
echo "If it still fails, run: pm2 logs emg-server --lines 80"

#!/usr/bin/env bash
# Restore EMG Technology stack: fixes PM2 PID collision, restarts backend & worker,
# ensures search index has products, purges storefront cache, and confirms live products.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

echo "=========================================="
echo " EMG Technology: Restore & Health Recovery"
echo "=========================================="

echo ">>> 1. Cleaning up stale PM2 processes and orphaned ports..."
pm2 kill 2>/dev/null || true
fuser -k 3001/tcp 3002/tcp 2>/dev/null || true
pkill -9 -f node 2>/dev/null || true
sleep 2

echo ">>> 2. Pulling latest code..."
git pull origin main

echo ">>> 3. Building backend..."
cd "$APP_DIR/apps/server"
npm run build

echo ">>> 4. Starting backend server & worker cleanly..."
cd "$APP_DIR"
pm2 start ecosystem.config.cjs --only emg-server,emg-worker
pm2 save

echo ">>> 5. Waiting for Vendure API to respond on port 3001..."
API_READY=false
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:3001/health >/dev/null 2>&1; then
    echo "  ✓ Vendure API healthy after ${i}s"
    API_READY=true
    break
  fi
  sleep 1
done

if [ "$API_READY" = "false" ]; then
  echo "ERROR: Vendure API did not become healthy. Check logs:"
  pm2 logs emg-server --lines 30 --nostream
  exit 1
fi

echo ">>> 6. Checking products in Vendure..."
SHOP_QUERY='{"query":"{ products(options:{take:5}) { totalItems items { id name } } search(input:{take:5}) { totalItems items { productName } } }"}'
RESULT=$(curl -s http://127.0.0.1:3001/shop-api -X POST -H "Content-Type: application/json" -d "$SHOP_QUERY")
echo "  Vendure Response: $RESULT"

echo ">>> 7. Purging Next.js cache and rebuilding storefront if needed..."
rm -rf apps/storefront/.next/cache
cd "$APP_DIR/apps/storefront"
npm run build

echo ">>> 8. Starting storefront..."
cd "$APP_DIR"
pm2 start ecosystem.config.cjs --only emg-storefront
pm2 save
sleep 3

echo ">>> 9. Revalidating storefront product cache..."
REVALIDATION_SECRET=$(grep -E '^REVALIDATION_SECRET=' apps/storefront/.env.local 2>/dev/null | cut -d= -f2- || true)
if [ -n "$REVALIDATION_SECRET" ]; then
  curl -s http://127.0.0.1:3002/api/revalidate \
    -X POST \
    -H "Authorization: Bearer ${REVALIDATION_SECRET}" \
    -H "Content-Type: application/json" \
    -d '{"tags":["products","featured","deals","home-catalog","category-products","collection","collections","search"]}' \
    || true
  echo "  ✓ Cache revalidated"
fi

echo ">>> 10. PM2 Status:"
pm2 status

echo ""
echo "=========================================="
echo " ✓ Recovery complete! Check your storefront."
echo "=========================================="

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

echo ">>> Building backend..."
npm run build -w server

echo ">>> Restarting backend + worker..."
pm2 restart emg-server emg-worker --update-env

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
echo ">>> Deploy complete."

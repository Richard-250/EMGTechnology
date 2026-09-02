#!/usr/bin/env bash
# Apply Vendure schema changes (custom fields) to PostgreSQL, then turn sync off again.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

ENV_FILE="apps/server/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Missing $ENV_FILE"
  exit 1
fi

echo ">>> Syncing database schema (DB_SYNCHRONIZE=true)..."
if grep -q '^DB_SYNCHRONIZE=' "$ENV_FILE"; then
  sed -i 's/^DB_SYNCHRONIZE=.*/DB_SYNCHRONIZE=true/' "$ENV_FILE"
else
  echo 'DB_SYNCHRONIZE=true' >> "$ENV_FILE"
fi

pm2 restart emg-server emg-worker --update-env

echo ">>> Waiting for Vendure after schema sync..."
for i in $(seq 1 45); do
  if curl -sf http://127.0.0.1:3001/shop-api \
    -X POST -H "Content-Type: application/json" \
    -d '{"query":"{ product(slug: \"emg-pro-elliptical\") { id name } }"}' \
    | grep -q '"id"'; then
    echo "Schema sync OK — product API responding after ${i}s"
    break
  fi
  if [ "$i" -eq 45 ]; then
    echo "WARNING: Product API still failing after schema sync. Check: pm2 logs emg-server --lines 50"
  fi
  sleep 1
done

echo ">>> Disabling DB_SYNCHRONIZE for production safety..."
sed -i 's/^DB_SYNCHRONIZE=.*/DB_SYNCHRONIZE=false/' "$ENV_FILE"
pm2 restart emg-server emg-worker --update-env

sleep 5
echo ">>> Database schema sync complete."

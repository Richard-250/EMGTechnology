#!/usr/bin/env bash
# One-shot production deploy for Google Sign-In on Stretch Cloud.
# Set credentials in the environment BEFORE running, or export them inline.
# Never commit real secrets into this file.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

: "${GOOGLE_CLIENT_ID:?Set GOOGLE_CLIENT_ID before running}"
: "${NEXT_PUBLIC_GOOGLE_CLIENT_ID:=$GOOGLE_CLIENT_ID}"
: "${GOOGLE_CLIENT_SECRET:=}"
: "${CLOUDINARY_CLOUD_NAME:=}"
: "${CLOUDINARY_API_KEY:=}"
: "${CLOUDINARY_API_SECRET:=}"
: "${NEXT_PUBLIC_SITE_URL:=https://emgtechnologyltd.com}"

echo ">>> Pulling latest code..."
git pull origin main

echo ">>> Writing apps/server/.env credentials..."
SERVER_ENV="$APP_DIR/apps/server/.env"
touch "$SERVER_ENV"

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  [ -n "$value" ] || return 0
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

upsert_env "$SERVER_ENV" "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
upsert_env "$SERVER_ENV" "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
upsert_env "$SERVER_ENV" "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
upsert_env "$SERVER_ENV" "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
upsert_env "$SERVER_ENV" "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"

echo ">>> Writing apps/storefront/.env.local (public Google Client ID)..."
STORE_ENV="$APP_DIR/apps/storefront/.env.local"
touch "$STORE_ENV"
upsert_env "$STORE_ENV" "NEXT_PUBLIC_GOOGLE_CLIENT_ID" "$NEXT_PUBLIC_GOOGLE_CLIENT_ID"
upsert_env "$STORE_ENV" "NEXT_PUBLIC_SITE_URL" "$NEXT_PUBLIC_SITE_URL"

echo ">>> Installing dependencies..."
npm install

echo ">>> Building Vendure server..."
npm run build -w server

echo ">>> Building storefront (required so NEXT_PUBLIC_GOOGLE_CLIENT_ID is baked in)..."
cd "$APP_DIR/apps/storefront"
npm run build
cd "$APP_DIR"

echo ">>> Restarting PM2 with updated env..."
pm2 restart emg-server emg-worker emg-storefront --update-env
pm2 save

echo ">>> Waiting for API..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3001/shop-api -H 'Content-Type: application/json' -d '{"query":"{ __typename }"}' >/dev/null 2>&1; then
    echo "API ready after ${i}s"
    break
  fi
  sleep 1
done

echo ""
echo ">>> Deploy complete."
echo "Test: https://emgtechnologyltd.com/en/sign-in"
echo "Google Console Authorized JavaScript origin must include: https://emgtechnologyltd.com"
pm2 status

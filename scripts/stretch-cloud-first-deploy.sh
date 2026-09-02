#!/usr/bin/env bash
# First-time or full production setup on Stretch Cloud console.
# Run as root from /var/www/EMGTechnology after cloning the repo.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

echo ""
echo "=========================================="
echo " EMG Technology — Stretch Cloud setup"
echo "=========================================="
echo ""

# ── Step 0: Prerequisites ────────────────────────────────────────────────────
echo "Step 0: Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js not installed"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "ERROR: npm not installed"; exit 1; }
command -v pm2  >/dev/null 2>&1 || { echo "Installing pm2..."; npm install -g pm2; }
command -v git >/dev/null 2>&1 || { echo "ERROR: git not installed"; exit 1; }
echo "  Node: $(node -v)"
echo "  npm:  $(npm -v)"
echo ""

# ── Step 1: Environment files ────────────────────────────────────────────────
echo "Step 1: Environment files"
if [ ! -f apps/server/.env ]; then
  echo "  Creating apps/server/.env from example..."
  cp apps/server/.env.example apps/server/.env
  echo "  !! EDIT apps/server/.env now — set DB password, COOKIE_SECRET, SUPERADMIN_PASSWORD"
  echo "     Set DB_SYNCHRONIZE=true for first run, then sync script sets it back to false."
fi

if [ ! -f apps/storefront/.env.local ]; then
  echo "  Creating apps/storefront/.env.local..."
  cat > apps/storefront/.env.local <<'EOF'
NEXT_PUBLIC_SITE_URL=https://emgtechnologyltd.com
VENDURE_SHOP_API_URL=http://127.0.0.1:3001/shop-api
NEXT_PUBLIC_VENDURE_SHOP_API_URL=https://emgtechnologyltd.com/shop-api
REVALIDATION_SECRET=CHANGE-ME-same-as-server-env
NEXT_PUBLIC_SITE_NAME=EMG Technology Ltd
EOF
  echo "  !! EDIT apps/storefront/.env.local — set REVALIDATION_SECRET (same as server .env)"
fi
echo ""

# ── Step 2: Install & build ──────────────────────────────────────────────────
echo "Step 2: Installing dependencies..."
npm install
echo ""

echo "Step 3: Building server + admin dashboard..."
rm -rf apps/server/dist/dashboard
npm run build -w server
echo ""

echo "Step 4: Building storefront..."
rm -rf apps/storefront/.next
npm run build -w storefront
echo ""

# ── Step 3: Start PM2 ────────────────────────────────────────────────────────
echo "Step 5: Starting PM2 processes..."
pm2 delete emg-server emg-worker emg-storefront 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
echo ""

# ── Step 4: Database schema ───────────────────────────────────────────────────
echo "Step 6: Syncing database schema..."
bash scripts/sync-database-schema.sh
echo ""

# ── Step 5: Verify ───────────────────────────────────────────────────────────
echo "Step 7: Running health check..."
bash scripts/verify-production.sh

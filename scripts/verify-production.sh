#!/usr/bin/env bash
# Verify EMG Technology production stack (run on Stretch Cloud / production server).
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

PASS=0
FAIL=0
WARN=0

ok()   { echo "  ✓ $1"; PASS=$((PASS + 1)); }
bad()  { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  ! $1"; WARN=$((WARN + 1)); }

echo ""
echo "========================================"
echo " EMG Technology — production health check"
echo "========================================"
echo ""

# ── 1. PM2 processes ─────────────────────────────────────────────────────────
echo "1. PM2 processes"
if command -v pm2 >/dev/null 2>&1; then
  for name in emg-server emg-worker emg-storefront; do
    if pm2 describe "$name" >/dev/null 2>&1; then
      status=$(pm2 describe "$name" 2>/dev/null | grep -E '│ status' | head -1 | awk '{print $4}' || echo "unknown")
      if [ "$status" = "online" ]; then
        ok "$name is online"
      else
        bad "$name status: $status (run: pm2 restart $name --update-env)"
      fi
    else
      bad "$name not registered (run: pm2 start ecosystem.config.cjs && pm2 save)"
    fi
  done
else
  bad "pm2 not installed"
fi
echo ""

# ── 2. Environment files ─────────────────────────────────────────────────────
echo "2. Environment files"
if [ -f apps/server/.env ]; then
  ok "apps/server/.env exists"
  grep -q '^DB_SYNCHRONIZE=false' apps/server/.env && ok "DB_SYNCHRONIZE=false (production safe)" || warn "DB_SYNCHRONIZE is not false — set to false after schema sync"
  grep -qE '^STOREFRONT_URL=' apps/server/.env && ok "STOREFRONT_URL set" || warn "STOREFRONT_URL missing in apps/server/.env"
else
  bad "apps/server/.env missing — copy from apps/server/.env.example"
fi

if [ -f apps/storefront/.env.local ]; then
  ok "apps/storefront/.env.local exists"
  grep -qE '^VENDURE_SHOP_API_URL=' apps/storefront/.env.local && ok "VENDURE_SHOP_API_URL set" || bad "VENDURE_SHOP_API_URL missing in apps/storefront/.env.local"
  grep -qE '^NEXT_PUBLIC_SITE_URL=' apps/storefront/.env.local && ok "NEXT_PUBLIC_SITE_URL set" || warn "NEXT_PUBLIC_SITE_URL missing"
  grep -qE '^REVALIDATION_SECRET=' apps/storefront/.env.local && ok "REVALIDATION_SECRET set" || warn "REVALIDATION_SECRET missing (cache won't refresh after admin edits)"
else
  bad "apps/storefront/.env.local missing — create it on the SERVER (not your laptop)"
fi
echo ""

# ── 3. Vendure API server ────────────────────────────────────────────────────
echo "3. Vendure API server (port 3001)"
if curl -sf http://127.0.0.1:3001/health >/dev/null 2>&1; then
  ok "Health endpoint responds"
else
  bad "API not responding on :3001 (run: pm2 logs emg-server --lines 30)"
fi

SHOP_RESULT=$(curl -sf http://127.0.0.1:3001/shop-api \
  -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ activeChannel { id code } products(options:{take:1}) { items { name } } }"}' 2>/dev/null || echo "FAIL")

if echo "$SHOP_RESULT" | grep -q '"activeChannel"'; then
  ok "Shop API returns data"
else
  bad "Shop API failed — check DB connection in apps/server/.env"
fi

if echo "$SHOP_RESULT" | grep -q '"items"'; then
  ok "Products query works"
else
  warn "No products returned (run: npm run db:seed -w server if database is empty)"
fi
echo ""

# ── 4. Admin dashboard ───────────────────────────────────────────────────────
echo "4. Admin dashboard (/dashboard)"
DASHBOARD_INDEX="apps/server/dist/dashboard/index.html"
if [ -f "$DASHBOARD_INDEX" ]; then
  DASHBOARD_JS=$(grep -o 'assets/index-[^"]*\.js' "$DASHBOARD_INDEX" | head -1 || true)
  if [ -n "$DASHBOARD_JS" ] && [ -f "apps/server/dist/dashboard/${DASHBOARD_JS}" ]; then
    ok "Dashboard built on disk ($DASHBOARD_JS)"
  else
    bad "Dashboard index.html references missing JS — run: bash scripts/fix-production-dashboard.sh"
  fi
else
  bad "Dashboard not built — run: bash scripts/fix-production-dashboard.sh"
fi

DASHBOARD_STATUS=$(curl -sf http://127.0.0.1:3001/dashboard/__status 2>/dev/null || echo "{}")
if echo "$DASHBOARD_STATUS" | grep -q '"hasBuiltFiles":true'; then
  ok "Server is serving built dashboard (login page should appear)"
elif echo "$DASHBOARD_STATUS" | grep -q '"mode":"default"'; then
  bad "Dashboard showing placeholder page — run: bash scripts/fix-production-dashboard.sh"
else
  bad "Dashboard status check failed — is emg-server running?"
fi
echo ""

# ── 5. Checkout prerequisites ────────────────────────────────────────────────
echo "5. Checkout prerequisites"
PAYMENT_RESULT=$(curl -sf http://127.0.0.1:3001/shop-api \
  -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ eligiblePaymentMethods { code name isEligible } }"}' 2>/dev/null || echo "FAIL")

if echo "$PAYMENT_RESULT" | grep -q '"card"'; then
  ok "Card payment method configured"
else
  warn "Card payment method missing — restart server after deploy (configurePaymentMethods runs on boot)"
fi

if echo "$PAYMENT_RESULT" | grep -q 'mtn-rwanda'; then
  ok "MTN Mobile Money configured"
else
  warn "MTN payment method missing — restart emg-server"
fi

ORDER_CF_RESULT=$(curl -sf http://127.0.0.1:3001/shop-api \
  -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ product(slug: \"emg-pro-elliptical\") { customFields { isDiscounted discountType } } }"}' 2>/dev/null || echo "FAIL")

if echo "$ORDER_CF_RESULT" | grep -q 'customFields'; then
  ok "Product custom fields in database"
else
  bad "Product custom fields missing — run: bash scripts/sync-database-schema.sh"
fi
echo ""

# ── 6. Storefront ──────────────────────────────────────────────────────────────
echo "6. Storefront (port 3002)"
if curl -sf http://127.0.0.1:3002/en >/dev/null 2>&1; then
  ok "Storefront homepage responds"
else
  bad "Storefront not responding on :3002 (run: pm2 logs emg-storefront --lines 30)"
fi

if curl -sf http://127.0.0.1:3002/en/cart >/dev/null 2>&1; then
  ok "Cart page responds"
else
  warn "Cart page failed"
fi

if curl -sf http://127.0.0.1:3002/en/checkout >/dev/null 2>&1; then
  ok "Checkout route responds (may redirect to sign-in if not logged in — that is normal)"
else
  bad "Checkout route failed"
fi
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo "========================================"
echo " Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "========================================"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "All critical checks passed."
  echo ""
  echo "Public URLs:"
  echo "  Storefront:  https://emgtechnologyltd.com"
  echo "  Dashboard:   https://emgtechnologyltd.com/dashboard"
  echo "  Login:       superadmin / (your SUPERADMIN_PASSWORD in apps/server/.env)"
  echo ""
  echo "Checkout flow: sign in → add to cart → /cart → Proceed to Checkout"
  exit 0
else
  echo "Fix the failed items above, then re-run:"
  echo "  bash scripts/verify-production.sh"
  echo ""
  echo "Quick fix for dashboard placeholder:"
  echo "  bash scripts/fix-production-dashboard.sh"
  echo ""
  echo "Full redeploy:"
  echo "  bash scripts/redeploy-production.sh"
  exit 1
fi

#!/usr/bin/env bash
# Diagnose dashboard white-screen issues on production.
set -euo pipefail

BASE="${1:-https://emgtechnologyltd.com}"

echo "Dashboard diagnostics for: $BASE"
echo ""

HTML=$(curl -sf "$BASE/dashboard/")
JS=$(echo "$HTML" | grep -o 'assets/index-[^"]*\.js' | head -1)
CSS=$(echo "$HTML" | grep -o 'assets/index-[^"]*\.css' | head -1)

echo "index.html JS:  ${JS:-MISSING}"
echo "index.html CSS: ${CSS:-MISSING}"
echo ""

check_url() {
  local url="$1"
  local label="$2"
  local code type
  code=$(curl -sI "$url" | head -1)
  type=$(curl -sI "$url" | grep -i "^content-type:" | head -1 || true)
  echo "  $label"
  echo "    $code"
  echo "    $type"
}

if [ -n "$JS" ]; then
  check_url "$BASE/dashboard/$JS" "Main JS bundle"
fi
if [ -n "$CSS" ]; then
  check_url "$BASE/dashboard/$CSS" "Main CSS bundle"
fi

check_url "$BASE/admin-api" "Admin API (POST check below)"
API=$(curl -sf "$BASE/admin-api" -H "Content-Type: application/json" -d '{"query":"{ __typename }"}' || echo FAIL)
echo "  Admin API body: $API"
echo ""

echo "Local server status (if on production box):"
curl -sf http://127.0.0.1:3001/dashboard/__status 2>/dev/null || echo "  (not reachable from this host)"
echo ""
echo "If JS/CSS are 200 but page is white:"
echo "  1. Hard refresh: Ctrl+Shift+R (or try Incognito)"
echo "  2. Rebuild dashboard: bash scripts/fix-production-dashboard.sh"
echo "  3. Open browser DevTools → Console tab and check for red errors"

#!/usr/bin/env bash
# Build Vendure server + worker, then dashboard last (dashboard must not be overwritten).
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/EMGTechnology}"
cd "$APP_DIR"

echo ">>> Building Vendure server (TypeScript)..."
npm run build:server -w server

echo ">>> Building Vendure worker (TypeScript)..."
npm run build:worker -w server

echo ">>> Building admin dashboard (Vite — must run last)..."
rm -rf apps/server/dist/dashboard
npm run build:dashboard -w server

if [ ! -f apps/server/dist/dashboard/index.html ]; then
  echo "ERROR: apps/server/dist/dashboard/index.html was not created."
  echo "Searching for dashboard output elsewhere..."
  find . -path './node_modules' -prune -o -path '*/dist/dashboard/index.html' -print 2>/dev/null || true
  exit 1
fi

DASHBOARD_JS=$(grep -o 'assets/index-[^"]*\.js' apps/server/dist/dashboard/index.html | head -1 || true)
if [ -z "$DASHBOARD_JS" ] || [ ! -f "apps/server/dist/dashboard/${DASHBOARD_JS}" ]; then
  echo "ERROR: Dashboard index.html exists but JS bundle is missing: ${DASHBOARD_JS:-"(not found)"}"
  ls -la apps/server/dist/dashboard/ 2>/dev/null | head -10 || true
  exit 1
fi

echo "Dashboard build OK: ${DASHBOARD_JS}"
echo "Files on disk:"
ls -la apps/server/dist/dashboard/index.html
ls -la "apps/server/dist/dashboard/${DASHBOARD_JS}"

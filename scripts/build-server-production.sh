#!/usr/bin/env bash
# Build Vendure server + worker, then dashboard last (run vite from apps/server).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
SERVER_DIR="$APP_DIR/apps/server"
DASHBOARD_INDEX="$SERVER_DIR/dist/dashboard/index.html"

cd "$APP_DIR"

echo ">>> Building Vendure server (TypeScript)..."
npm run build:server -w server

echo ">>> Building Vendure worker (TypeScript)..."
npm run build:worker -w server

echo ">>> Building admin dashboard (Vite from apps/server)..."
rm -rf "$SERVER_DIR/dist/dashboard"
mkdir -p "$SERVER_DIR/dist"

cd "$SERVER_DIR"
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=4096"

# Run vite directly so output always lands in apps/server/dist/dashboard
npx vite build --config vite.config.mts --logLevel info

if [ ! -f "$DASHBOARD_INDEX" ]; then
  echo "ERROR: Expected dashboard at $DASHBOARD_INDEX"
  echo "Node: $(node -v) | cwd: $(pwd)"
  echo "Searching for dashboard output..."
  find "$APP_DIR" \( -path '*/node_modules/*' -o -path '*/.git/*' \) -prune -o -name index.html -path '*/dashboard/*' -print 2>/dev/null || true
  echo "dist contents:"
  ls -la "$SERVER_DIR/dist" 2>/dev/null || true
  exit 1
fi

DASHBOARD_JS=$(grep -o 'assets/index-[^"]*\.js' "$DASHBOARD_INDEX" | head -1 || true)
if [ -z "$DASHBOARD_JS" ] || [ ! -f "$SERVER_DIR/dist/dashboard/${DASHBOARD_JS}" ]; then
  echo "ERROR: Dashboard index.html exists but JS bundle is missing."
  ls -la "$SERVER_DIR/dist/dashboard/" | head -15
  exit 1
fi

echo "Dashboard build OK: $DASHBOARD_JS"
ls -la "$DASHBOARD_INDEX"
ls -la "$SERVER_DIR/dist/dashboard/${DASHBOARD_JS}"

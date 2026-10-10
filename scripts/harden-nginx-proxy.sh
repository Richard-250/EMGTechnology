#!/usr/bin/env bash
# Tighten nginx → Next.js timeouts so hung storefronts fail fast and recover via watchdog.
set -euo pipefail

CONF="${1:-/etc/nginx/sites-available/emgtechnology}"
if [ ! -f "$CONF" ]; then
  echo "Nginx site config not found: $CONF"
  echo "List configs with: ls /etc/nginx/sites-enabled"
  echo "Then: bash scripts/harden-nginx-proxy.sh /etc/nginx/sites-enabled/YOUR_FILE"
  exit 1
fi

if grep -q 'proxy_connect_timeout' "$CONF"; then
  echo "Timeouts already present in $CONF"
else
  sudo python3 - "$CONF" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
old = """        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;"""
new = """        proxy_pass http://127.0.0.1:3002;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_http_version 1.1;"""
if old not in text:
    # looser match
    needle = "proxy_pass http://127.0.0.1:3002;"
    if needle not in text:
        sys.exit(f"Could not find storefront proxy_pass in {path}")
    text = text.replace(
        needle,
        needle + "\n        proxy_connect_timeout 5s;\n        proxy_send_timeout 60s;\n        proxy_read_timeout 60s;",
        1,
    )
    path.write_text(text)
    print("Patched storefront proxy timeouts (loose match)")
else:
    path.write_text(text.replace(old, new, 1))
    print("Patched storefront proxy timeouts")
PY
fi

sudo nginx -t
sudo systemctl reload nginx
echo "nginx reloaded"

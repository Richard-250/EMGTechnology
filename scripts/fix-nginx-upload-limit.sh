#!/usr/bin/env bash
# Fix HTTP 413 on admin image uploads by raising nginx client_max_body_size.
# Run on Stretch Cloud as root (or with sudo).
#
# NEVER put client_max_body_size at the top level of nginx.conf (outside http/server/location).
# Prefer site configs under sites-enabled / conf.d.
set -euo pipefail

BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-50m}"
MARKER="# EMG Technology asset upload limit"

echo "==> Setting nginx client_max_body_size to ${BODY_SIZE}"

CONF=""
for candidate in \
  /etc/nginx/sites-enabled/emgtechnologyltd.com \
  /etc/nginx/sites-available/emgtechnologyltd.com \
  /etc/nginx/sites-enabled/default \
  /etc/nginx/conf.d/emg.conf
do
  if [ -f "$candidate" ]; then
    CONF="$candidate"
    break
  fi
done

if [ -z "$CONF" ]; then
  echo "No site config found. Refusing to edit /etc/nginx/nginx.conf automatically."
  echo "Add this inside your site server { } block (or inside http { }):"
  echo "  client_max_body_size ${BODY_SIZE};"
  echo "Then: nginx -t && systemctl reload nginx"
  exit 1
fi

echo "Using config: $CONF"
cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"

if grep -q "client_max_body_size" "$CONF"; then
  sed -i -E "s/client_max_body_size[[:space:]]+[^;]+;/client_max_body_size ${BODY_SIZE};/g" "$CONF"
  echo "Updated existing client_max_body_size directive(s)."
else
  if ! grep -q "server {" "$CONF"; then
    echo "No server { } block found in $CONF — add manually:"
    echo "  client_max_body_size ${BODY_SIZE};"
    exit 1
  fi
  awk -v size="$BODY_SIZE" -v marker="$MARKER" '
    BEGIN { done=0 }
    {
      print
      if (!done && $0 ~ /server[[:space:]]*\{/) {
        print "    " marker
        print "    client_max_body_size " size ";"
        done=1
      }
    }
  ' "$CONF" > "${CONF}.tmp" && mv "${CONF}.tmp" "$CONF"
  echo "Inserted client_max_body_size ${BODY_SIZE};"
fi

if ! nginx -t; then
  echo "ERROR: nginx config test failed — restoring backup if present."
  exit 1
fi

systemctl reload nginx || systemctl start nginx
echo "OK: nginx running with client_max_body_size ${BODY_SIZE}"
echo "Retry Upload in the admin dashboard."

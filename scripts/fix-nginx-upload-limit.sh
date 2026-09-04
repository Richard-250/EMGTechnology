#!/usr/bin/env bash
# Fix HTTP 413 on admin image uploads by raising nginx client_max_body_size.
# Run on Stretch Cloud as root (or with sudo).
set -euo pipefail

BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-50m}"
MARKER="# EMG Technology asset upload limit"

echo "==> Setting nginx client_max_body_size to ${BODY_SIZE}"

CONF=""
for candidate in \
  /etc/nginx/sites-enabled/emgtechnologyltd.com \
  /etc/nginx/sites-enabled/default \
  /etc/nginx/conf.d/emg.conf \
  /etc/nginx/nginx.conf
do
  if [ -f "$candidate" ]; then
    CONF="$candidate"
    break
  fi
done

if [ -z "$CONF" ]; then
  echo "Could not find nginx site config. Add this inside the server { } block:"
  echo "  client_max_body_size ${BODY_SIZE};"
  exit 1
fi

echo "Using config: $CONF"
cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"

if grep -q "client_max_body_size" "$CONF"; then
  # Update existing directives (site-level)
  sed -i -E "s/client_max_body_size[[:space:]]+[^;]+;/client_max_body_size ${BODY_SIZE};/g" "$CONF"
  echo "Updated existing client_max_body_size directive(s)."
else
  # Insert after first server { opening
  if grep -q "server {" "$CONF"; then
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
  else
    echo "No server { } block found in $CONF — add manually:"
    echo "  client_max_body_size ${BODY_SIZE};"
    exit 1
  fi
fi

nginx -t
systemctl reload nginx
echo "OK: nginx reloaded with client_max_body_size ${BODY_SIZE}"
echo "Retry Upload in the admin dashboard."

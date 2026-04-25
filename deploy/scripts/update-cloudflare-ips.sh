#!/bin/bash
# Update Cloudflare IP ranges for Nginx
# Run via cron: 0 3 * * 0 /path/to/update-cloudflare-ips.sh

set -euo pipefail

CONF="/etc/nginx/snippets/cloudflare-ips.conf"
TMP=$(mktemp)

echo "# Cloudflare IPs — auto-updated $(date -I)" > "$TMP"
echo "# Source: https://www.cloudflare.com/ips/" >> "$TMP"
echo "" >> "$TMP"

echo "# IPv4" >> "$TMP"
for ip in $(curl -sf https://www.cloudflare.com/ips-v4/); do
    echo "set_real_ip_from $ip;" >> "$TMP"
done

echo "" >> "$TMP"
echo "# IPv6" >> "$TMP"
for ip in $(curl -sf https://www.cloudflare.com/ips-v6/); do
    echo "set_real_ip_from $ip;" >> "$TMP"
done

echo "" >> "$TMP"
echo "# Allow Cloudflare IPs" >> "$TMP"
for ip in $(curl -sf https://www.cloudflare.com/ips-v4/) $(curl -sf https://www.cloudflare.com/ips-v6/); do
    echo "allow $ip;" >> "$TMP"
done

# Validate nginx config before applying
cp "$CONF" "${CONF}.bak"
mv "$TMP" "$CONF"

if nginx -t 2>/dev/null; then
    nginx -s reload
    echo "Cloudflare IPs updated and Nginx reloaded."
else
    echo "Nginx config test failed! Rolling back."
    mv "${CONF}.bak" "$CONF"
    exit 1
fi

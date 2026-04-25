#!/bin/bash
# Update Cloudflare IP ranges for Nginx
# Run via cron: 0 3 * * 0 /path/to/update-cloudflare-ips.sh

set -euo pipefail

REALIP_CONF="/etc/nginx/snippets/cloudflare-ips.conf"
GEO_CONF="/etc/nginx/conf.d/cloudflare-realip-geo.conf"
TMP_REALIP=$(mktemp)
TMP_GEO=$(mktemp)

IPV4=$(curl -sf https://www.cloudflare.com/ips-v4/)
IPV6=$(curl -sf https://www.cloudflare.com/ips-v6/)

# --- cloudflare-ips.conf (set_real_ip_from only) ---
{
    echo "# Cloudflare IPs — auto-updated $(date -I)"
    echo "# Source: https://www.cloudflare.com/ips/"
    echo ""
    echo "# IPv4"
    for ip in $IPV4; do echo "set_real_ip_from $ip;"; done
    echo ""
    echo "# IPv6"
    for ip in $IPV6; do echo "set_real_ip_from $ip;"; done
} > "$TMP_REALIP"

# --- cloudflare-realip-geo.conf (geo block for access control) ---
{
    echo "# Cloudflare IP access control — auto-updated $(date -I)"
    echo "# Uses \$realip_remote_addr (original socket IP before real_ip rewrite)"
    echo ""
    echo "geo \$realip_remote_addr \$is_cloudflare {"
    echo "    default 0;"
    echo ""
    echo "    # IPv4"
    for ip in $IPV4; do printf "    %-20s 1;\n" "$ip"; done
    echo ""
    echo "    # IPv6"
    for ip in $IPV6; do printf "    %-20s 1;\n" "$ip"; done
    echo "}"
} > "$TMP_GEO"

# Backup and apply
cp "$REALIP_CONF" "${REALIP_CONF}.bak"
cp "$GEO_CONF" "${GEO_CONF}.bak"
mv "$TMP_REALIP" "$REALIP_CONF"
mv "$TMP_GEO" "$GEO_CONF"

if nginx -t 2>/dev/null; then
    nginx -s reload
    echo "Cloudflare IPs updated and Nginx reloaded."
else
    echo "Nginx config test failed! Rolling back."
    mv "${REALIP_CONF}.bak" "$REALIP_CONF"
    mv "${GEO_CONF}.bak" "$GEO_CONF"
    exit 1
fi

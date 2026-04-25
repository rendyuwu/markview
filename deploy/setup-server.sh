#!/bin/bash
# Initial server setup for MarkView
# Run on fresh Ubuntu/Alma VM as root
# Usage: curl -sL <raw-url> | bash  OR  bash setup-server.sh

set -euo pipefail

log() { echo "[setup] $1"; }

# Detect package manager
if command -v apt-get >/dev/null 2>&1; then
    PKG="apt"
elif command -v dnf >/dev/null 2>&1; then
    PKG="dnf"
else
    echo "Unsupported package manager. Need apt or dnf."
    exit 1
fi

log "Detected package manager: $PKG"

# Update system
log "Updating system..."
if [[ "$PKG" == "apt" ]]; then
    apt-get update && apt-get upgrade -y
else
    dnf update -y
fi

# Install Docker
log "Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

# Install Nginx
log "Installing Nginx..."
if [[ "$PKG" == "apt" ]]; then
    apt-get install -y nginx
else
    dnf install -y nginx
fi
systemctl enable --now nginx

# Install UFW (Ubuntu) or firewalld (Alma/RHEL)
log "Configuring firewall..."
if [[ "$PKG" == "apt" ]]; then
    apt-get install -y ufw
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
else
    systemctl enable --now firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# Install fail2ban
log "Installing fail2ban..."
if [[ "$PKG" == "apt" ]]; then
    apt-get install -y fail2ban
else
    dnf install -y fail2ban
fi
systemctl enable --now fail2ban

# Enable unattended upgrades
log "Enabling automatic security updates..."
if [[ "$PKG" == "apt" ]]; then
    apt-get install -y unattended-upgrades
    dpkg-reconfigure -plow unattended-upgrades
else
    dnf install -y dnf-automatic
    systemctl enable --now dnf-automatic-install.timer
fi

# Create nginx snippet directories
mkdir -p /etc/nginx/snippets
mkdir -p /etc/ssl/cloudflare

# Create deploy user
log "Creating deploy user..."
if ! id -u deploy >/dev/null 2>&1; then
    useradd -m -s /bin/bash -G docker deploy
    log "User 'deploy' created. Set up SSH keys for this user."
fi

log ""
log "=== Server setup complete ==="
log ""
log "Next steps:"
log "  1. Clone repo as 'deploy' user"
log "  2. Copy .env.production.example to .env.production and fill values"
log "  3. Run: ./deploy/scripts/deploy.sh --first-run"
log "  4. Set up Nginx configs (deploy script will guide you)"
log "  5. Add cron jobs:"
log "     0 2 * * * /home/deploy/markview/deploy/scripts/backup-db.sh"
log "     0 3 * * 0 /home/deploy/markview/deploy/scripts/update-cloudflare-ips.sh"

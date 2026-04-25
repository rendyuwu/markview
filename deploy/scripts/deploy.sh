#!/bin/bash
# Deploy MarkView to production server
# Usage: ./deploy.sh [--first-run]

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$APP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1" >&2; exit 1; }

# Pre-flight checks
[[ -f .env.production ]] || err ".env.production not found. Copy .env.production.example and fill in values."
command -v docker >/dev/null || err "Docker not installed."
command -v docker compose >/dev/null 2>&1 || err "Docker Compose not installed."

# Load env for DOMAIN variable
set -a
source .env.production
set +a
[[ -n "${DOMAIN:-}" ]] || err "DOMAIN not set in .env.production"

# Render Nginx config from template
render_nginx() {
    log "Rendering Nginx config for domain: $DOMAIN"
    envsubst '${DOMAIN}' < deploy/nginx/markview.conf.template > deploy/nginx/markview.conf
}

if [[ "${1:-}" == "--first-run" ]]; then
    log "First run setup..."

    # Render Nginx config
    render_nginx

    # Build and start
    docker compose -f docker-compose.prod.yml up -d --build

    # Run migrations
    log "Running Prisma migrations..."
    docker compose -f docker-compose.prod.yml run --rm migrate

    log "First run complete!"
    log "Next steps:"
    log "  1. sudo cp deploy/nginx/markview.conf /etc/nginx/sites-available/"
    log "  2. sudo cp deploy/nginx/proxy-params.conf /etc/nginx/snippets/"
    log "  3. sudo cp deploy/nginx/cloudflare-ips.conf /etc/nginx/snippets/"
    log "  4. sudo ln -s /etc/nginx/sites-available/markview.conf /etc/nginx/sites-enabled/"
    log "  5. Place Cloudflare origin cert at /etc/ssl/cloudflare/${DOMAIN}.pem and .key"
    log "  6. sudo nginx -t && sudo systemctl reload nginx"
    log "  7. Set ENABLE_REGISTER=true, create account, then set back to false"
else
    log "Pulling latest code..."
    git pull --ff-only

    # Re-render Nginx config in case domain changed
    render_nginx

    log "Building and restarting..."
    docker compose -f docker-compose.prod.yml up -d --build

    # Run any new migrations
    log "Running migrations..."
    docker compose -f docker-compose.prod.yml run --rm migrate

    log "Deploy complete!"
    log "If Nginx config changed: sudo cp deploy/nginx/markview.conf /etc/nginx/sites-available/ && sudo nginx -t && sudo systemctl reload nginx"
fi

# Show status
docker compose -f docker-compose.prod.yml ps

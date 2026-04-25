#!/bin/bash
# Backup PostgreSQL database
# Cron: 0 2 * * * /path/to/backup-db.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/markview}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/markview_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump and compress
docker compose -f "$(dirname "$0")/../../docker-compose.prod.yml" \
    exec -T db pg_dump -U "${POSTGRES_USER:-markview}" markview \
    | gzip > "$BACKUP_FILE"

# Prune old backups
find "$BACKUP_DIR" -name "markview_*.sql.gz" -mtime +"$KEEP_DAYS" -delete

echo "Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

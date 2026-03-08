#!/bin/bash
# ============================================================
# ILMI — Automated PostgreSQL Backup Script
# ============================================================
# Usage:
#   ./scripts/backup-db.sh              # Manual backup
#   Add to crontab for daily backups:
#   0 2 * * * /opt/ilmi/scripts/backup-db.sh >> /var/log/ilmi-backup.log 2>&1
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/opt/ilmi/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-db}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/ilmi/docker-compose.yml}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ilmi_backup_${TIMESTAMP}.sql.gz"

# ── Create backup directory ─────────────────────────────────
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

# ── Dump and compress ────────────────────────────────────────
docker compose -f "${COMPOSE_FILE}" exec -T "${DB_CONTAINER}" \
  pg_dump -U "${DB_USER:-ilmi_user}" -d "${DB_NAME:-ilmi_db}" \
  --no-owner --no-privileges \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ── Remove old backups ───────────────────────────────────────
DELETED=$(find "${BACKUP_DIR}" -name "ilmi_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "${DELETED}" -gt 0 ]; then
  echo "[$(date)] Cleaned up ${DELETED} old backup(s) (>${RETENTION_DAYS} days)"
fi

echo "[$(date)] Backup complete."

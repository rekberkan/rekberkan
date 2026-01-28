#!/bin/bash
# ============================================================================
# KAHADE - DATABASE BACKUP SCRIPT
# Automated backup for PostgreSQL database
# ============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Database configuration (from environment)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-kahade}"
DB_USER="${DB_USER:-kahade}"
PGPASSWORD="${DB_PASSWORD:-}"
export PGPASSWORD

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kahade_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    log "ERROR: $1"
    send_notification "error" "$1"
    exit 1
}

send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "${SLACK_WEBHOOK}" ]]; then
        local color="good"
        [[ "$status" == "error" ]] && color="danger"
        [[ "$status" == "warning" ]] && color="warning"
        
        curl -s -X POST "${SLACK_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"title\": \"Kahade Database Backup\",
                    \"text\": \"${message}\",
                    \"ts\": $(date +%s)
                }]
            }" > /dev/null
    fi
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log "Starting database backup..."

# Perform backup
log "Creating backup: ${BACKUP_FILE}"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --verbose \
    2>&1 | gzip > "${BACKUP_PATH}" || error "pg_dump failed"

# Verify backup
if [[ ! -f "${BACKUP_PATH}" ]] || [[ ! -s "${BACKUP_PATH}" ]]; then
    error "Backup file is empty or missing"
fi

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
log "Backup created successfully: ${BACKUP_SIZE}"

# Encrypt backup if key is provided
if [[ -n "${ENCRYPTION_KEY}" ]]; then
    log "Encrypting backup..."
    ENCRYPTED_FILE="${BACKUP_PATH}.enc"
    openssl enc -aes-256-cbc -salt -pbkdf2 \
        -in "${BACKUP_PATH}" \
        -out "${ENCRYPTED_FILE}" \
        -pass pass:"${ENCRYPTION_KEY}" || error "Encryption failed"
    
    rm "${BACKUP_PATH}"
    BACKUP_PATH="${ENCRYPTED_FILE}"
    BACKUP_FILE="${BACKUP_FILE}.enc"
    log "Backup encrypted successfully"
fi

# Upload to S3 if configured
if [[ -n "${S3_BUCKET}" ]]; then
    log "Uploading to S3: s3://${S3_BUCKET}/backups/${BACKUP_FILE}"
    aws s3 cp "${BACKUP_PATH}" "s3://${S3_BUCKET}/backups/${BACKUP_FILE}" \
        --storage-class STANDARD_IA \
        --only-show-errors || error "S3 upload failed"
    log "S3 upload completed"
fi

# Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "kahade_backup_*.sql.gz*" -mtime +${RETENTION_DAYS} -delete
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "kahade_backup_*.sql.gz*" -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l)
log "Deleted ${DELETED_COUNT} old backup(s)"

# Cleanup old S3 backups
if [[ -n "${S3_BUCKET}" ]]; then
    log "Cleaning up old S3 backups..."
    CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)
    aws s3 ls "s3://${S3_BUCKET}/backups/" | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        if [[ "${FILE_DATE}" < "${CUTOFF_DATE}" ]]; then
            aws s3 rm "s3://${S3_BUCKET}/backups/${FILE_NAME}" --only-show-errors
        fi
    done
fi

# Summary
TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "kahade_backup_*.sql.gz*" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

log "Backup completed successfully"
log "  - File: ${BACKUP_FILE}"
log "  - Size: ${BACKUP_SIZE}"
log "  - Total backups: ${TOTAL_BACKUPS}"
log "  - Total size: ${TOTAL_SIZE}"

send_notification "good" "Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ============================================================================
# CRON SETUP (add to crontab):
# Daily backup at 2 AM:
# 0 2 * * * /app/scripts/backup.sh >> /var/log/backup.log 2>&1
#
# Hourly backup for critical data:
# 0 * * * * /app/scripts/backup.sh >> /var/log/backup.log 2>&1
# ============================================================================

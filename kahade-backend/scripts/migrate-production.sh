#!/bin/bash

# ============================================================================
# PRODUCTION DATABASE MIGRATION SCRIPT
# ============================================================================
# Fix #92: Safe database migration for production environments
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MAX_RETRIES="${MAX_RETRIES:-3}"
LOCK_FILE="/tmp/kahade-migration.lock"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    rm -f "$LOCK_FILE"
}

trap cleanup EXIT

# Check for lock file (prevent concurrent migrations)
if [ -f "$LOCK_FILE" ]; then
    log_error "Migration already in progress. Lock file exists: $LOCK_FILE"
    exit 1
fi

touch "$LOCK_FILE"

# Pre-flight checks
log_info "Running pre-flight checks..."

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if we're in production
if [ "$NODE_ENV" != "production" ]; then
    log_warn "NODE_ENV is not 'production'. Current: ${NODE_ENV:-not set}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Step 1: Create database backup
log_info "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    log_info "Backup created: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    log_info "Backup compressed: ${BACKUP_FILE}.gz"
else
    log_warn "pg_dump not found. Skipping backup."
    log_warn "Ensure you have a backup before proceeding!"
    read -p "Continue without backup? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Check migration status
log_info "Checking migration status..."
pnpm prisma migrate status

# Step 3: Apply migrations
log_info "Applying database migrations..."

RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if pnpm prisma migrate deploy; then
        log_info "Migrations applied successfully!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warn "Migration failed. Retrying ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 5
        else
            log_error "Migration failed after $MAX_RETRIES attempts"
            log_error "Please check the error above and restore from backup if needed:"
            log_error "  gunzip -c ${BACKUP_FILE}.gz | psql \$DATABASE_URL"
            exit 1
        fi
    fi
done

# Step 4: Generate Prisma client
log_info "Generating Prisma client..."
pnpm prisma generate

# Step 5: Verify migration
log_info "Verifying migration..."
pnpm prisma migrate status

# Step 6: Run post-migration checks
log_info "Running post-migration checks..."

# Check if we can connect to the database
if pnpm prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    log_info "Database connection verified"
else
    log_error "Failed to connect to database after migration"
    exit 1
fi

log_info "Migration completed successfully!"
log_info "Backup location: ${BACKUP_FILE}.gz"

# Cleanup old backups (keep last 10)
log_info "Cleaning up old backups..."
ls -t "$BACKUP_DIR"/*.gz 2>/dev/null | tail -n +11 | xargs -r rm -f

log_info "Done!"

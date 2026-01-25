#!/bin/bash

# Database backup script
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/kahade_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Load environment variables
source .env.production

echo "Starting database backup..."

# Backup database
pg_dump $DATABASE_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
  
  # Compress backup
  gzip $BACKUP_FILE
  echo "Backup compressed: ${BACKUP_FILE}.gz"
  
  # Remove backups older than 30 days
  find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
  echo "Old backups removed."
else
  echo "Backup failed!"
  exit 1
fi

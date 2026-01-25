#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh <backup_file>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring database from $BACKUP_FILE..."

# Load environment variables
source .env.production

# Check if file is compressed
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c $BACKUP_FILE | psql $DATABASE_URL
else
  psql $DATABASE_URL < $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
  echo "Database restored successfully!"
else
  echo "Database restoration failed!"
  exit 1
fi

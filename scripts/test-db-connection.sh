#!/bin/bash

echo "Testing database connection..."

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  exit 1
fi

psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ Database connection successful"
  exit 0
else
  echo "✗ Database connection failed"
  exit 1
fi

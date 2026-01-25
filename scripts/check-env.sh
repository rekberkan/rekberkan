#!/bin/bash

echo "Checking environment variables..."

required_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "REDIS_HOST"
  "REDIS_PORT"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
  echo "✓ All required environment variables are set"
  exit 0
else
  echo "✗ Missing required environment variables:"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  exit 1
fi

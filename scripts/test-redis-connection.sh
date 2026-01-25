#!/bin/bash

echo "Testing Redis connection..."

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

redis-cli -h $REDIS_HOST -p $REDIS_PORT ping > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ Redis connection successful"
  exit 0
else
  echo "✗ Redis connection failed"
  exit 1
fi

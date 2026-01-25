#!/bin/bash
export PORT=5000
export NODE_ENV=development
export REDIS_ENABLED=false
cd kahade-backend
# Run with ts-node ignoring errors to get it up and running
export NODE_OPTIONS="--no-warnings"
npx ts-node -r tsconfig-paths/register --transpile-only src/main.ts

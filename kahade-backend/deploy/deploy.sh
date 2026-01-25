#!/bin/bash

set -e

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest code..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
yarn install --production=false

# Generate Prisma Client
echo "Generating Prisma Client..."
yarn prisma:generate

# Run database migrations
echo "Running migrations..."
yarn prisma:migrate deploy

# Build application
echo "Building application..."
yarn build

# Restart application with PM2
echo "Restarting application..."
pm2 reload pm2.config.js --update-env

echo "Deployment complete!"

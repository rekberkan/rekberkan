#!/bin/bash

echo "Setting up Kahade Backend development environment..."

# Check if .env.development exists
if [ ! -f .env.development ]; then
  echo "Creating .env.development from .env.example..."
  cp .env.example .env.development
fi

# Install dependencies
echo "Installing dependencies..."
yarn install

# Generate Prisma Client
echo "Generating Prisma Client..."
yarn prisma:generate

# Run database migrations
echo "Running database migrations..."
yarn prisma:migrate

# Seed database
echo "Seeding database..."
yarn prisma:seed

echo "Setup complete! Run 'yarn start:dev' to start the development server."

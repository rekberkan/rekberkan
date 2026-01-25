.PHONY: help install dev build start test clean docker-up docker-down migrate seed

# Default target
help:
	@echo "Kahade Backend - Available Commands:"
	@echo ""
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make test         - Run all tests"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo "  make test-cov     - Run tests with coverage"
	@echo "  make lint         - Run linter"
	@echo "  make format       - Format code"
	@echo "  make migrate      - Run database migrations"
	@echo "  make migrate-dev  - Create new migration"
	@echo "  make seed         - Seed database"
	@echo "  make prisma       - Open Prisma Studio"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs  - View Docker logs"
	@echo "  make clean        - Clean build files"
	@echo "  make backup       - Backup database"
	@echo "  make restore      - Restore database"
	@echo "  make generate-secrets - Generate secret keys"
	@echo ""

# Install dependencies
install:
	yarn install

# Development
dev:
	yarn start:dev

# Build
build:
	yarn build

# Start production
start:
	yarn start:prod

# Testing
test:
	yarn test

test-watch:
	yarn test:watch

test-cov:
	yarn test:cov

test-e2e:
	yarn test:e2e

# Linting & Formatting
lint:
	yarn lint

lint-fix:
	yarn lint:fix

format:
	yarn format

# Database
migrate:
	yarn prisma:migrate

migrate-dev:
	yarn prisma migrate dev

seed:
	yarn prisma:seed

prisma:
	yarn prisma:studio

generate:
	yarn prisma:generate

# Docker
docker-up:
	cd docker && docker-compose up -d

docker-down:
	cd docker && docker-compose down

docker-logs:
	cd docker && docker-compose logs -f

docker-restart:
	cd docker && docker-compose restart

docker-build:
	cd docker && docker-compose build

# Production Docker
docker-prod-up:
	cd docker && docker-compose -f docker-compose.prod.yml up -d

docker-prod-down:
	cd docker && docker-compose -f docker-compose.prod.yml down

# Cleanup
clean:
	rm -rf dist node_modules coverage .next

clean-logs:
	rm -rf logs/*.log

# Database Backup
backup:
	./scripts/backup-db.sh

restore:
	@read -p "Enter backup file path: " file; \
	./scripts/restore-db.sh $$file

# Utilities
generate-secrets:
	node scripts/generate-secret.js

setup:
	./scripts/setup-dev.sh

# Deployment
deploy:
	./deploy/deploy.sh

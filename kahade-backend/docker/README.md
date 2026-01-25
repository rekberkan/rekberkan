# Docker Configuration

This directory contains Docker-related files for the Kahade backend.

## Files

- **Dockerfile**: Multi-stage build for production
- **docker-compose.yml**: Development environment
- **docker-compose.prod.yml**: Production environment
- **nginx.conf**: Nginx reverse proxy configuration

## Quick Start

### Development

```bash
cd docker
docker-compose up -d
```

Access the API at: http://localhost:3000

### Production

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

## Services

### Development Compose

- **postgres**: PostgreSQL 16 database
- **redis**: Redis 7 cache
- **api**: NestJS application (dev mode)

### Production Compose

- **postgres**: PostgreSQL 16 database (production config)
- **redis**: Redis 7 cache (password protected)
- **api**: NestJS application (production build)
- **nginx**: Nginx reverse proxy with SSL

## Commands

### Start services

```bash
docker-compose up -d
```

### Stop services

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f
```

### Rebuild containers

```bash
docker-compose build --no-cache
```

### Execute commands in container

```bash
docker-compose exec api yarn prisma:migrate
```

## Volumes

- **postgres_data**: PostgreSQL data persistence
- **redis_data**: Redis data persistence
- **uploads**: Application file uploads

## Networking

All services are connected via `kahade-network` bridge network.

## Environment Variables

Create `.env.production` file with production settings before deploying.

## SSL Setup

For production, place SSL certificates in `./ssl/` directory:

```
ssl/
├── fullchain.pem
└── privkey.pem
```

Obtain certificates using Let's Encrypt:

```bash
sudo certbot certonly --standalone -d yourdomain.com
```

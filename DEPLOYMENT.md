# Rekberkan - Production Deployment Guide

## Domain Configuration

| Subdomain | Purpose | Directory |
|-----------|---------|-----------|
| rekberkan.cloud | Landing Page | `dist/landing` |
| api.rekberkan.cloud | Backend API | `kahade-backend` |
| app.rekberkan.cloud | User Dashboard | `dist/app` |
| admin.rekberkan.cloud | Admin Panel | `dist/admin` |

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- Redis 6+
- Nginx or similar reverse proxy
- SSL certificates (Let's Encrypt recommended)

---

## Backend Deployment

### 1. Environment Setup

```bash
cd kahade-backend

# Copy production environment file
cp .env.production .env

# Edit .env and replace all placeholder values:
# - DATABASE_URL: Your PostgreSQL connection string
# - JWT_SECRET: Generate with `openssl rand -base64 64`
# - JWT_REFRESH_SECRET: Generate with `openssl rand -base64 64`
# - COOKIE_SECRET: Generate with `openssl rand -base64 32`
# - REDIS_PASSWORD: Your Redis password
# - MIDTRANS_SERVER_KEY: Your Midtrans production key
# - MIDTRANS_CLIENT_KEY: Your Midtrans production key
```

### 2. Install Dependencies & Build

```bash
npm ci --production=false
npm run prisma:generate
npm run build
```

### 3. Database Migration

```bash
npm run prisma:migrate
```

### 4. Start Production Server

```bash
# Using PM2 (recommended)
pm2 start dist/src/main.js --name rekberkan-api

# Or using Node directly
NODE_ENV=production node dist/src/main.js
```

### 5. Nginx Configuration for API

```nginx
server {
    listen 443 ssl http2;
    server_name api.rekberkan.cloud;

    ssl_certificate /etc/letsencrypt/live/rekberkan.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rekberkan.cloud/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Frontend Deployment

### 1. Environment Setup

```bash
cd kahade-frontend

# Production environment is already configured in .env.production
# Verify the settings are correct for your domain
```

### 2. Build All Subdomains

```bash
npm ci
npm run build
```

This creates three directories:
- `dist/landing` - Landing page
- `dist/app` - User dashboard
- `dist/admin` - Admin panel

### 3. Nginx Configuration for Frontend

```nginx
# Landing Page - rekberkan.cloud
server {
    listen 443 ssl http2;
    server_name rekberkan.cloud www.rekberkan.cloud;

    ssl_certificate /etc/letsencrypt/live/rekberkan.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rekberkan.cloud/privkey.pem;

    root /var/www/rekberkan/dist/landing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# User App - app.rekberkan.cloud
server {
    listen 443 ssl http2;
    server_name app.rekberkan.cloud;

    ssl_certificate /etc/letsencrypt/live/rekberkan.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rekberkan.cloud/privkey.pem;

    root /var/www/rekberkan/dist/app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Admin Panel - admin.rekberkan.cloud
server {
    listen 443 ssl http2;
    server_name admin.rekberkan.cloud;

    ssl_certificate /etc/letsencrypt/live/rekberkan.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rekberkan.cloud/privkey.pem;

    root /var/www/rekberkan/dist/admin;
    index index.html;

    # IP whitelist for admin (optional but recommended)
    # allow YOUR_ADMIN_IP;
    # deny all;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name rekberkan.cloud www.rekberkan.cloud app.rekberkan.cloud admin.rekberkan.cloud api.rekberkan.cloud;
    return 301 https://$server_name$request_uri;
}
```

---

## SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get wildcard certificate for all subdomains
sudo certbot certonly --manual --preferred-challenges=dns \
  -d rekberkan.cloud \
  -d *.rekberkan.cloud

# Or get individual certificates
sudo certbot --nginx -d rekberkan.cloud -d www.rekberkan.cloud
sudo certbot --nginx -d api.rekberkan.cloud
sudo certbot --nginx -d app.rekberkan.cloud
sudo certbot --nginx -d admin.rekberkan.cloud
```

---

## Post-Deployment Checklist

### Security
- [ ] All environment secrets are unique and strong
- [ ] HTTPS is enforced on all domains
- [ ] CORS is configured for production domains only
- [ ] Swagger is disabled in production
- [ ] Admin panel has IP whitelist (optional)
- [ ] Rate limiting is configured

### Database
- [ ] Database backups are scheduled
- [ ] Connection pooling is configured
- [ ] SSL connection is enabled

### Monitoring
- [ ] Sentry DSN is configured for error tracking
- [ ] Health check endpoint is monitored
- [ ] Log rotation is configured

### Performance
- [ ] Static assets have cache headers
- [ ] Gzip compression is enabled
- [ ] CDN is configured (optional)

---

## Useful Commands

```bash
# Check backend health
curl https://api.rekberkan.cloud/health

# View backend logs (PM2)
pm2 logs rekberkan-api

# Restart backend
pm2 restart rekberkan-api

# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Clear Redis cache
redis-cli -a $REDIS_PASSWORD FLUSHDB
```

---

## Troubleshooting

### CORS Errors
- Verify `CORS_ORIGIN` in backend `.env` includes all frontend domains
- Check browser console for exact origin being blocked

### Cookie Issues
- Verify `VITE_COOKIE_DOMAIN` is set to `.rekberkan.cloud`
- Ensure `COOKIE_SECRET` is set in backend

### 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs rekberkan-api`
- Verify Nginx upstream configuration

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running and accessible
- Verify SSL settings match database configuration

# Deployment Files

This directory contains deployment configurations and scripts.

## Files

- **deploy.sh**: Automated deployment script
- **nginx.conf**: Nginx production configuration
- **pm2.config.js**: PM2 process manager configuration

## Deployment Process

### 1. Initial Setup

```bash
# On your server
git clone https://github.com/rekberkan/kahade.git
cd kahade/kahade-backend
cp .env.example .env.production
# Edit .env.production with production values
```

### 2. Manual Deployment

```bash
./deploy/deploy.sh
```

This script will:
1. Pull latest code from Git
2. Install dependencies
3. Generate Prisma Client
4. Run database migrations
5. Build the application
6. Restart with PM2

### 3. Nginx Setup

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/kahade
sudo ln -s /etc/nginx/sites-available/kahade /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. PM2 Process Manager

```bash
# Start application
pm2 start deploy/pm2.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

## CI/CD Deployment

### GitHub Actions

See `.github/workflows/deploy.yml` for automated deployment.

### Required Secrets

- `SERVER_HOST`: Production server IP/domain
- `SERVER_USER`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key

## Monitoring

### PM2 Commands

```bash
pm2 status          # Check status
pm2 logs kahade-api # View logs
pm2 monit           # Monitor resources
pm2 restart all     # Restart all processes
```

### Nginx Commands

```bash
sudo nginx -t                    # Test configuration
sudo systemctl status nginx      # Check status
sudo systemctl restart nginx     # Restart
sudo tail -f /var/log/nginx/error.log  # View logs
```

## Rollback

If deployment fails:

```bash
git checkout previous_working_commit
./deploy/deploy.sh
```

## SSL Certificate Renewal

```bash
sudo certbot renew
sudo systemctl restart nginx
```

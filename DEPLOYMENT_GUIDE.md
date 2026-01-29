# Panduan Deployment Lengkap: Rekberkan di VPS Ubuntu 22.04

**Penulis**: Manus AI  
**Tanggal**: 29 Januari 2026  
**Versi**: 2.0 (Nginx-only Frontend)

## Pendahuluan

Dokumen ini menyediakan panduan langkah-demi-langkah untuk melakukan deployment aplikasi **Rekberkan** ke server produksi (VPS) yang menjalankan **Ubuntu 22.04**. Panduan ini mencakup semua tahap, mulai dari persiapan server awal, instalasi dependensi, konfigurasi, hingga menjalankan aplikasi di lingkungan produksi yang aman dan efisien.

Aplikasi Rekberkan terdiri dari dua komponen utama:
1. **Backend**: Dibangun dengan NestJS, Prisma, dan PostgreSQL (dijalankan dengan PM2)
2. **Frontend**: Dibangun dengan React (Vite) - Static files yang di-serve langsung oleh Nginx

Panduan ini mengasumsikan Anda akan menggunakan subdomain untuk setiap bagian:
- `yourdomain.com` - Landing page
- `app.yourdomain.com` - Aplikasi utama
- `admin.yourdomain.com` - Panel admin
- `api.yourdomain.com` - Backend API

## 1. Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- **VPS dengan Ubuntu 22.04**: Server baru dengan akses root atau sudo (minimal 1GB RAM, 20GB storage)
- **Domain**: Nama domain yang sudah terdaftar
- **DNS Records**: Konfigurasi A record untuk semua domain/subdomain mengarah ke IP VPS:
  - `yourdomain.com` → `YOUR_VPS_IP`
  - `app.yourdomain.com` → `YOUR_VPS_IP`
  - `admin.yourdomain.com` → `YOUR_VPS_IP`
  - `api.yourdomain.com` → `YOUR_VPS_IP`
- **Klien SSH**: Terminal atau PuTTY untuk terhubung ke VPS

---

## 2. Penyiapan Server Awal (Initial Server Setup)

### 2.1. Login dan Buat User Baru

Login ke server sebagai `root`:

```bash
ssh root@YOUR_VPS_IP
```

Buat user baru dan berikan hak sudo:

```bash
adduser deployer
usermod -aG sudo deployer
```

Salin kunci SSH ke user baru:

```bash
rsync --archive --chown=deployer:deployer ~/.ssh /home/deployer
```

Logout dan login kembali sebagai user baru:

```bash
exit
ssh deployer@YOUR_VPS_IP
```

### 2.2. Update System

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### 2.3. Konfigurasi Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2.4. Instalasi Dependensi Utama

```bash
# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2 (hanya untuk backend)
sudo npm install -g pm2

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx

# Install Git (jika belum ada)
sudo apt-get install -y git
```

---

## 3. Konfigurasi Database dan Redis

### 3.1. Konfigurasi PostgreSQL

```bash
sudo -u postgres psql
```

Di dalam psql shell:

```sql
CREATE USER rekberkan_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_DB_PASSWORD';
CREATE DATABASE rekberkan_db OWNER rekberkan_user;
GRANT ALL PRIVILEGES ON DATABASE rekberkan_db TO rekberkan_user;
\q
```

### 3.2. Konfigurasi Redis

Amankan Redis dengan password:

```bash
sudo nano /etc/redis/redis.conf
```

Cari dan ubah baris berikut:

```
requirepass YOUR_STRONG_REDIS_PASSWORD
```

Restart Redis:

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

## 4. Deployment Aplikasi

### 4.1. Clone Repository

```bash
cd ~
git clone https://github.com/rekberkan/rekberkan.git
cd rekberkan
```

### 4.2. Setup Backend (kahade-backend)

**1. Install Dependencies**

```bash
cd ~/rekberkan/kahade-backend
pnpm install
```

**2. Konfigurasi Environment**

```bash
cp .env.example .env.production
nano .env.production
```

Isi variabel penting:

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database
DATABASE_URL=postgresql://rekberkan_user:YOUR_STRONG_DB_PASSWORD@localhost:5432/rekberkan_db?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_STRONG_REDIS_PASSWORD

# JWT (Generate: openssl rand -base64 64)
JWT_SECRET=YOUR_64_CHAR_JWT_SECRET
JWT_REFRESH_SECRET=YOUR_DIFFERENT_64_CHAR_JWT_REFRESH_SECRET

# Encryption Keys (Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MFA_ENCRYPTION_KEY=YOUR_32_BYTE_HEX_KEY
BANK_ENCRYPTION_KEY=YOUR_32_BYTE_HEX_KEY

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com

# Security
ENABLE_SWAGGER=false
```

**3. Migrasi Database**

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

**4. Build Backend**

```bash
pnpm run build
```

### 4.3. Setup Frontend (kahade-frontend)

**1. Install Dependencies**

```bash
cd ~/rekberkan/kahade-frontend
pnpm install
```

**2. Konfigurasi Environment**

```bash
nano .env.production
```

Isi dengan:

```bash
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_BASE_DOMAIN=yourdomain.com
VITE_LANDING_URL=https://yourdomain.com
VITE_APP_URL=https://app.yourdomain.com
VITE_ADMIN_URL=https://admin.yourdomain.com
VITE_COOKIE_DOMAIN=.yourdomain.com
VITE_ENABLE_ANALYTICS=true
```

**3. Build Frontend (Semua Mode)**

```bash
# Build Landing Page
VITE_APP_MODE=landing pnpm run build:landing

# Build App
VITE_APP_MODE=app pnpm run build:app

# Build Admin
VITE_APP_MODE=admin pnpm run build:admin
```

Hasil build akan berada di:
- `dist/landing/` - Landing page
- `dist/app/` - Aplikasi utama
- `dist/admin/` - Panel admin

---

## 5. Konfigurasi Nginx

Nginx akan berfungsi sebagai:
- **Reverse proxy** untuk backend API
- **Static file server** untuk frontend (tanpa Node.js)

### 5.1. Hapus Default Config

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 5.2. Buat Konfigurasi Rekberkan

```bash
sudo nano /etc/nginx/sites-available/rekberkan
```

Salin konfigurasi berikut (ganti `yourdomain.com` dengan domain Anda):

```nginx
# ============================================
# API Backend - Reverse Proxy ke Node.js
# ============================================
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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
        proxy_read_timeout 90;
    }
}

# ============================================
# Landing Page - Static Files
# ============================================
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /home/deployer/rekberkan/kahade-frontend/dist/landing;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA Routing - Semua route ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ============================================
# App - Static Files
# ============================================
server {
    listen 80;
    server_name app.yourdomain.com;

    root /home/deployer/rekberkan/kahade-frontend/dist/app;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ============================================
# Admin Panel - Static Files
# ============================================
server {
    listen 80;
    server_name admin.yourdomain.com;

    root /home/deployer/rekberkan/kahade-frontend/dist/admin;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5.3. Aktifkan Konfigurasi

```bash
sudo ln -s /etc/nginx/sites-available/rekberkan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 6. Menjalankan Backend dengan PM2

PM2 hanya digunakan untuk backend Node.js. Frontend di-serve langsung oleh Nginx sebagai static files.

### 6.1. Jalankan Backend

```bash
cd ~/rekberkan/kahade-backend
pm2 start dist/main.js --name rekberkan-api --env-file .env.production
```

### 6.2. Konfigurasi Auto-Start

```bash
pm2 save
pm2 startup systemd -u deployer --hp /home/deployer
```

Jalankan perintah yang ditampilkan oleh PM2 (biasanya dimulai dengan `sudo env PATH=...`).

### 6.3. Perintah PM2 Berguna

```bash
pm2 status              # Lihat status
pm2 logs rekberkan-api  # Lihat logs
pm2 restart rekberkan-api  # Restart
pm2 monit               # Monitor real-time
```

---

## 7. Konfigurasi SSL dengan Certbot

### 7.1. Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 7.2. Dapatkan Sertifikat SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d app.yourdomain.com -d admin.yourdomain.com -d api.yourdomain.com
```

Ikuti instruksi di layar. Certbot akan otomatis:
- Mendapatkan sertifikat SSL
- Mengkonfigurasi Nginx untuk HTTPS
- Mengatur auto-renewal

### 7.3. Verifikasi Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## 8. Finalisasi dan Verifikasi

### 8.1. Cek Semua Services

```bash
# Backend
pm2 status

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server
```

### 8.2. Test Endpoints

```bash
# Test API
curl -s https://api.yourdomain.com/api/v1/health/ready

# Test Frontend (harus return HTML)
curl -s https://yourdomain.com | head -20
curl -s https://app.yourdomain.com | head -20
curl -s https://admin.yourdomain.com | head -20
```

### 8.3. URL Aplikasi

Setelah deployment selesai, aplikasi dapat diakses di:

| Komponen | URL |
|----------|-----|
| Landing Page | `https://yourdomain.com` |
| Aplikasi | `https://app.yourdomain.com` |
| Admin Panel | `https://admin.yourdomain.com` |
| API | `https://api.yourdomain.com` |

---

## Appendix A: Konfigurasi Environment Backend Lengkap

```bash
# ============================================================================
# REKBERKAN BACKEND - PRODUCTION ENVIRONMENT
# ============================================================================

NODE_ENV=production
PORT=3000
API_PREFIX=api

# APPLICATION
APP_NAME=Rekberkan API
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# DATABASE
DATABASE_URL=postgresql://rekberkan_user:YOUR_STRONG_DB_PASSWORD@localhost:5432/rekberkan_db?schema=public

# JWT (Generate dengan: openssl rand -base64 64)
JWT_SECRET=YOUR_64_CHAR_JWT_SECRET
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=YOUR_64_CHAR_JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRATION=7d

# REDIS
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_STRONG_REDIS_PASSWORD
REDIS_DB=0
REDIS_CACHE_TTL=3600
REDIS_SESSION_TTL=86400

# RATE LIMITING
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com

# FILE UPLOAD
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# QUEUE
QUEUE_PREFIX=rekberkan_prod

# LOGGING
LOG_LEVEL=info
LOG_FILE=logs/application.log
ERROR_LOG_FILE=logs/error.log

# FEATURES
ENABLE_SWAGGER=false
ENABLE_GRAPHQL=false
ENABLE_WEBSOCKET=false

# ENCRYPTION KEYS (Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MFA_ENCRYPTION_KEY=YOUR_32_BYTE_HEX_KEY
BANK_ENCRYPTION_KEY=YOUR_32_BYTE_HEX_KEY
BANK_ENCRYPTION_SALT=YOUR_UNIQUE_SALT

# ADMIN SECURITY
ADMIN_IP_WHITELIST=YOUR_ADMIN_IP
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900
ATTEMPT_WINDOW=300
```

---

## Appendix B: Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| 502 Bad Gateway (API) | Backend tidak berjalan | `pm2 restart rekberkan-api` |
| 403 Forbidden (Frontend) | Permission issue | `sudo chown -R deployer:deployer ~/rekberkan` |
| 404 Not Found (Frontend) | SPA routing tidak bekerja | Pastikan `try_files $uri $uri/ /index.html;` ada di Nginx |
| Database connection error | PostgreSQL tidak berjalan | `sudo systemctl start postgresql` |
| Redis connection refused | Redis tidak berjalan | `sudo systemctl start redis-server` |
| SSL certificate error | Sertifikat expired | `sudo certbot renew` |
| CORS error | Domain tidak di whitelist | Update `CORS_ORIGIN` di .env.production |

### Perintah Debugging

```bash
# Cek log Nginx
sudo tail -f /var/log/nginx/error.log

# Cek log backend
pm2 logs rekberkan-api

# Cek port yang digunakan
sudo netstat -tlnp

# Restart semua services
sudo systemctl restart nginx
pm2 restart all
```

---

## Appendix C: Checklist Deployment

- [ ] Server Ubuntu 22.04 sudah siap
- [ ] User non-root dengan sudo sudah dibuat
- [ ] Firewall (UFW) sudah dikonfigurasi
- [ ] Node.js, pnpm, PM2 sudah terinstall
- [ ] PostgreSQL sudah terinstall dan dikonfigurasi
- [ ] Redis sudah terinstall dan diamankan
- [ ] Nginx sudah terinstall
- [ ] Repository sudah di-clone
- [ ] Backend .env.production sudah dikonfigurasi
- [ ] Database sudah di-migrate
- [ ] Backend sudah di-build
- [ ] Frontend .env.production sudah dikonfigurasi
- [ ] Frontend sudah di-build (landing, app, admin)
- [ ] Nginx sudah dikonfigurasi (API proxy + static files)
- [ ] Backend berjalan dengan PM2
- [ ] PM2 startup sudah dikonfigurasi
- [ ] SSL certificate sudah terinstall
- [ ] Semua domain bisa diakses dengan HTTPS

---

## Appendix D: Keuntungan Nginx-Only untuk Frontend

| Aspek | Dengan PM2 (Express) | Nginx-Only (Static) |
|-------|---------------------|---------------------|
| **Memory Usage** | ~50-100MB per process | ~5MB (Nginx worker) |
| **CPU Usage** | Higher (Node.js runtime) | Minimal |
| **Performance** | Good | Excellent |
| **Complexity** | 2 Node.js processes | 1 Node.js process |
| **Caching** | Manual implementation | Built-in Nginx |
| **Gzip** | Manual middleware | Built-in Nginx |

---

**Dokumen ini dibuat berdasarkan testing langsung pada Ubuntu 22.04.**

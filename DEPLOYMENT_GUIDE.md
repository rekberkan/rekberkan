# Panduan Deployment Lengkap: Platform Escrow Kahade ke VPS Ubuntu 22.04

**Penulis:** Manus AI
**Tanggal:** 29 Januari 2026

## 1. Pendahuluan

Dokumen ini menyediakan panduan langkah-demi-langkah yang komprehensif untuk melakukan deployment aplikasi P2P Escrow Kahade (backend dan frontend) ke server VPS yang menjalankan Ubuntu 22.04. Panduan ini mencakup semua aspek, mulai dari persiapan server awal, konfigurasi environment, hingga menjalankan aplikasi secara production-ready menggunakan Nginx sebagai reverse proxy dan PM2 sebagai process manager.

## 2. Prasyarat Server

Sebelum memulai, pastikan VPS Anda telah memenuhi prasyarat berikut. Semua perintah dieksekusi sebagai user dengan hak sudo.

### 2.1. Pembaruan Sistem

Pastikan semua paket sistem diperbarui ke versi terbaru.

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2. Instalasi Perangkat Lunak Esensial

Instalasi perangkat lunak yang dibutuhkan untuk build dan manajemen.

```bash
sudo apt install -y build-essential git nginx curl unzip
```

### 2.3. Instalasi Node.js dan pnpm

Aplikasi ini membutuhkan Node.js versi 18 atau lebih tinggi. Kami merekomendasikan menggunakan `nvm` (Node Version Manager) untuk mengelola versi Node.js.

```bash
# Instal nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Muat nvm ke shell saat ini
source ~/.bashrc

# Instal Node.js LTS (versi 20.x saat penulisan)
nvm install --lts

# Instal pnpm (package manager yang digunakan di frontend)
npm install -g pnpm
```

### 2.4. Instalasi Database (PostgreSQL)

Backend menggunakan PostgreSQL sebagai database utama.

```bash
# Instal PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Mulai dan aktifkan layanan PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Buat user dan database untuk aplikasi
sudo -u postgres psql -c "CREATE DATABASE kahade_prod;"
sudo -u postgres psql -c "CREATE USER kahade_user WITH ENCRYPTED PASSWORD 'GANTI_DENGAN_PASSWORD_KUAT';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kahade_prod TO kahade_user;"
```

> **PENTING:** Ganti `'GANTI_DENGAN_PASSWORD_KUAT'` dengan password yang aman dan unik.

### 2.5. Instalasi In-Memory Store (Redis)

Redis digunakan untuk caching, antrian (queue), dan manajemen sesi.

```bash
# Instal Redis
sudo apt install -y redis-server

# Mulai dan aktifkan layanan Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# (Opsional) Konfigurasi password untuk Redis
# sudo nano /etc/redis/redis.conf
# -> Uncomment dan ubah baris: requirepass GANTI_DENGAN_PASSWORD_REDIS
# sudo systemctl restart redis-server
```

### 2.6. Instalasi Process Manager (PM2)

PM2 akan digunakan untuk menjaga agar aplikasi backend tetap berjalan (daemonize).

```bash
npm install -g pm2

# Konfigurasi PM2 untuk start saat boot
pm2 startup
# -> Salin dan jalankan perintah yang ditampilkan oleh PM2
```

## 3. Konfigurasi Firewall (UFW)

Konfigurasikan firewall untuk hanya mengizinkan traffic yang diperlukan (SSH, HTTP, HTTPS).

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verifikasi status
sudo ufw status
```

## 4. Deployment Backend (kahade-backend)

Langkah-langkah untuk men-deploy aplikasi backend NestJS.

### 4.1. Clone Repository

Clone repository dari GitHub ke direktori home user Anda.

```bash
cd ~
git clone https://github.com/rekberkan/rekberkan.git
```

### 4.2. Konfigurasi Environment

Salin file `.env.example` dan isi semua variabel yang diperlukan.

```bash
cd ~/rekberkan/kahade-backend
cp .env.example .env

nano .env
```

Pastikan untuk mengisi variabel berikut dengan benar:

- `NODE_ENV=production`
- `DATABASE_URL="postgresql://kahade_user:GANTI_DENGAN_PASSWORD_KUAT@localhost:5432/kahade_prod?schema=public"`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- `JWT_SECRET` (generate nilai acak yang kuat)
- `JWT_REFRESH_SECRET` (generate nilai acak yang kuat)
- `COOKIE_SECRET` (generate nilai acak yang kuat)
- `CORS_ORIGIN` (misal: `https://app.domainanda.com,https://admin.domainanda.com`)
- `ENABLE_SWAGGER=false`

### 4.3. Instalasi Dependensi dan Build

```bash
npm install
npm run prisma:generate
npm run build
```

### 4.4. Migrasi Database

Jalankan migrasi Prisma untuk membuat skema database.

```bash
npm run prisma:migrate
```

### 4.5. Menjalankan Aplikasi dengan PM2

Gunakan PM2 untuk menjalankan aplikasi backend.

```bash
pm2 start dist/src/main.js --name kahade-backend

# Simpan konfigurasi PM2
pm2 save

# Lihat status aplikasi
pm2 list
```

## 5. Deployment Frontend (kahade-frontend)

Frontend terdiri dari tiga aplikasi (landing, app, admin) yang perlu di-build secara terpisah.

### 5.1. Instalasi Dependensi dan Build

```bash
cd ~/rekberkan/kahade-frontend

# Instal dependensi menggunakan pnpm
pnpm install

# Build semua aplikasi frontend
pnpm run build
```

Setelah selesai, Anda akan memiliki tiga direktori di dalam `kahade-frontend/dist`:
- `landing`
- `app`
- `admin`

## 6. Konfigurasi Nginx sebagai Reverse Proxy

Nginx akan melayani file statis frontend dan meneruskan permintaan API ke backend.

### 6.1. Buat File Konfigurasi Nginx

Buat file konfigurasi baru di `/etc/nginx/sites-available/`.

```bash
sudo nano /etc/nginx/sites-available/kahade
```

### 6.2. Contoh Konfigurasi Nginx

Tempelkan konfigurasi berikut, dan sesuaikan `domainanda.com` dengan domain Anda.

```nginx
# Redirect HTTP ke HTTPS
server {
    listen 80;
    server_name domainanda.com app.domainanda.com admin.domainanda.com;
    return 301 https://$host$request_uri;
}

# Aplikasi Landing Page
server {
    listen 443 ssl http2;
    server_name domainanda.com;

    root /home/ubuntu/rekberkan/kahade-frontend/dist/landing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSL (ganti dengan path sertifikat Anda)
    ssl_certificate /etc/letsencrypt/live/domainanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domainanda.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Aplikasi Utama (App)
server {
    listen 443 ssl http2;
    server_name app.domainanda.com;

    root /home/ubuntu/rekberkan/kahade-frontend/dist/app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSL
    ssl_certificate /etc/letsencrypt/live/domainanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domainanda.com/privkey.pem;
}

# Aplikasi Admin
server {
    listen 443 ssl http2;
    server_name admin.domainanda.com;

    root /home/ubuntu/rekberkan/kahade-frontend/dist/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        # ... (konfigurasi proxy yang sama seperti di atas)
    }

    # SSL
    ssl_certificate /etc/letsencrypt/live/domainanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domainanda.com/privkey.pem;
}
```

### 6.3. Aktifkan Konfigurasi dan Restart Nginx

```bash
# Buat symbolic link ke sites-enabled
sudo ln -s /etc/nginx/sites-available/kahade /etc/nginx/sites-enabled/

# Tes konfigurasi Nginx
sudo nginx -t

# Restart Nginx untuk menerapkan perubahan
sudo systemctl restart nginx
```

### 6.4. Setup SSL dengan Let's Encrypt

Jika Anda belum memiliki sertifikat SSL, gunakan Certbot untuk mendapatkannya secara gratis.

```bash
# Instal Certbot
sudo apt install -y certbot python3-certbot-nginx

# Dapatkan sertifikat untuk semua domain
sudo certbot --nginx -d domainanda.com -d app.domainanda.com -d admin.domainanda.com

# Certbot akan otomatis memperbarui konfigurasi Nginx Anda.
```

## 7. Verifikasi

Buka browser Anda dan akses:
- `https://domainanda.com` (Landing Page)
- `https://app.domainanda.com` (Aplikasi Utama)
- `https://admin.domainanda.com` (Aplikasi Admin)

Pastikan semua aplikasi dapat diakses dan berfungsi dengan baik. Cek juga log PM2 jika terjadi masalah pada backend.

```bash
pm2 logs kahade-backend
```

---


*Panduan ini dibuat berdasarkan struktur dan dependensi proyek per tanggal 29 Januari 2026. Penyesuaian mungkin diperlukan jika ada perubahan signifikan pada codebase.*

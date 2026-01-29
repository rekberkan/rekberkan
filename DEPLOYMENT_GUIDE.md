# Panduan Deployment Lengkap: Rekberkan di VPS Ubuntu 22.04

**Penulis**: Manus AI
**Tanggal**: 29 Januari 2026

## Pendahuluan

Dokumen ini menyediakan panduan langkah-demi-langkah untuk melakukan deployment aplikasi **Rekberkan** ke server produksi (VPS) yang menjalankan **Ubuntu 22.04**. Panduan ini mencakup semua tahap, mulai dari persiapan server awal, instalasi dependensi, konfigurasi, hingga menjalankan aplikasi di lingkungan produksi yang aman dan efisien.

Aplikasi Rekberkan terdiri dari dua komponen utama:
1.  **Backend**: Dibangun dengan NestJS, Prisma, dan PostgreSQL.
2.  **Frontend**: Dibangun dengan React (Vite) dan dibagi menjadi tiga bagian: `landing`, `app`, dan `admin`.

Panduan ini mengasumsikan Anda akan menggunakan subdomain untuk setiap bagian: `yourdomain.com` (landing), `app.yourdomain.com` (aplikasi utama), `admin.yourdomain.com` (panel admin), dan `api.yourdomain.com` (backend API).

## 1. Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- **VPS dengan Ubuntu 22.04**: Server baru dengan akses root atau sudo.
- **Domain**: Nama domain yang sudah terdaftar.
- **DNS Records**: Kemampuan untuk mengkonfigurasi DNS record (A record) untuk domain dan subdomain Anda agar mengarah ke alamat IP VPS Anda.
  - `yourdomain.com` -> `YOUR_VPS_IP`
  - `app.yourdomain.com` -> `YOUR_VPS_IP`
  - `admin.yourdomain.com` -> `YOUR_VPS_IP`
  - `api.yourdomain.com` -> `YOUR_VPS_IP`
- **Klien SSH**: Terminal atau PuTTY untuk terhubung ke VPS Anda.

---

## 2. Penyiapan Server Awal (Initial Server Setup)

Langkah-langkah ini untuk mengamankan dan menyiapkan server Ubuntu Anda.

### 2.1. Login dan Buat User Baru

Login ke server Anda sebagai `root`:
```bash
ssh root@YOUR_VPS_IP
```

Buat user baru (ganti `deployer` dengan username pilihan Anda) dan berikan hak sudo.

```bash
adduser deployer
usermod -aG sudo deployer
```

Salin kunci SSH Anda ke user baru agar bisa login tanpa password:

```bash
rsync --archive --chown=deployer:deployer ~/.ssh /home/deployer
```

Logout dari `root` dan login kembali sebagai user baru:

```bash
exit
ssh deployer@YOUR_VPS_IP
```

### 2.2. Konfigurasi Firewall (UFW)

Aktifkan firewall untuk mengizinkan traffic SSH, HTTP, dan HTTPS.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2.3. Instalasi Dependensi Utama

Install Node.js (v22), pnpm, PostgreSQL, Redis, dan Nginx.

```bash
# Install Node.js & pnpm
sudo apt-get update
sudo apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx

# Install PM2 (Process Manager)
sudo pnpm install -g pm2
```

---

## 3. Konfigurasi Database dan Redis

### 3.1. Konfigurasi PostgreSQL

Buat user dan database untuk aplikasi Rekberkan di PostgreSQL.

```bash
sudo -u postgres psql
```

Di dalam psql shell, jalankan perintah berikut:

```sql
CREATE USER rekberkan_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE rekberkan_db OWNER rekberkan_user;
GRANT ALL PRIVILEGES ON DATABASE rekberkan_db TO rekberkan_user;
\q
```

### 3.2. Konfigurasi Redis

Amankan Redis dengan mengatur password. Buka file konfigurasi Redis:

```bash
sudo nano /etc/redis/redis.conf
```

Cari baris `# requirepass foobared` dan ubah menjadi (ganti dengan password yang kuat):

```
requirepass YOUR_STRONG_REDIS_PASSWORD
```

Restart Redis untuk menerapkan perubahan:

```bash
sudo systemctl restart redis-server
```

---

## 4. Deployment Aplikasi

### 4.1. Clone Repository

Clone repository Rekberkan dari GitHub ke direktori home Anda.

```bash
cd ~
gh repo clone rekberkan/rekberkan
cd rekberkan
```

### 4.2. Setup Backend (kahade-backend)

**1. Install Dependencies**

```bash
cd kahade-backend
pnpm install --production
```

**2. Konfigurasi Environment (.env)**

Salin file `.env.example` dan sesuaikan untuk produksi.

```bash
cp .env.example .env.production
nano .env.production
```

Pastikan Anda mengisi semua variabel penting, terutama:

- `DATABASE_URL`: `postgresql://rekberkan_user:YOUR_STRONG_PASSWORD@localhost:5432/rekberkan_db?schema=public`
- `REDIS_PASSWORD`: `YOUR_STRONG_REDIS_PASSWORD`
- `JWT_SECRET` & `JWT_REFRESH_SECRET`: Generate dengan `openssl rand -base64 64`
- `MFA_ENCRYPTION_KEY` & `BANK_ENCRYPTION_KEY`: Generate dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `CORS_ORIGIN`: `https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com`
- `ENABLE_SWAGGER`: `false`

**3. Migrasi Database**

Jalankan migrasi Prisma untuk membuat skema database.

```bash
pnpm prisma migrate deploy
```

**4. Build Aplikasi**

```bash
pnpm run build
```

### 4.3. Setup Frontend (kahade-frontend)

**1. Install Dependencies**

```bash
cd ../kahade-frontend
pnpm install --production
```

**2. Konfigurasi Environment (.env)**

Buat file `.env.production` dan isi sesuai domain Anda.

```bash
nano .env.production
```

Isi file dengan konfigurasi berikut (ganti `yourdomain.com`):

```
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_BASE_DOMAIN=yourdomain.com
VITE_LANDING_URL=https://yourdomain.com
VITE_APP_URL=https://app.yourdomain.com
VITE_ADMIN_URL=https://admin.yourdomain.com
VITE_COOKIE_DOMAIN=.yourdomain.com
VITE_ENABLE_ANALYTICS=true
```

**3. Build Aplikasi**

Build semua bagian frontend (landing, app, admin) dan server-nya.

```bash
pnpm run build
```

---

## 5. Konfigurasi Nginx sebagai Reverse Proxy

Nginx akan berfungsi sebagai reverse proxy untuk mengarahkan traffic dari domain/subdomain ke aplikasi Node.js yang berjalan.

Buat file konfigurasi Nginx baru:

```bash
sudo nano /etc/nginx/sites-available/rekberkan
```

Salin dan tempel konfigurasi berikut, sesuaikan `yourdomain.com` dengan domain Anda.

```nginx
# API Backend (api.yourdomain.com)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend (landing, app, admin)
server {
    listen 80;
    server_name yourdomain.com app.yourdomain.com admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:5050; # Port untuk frontend server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi ini dengan membuat symbolic link:

```bash
sudo ln -s /etc/nginx/sites-available/rekberkan /etc/nginx/sites-enabled/
```

Test konfigurasi Nginx dan restart jika tidak ada error:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Menjalankan Aplikasi dengan PM2

PM2 adalah process manager untuk Node.js yang akan menjaga aplikasi tetap berjalan dan me-restartnya jika terjadi crash.

### 6.1. Jalankan Backend

```bash
cd ~/rekberkan/kahade-backend
pm2 start dist/main.js --name rekberkan-backend -- --env-file .env.production
```

### 6.2. Jalankan Frontend

Frontend server akan secara dinamis menyajikan build yang sesuai (landing, app, atau admin) berdasarkan subdomain yang diakses.

```bash
cd ~/rekberkan/kahade-frontend
pm2 start dist/index.js --name rekberkan-frontend -- --port 5050
```

### 6.3. Simpan Konfigurasi PM2

Simpan daftar proses agar PM2 dapat me-restartnya secara otomatis setelah server reboot.

```bash
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deployer --hp /home/deployer
```

---

## 7. Konfigurasi SSL dengan Certbot

Amankan semua domain Anda dengan sertifikat SSL gratis dari Let's Encrypt.

### 7.1. Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 7.2. Dapatkan Sertifikat SSL

Jalankan Certbot dan ikuti instruksi di layar. Certbot akan secara otomatis mengedit konfigurasi Nginx Anda untuk mengaktifkan HTTPS.

```bash
sudo certbot --nginx -d yourdomain.com -d app.yourdomain.com -d admin.yourdomain.com -d api.yourdomain.com
```

Certbot juga akan mengatur pembaruan sertifikat secara otomatis.

## 8. Finalisasi

Pada tahap ini, aplikasi Rekberkan Anda seharusnya sudah berjalan di lingkungan produksi yang aman dan dapat diakses melalui domain Anda dengan HTTPS.

- **Landing Page**: `https://yourdomain.com`
- **Aplikasi**: `https://app.yourdomain.com`
- **Admin Panel**: `https://admin.yourdomain.com`
- **API**: `https://api.yourdomain.com`

Untuk memantau aplikasi Anda, gunakan perintah `pm2 monit`.

---


**Selesai!** Anda telah berhasil melakukan deployment!**


---

## Appendix A: Konfigurasi Environment Lengkap Backend

Berikut adalah contoh lengkap file `.env.production` untuk backend:

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

# ENCRYPTION KEYS (Generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
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

### Masalah Umum dan Solusinya

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `EADDRINUSE: address already in use` | Port sudah digunakan | `fuser -k 3000/tcp` atau ganti port |
| `Cannot connect to database` | PostgreSQL tidak berjalan | `sudo systemctl start postgresql` |
| `Redis connection refused` | Redis tidak berjalan | `sudo systemctl start redis-server` |
| `502 Bad Gateway` | Backend tidak berjalan | Cek `pm2 status` dan restart jika perlu |
| `SSL certificate error` | Sertifikat expired | `sudo certbot renew` |
| `CORS error` | Domain tidak di whitelist | Tambahkan domain ke `CORS_ORIGIN` |

### Perintah Berguna

```bash
# Cek status semua services
pm2 status
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx

# Lihat log aplikasi
pm2 logs rekberkan-backend
pm2 logs rekberkan-frontend

# Restart aplikasi
pm2 restart rekberkan-backend
pm2 restart rekberkan-frontend

# Restart semua services
sudo systemctl restart postgresql
sudo systemctl restart redis-server
sudo systemctl restart nginx
```

---

## Appendix C: Checklist Deployment

Gunakan checklist ini untuk memastikan deployment Anda lengkap:

- [ ] Server Ubuntu 22.04 sudah siap
- [ ] User non-root dengan sudo sudah dibuat
- [ ] Firewall (UFW) sudah dikonfigurasi
- [ ] Node.js, pnpm, PM2 sudah terinstall
- [ ] PostgreSQL sudah terinstall dan dikonfigurasi
- [ ] Redis sudah terinstall dan diamankan dengan password
- [ ] Nginx sudah terinstall
- [ ] Repository sudah di-clone
- [ ] Backend dependencies sudah terinstall
- [ ] Backend .env.production sudah dikonfigurasi
- [ ] Database sudah di-migrate
- [ ] Backend sudah di-build
- [ ] Frontend dependencies sudah terinstall
- [ ] Frontend .env.production sudah dikonfigurasi
- [ ] Frontend sudah di-build
- [ ] Nginx sudah dikonfigurasi sebagai reverse proxy
- [ ] Backend berjalan dengan PM2
- [ ] Frontend berjalan dengan PM2
- [ ] PM2 startup sudah dikonfigurasi
- [ ] SSL certificate sudah terinstall
- [ ] Semua domain bisa diakses dengan HTTPS

---

**Dokumen ini dibuat berdasarkan testing langsung pada Ubuntu 22.04 dan mencakup semua langkah yang diperlukan untuk deployment produksi yang sukses.**

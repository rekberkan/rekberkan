# Panduan Deployment Aplikasi Kahade di Ubuntu 22.04

Dokumen ini menjelaskan langkah-langkah untuk melakukan deployment aplikasi Kahade (Frontend & Backend) pada server VPS dengan sistem operasi Ubuntu 22.04.

**Penulis**: Manus AI
**Tanggal**: 25 Januari 2026

---

## Daftar Isi

1.  [Prasyarat](#1-prasyarat)
2.  [Langkah 1: Konfigurasi Server Awal](#2-langkah-1-konfigurasi-server-awal)
3.  [Langkah 2: Instalasi Dependensi](#3-langkah-2-instalasi-dependensi)
    *   [Node.js & pnpm](#nodejs--pnpm)
    *   [PostgreSQL](#postgresql)
    *   [Redis](#redis)
    *   [Nginx](#nginx)
    *   [PM2](#pm2)
4.  [Langkah 3: Konfigurasi Database](#4-langkah-3-konfigurasi-database)
5.  [Langkah 4: Deployment Backend](#5-langkah-4-deployment-backend)
6.  [Langkah 5: Deployment Frontend](#6-langkah-5-deployment-frontend)
7.  [Langkah 6: Konfigurasi Nginx](#7-langkah-6-konfigurasi-nginx)
8.  [Langkah 7: Konfigurasi SSL dengan Let's Encrypt](#8-langkah-7-konfigurasi-ssl-dengan-lets-encrypt)
9.  [Langkah 8: Menjalankan Aplikasi](#9-langkah-8-menjalankan-aplikasi)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prasyarat

-   Server VPS dengan **Ubuntu 22.04 LTS**.
-   Akses root atau user dengan `sudo` privileges.
-   Domain dan subdomain yang sudah di-pointing ke IP server Anda:
    -   `domain.com` (untuk landing page)
    -   `app.domain.com` (untuk aplikasi user)
    -   `admin.domain.com` (untuk panel admin)
    -   `api.domain.com` (untuk backend API)

## 2. Langkah 1: Konfigurasi Server Awal

1.  **Update Sistem**

    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Buat User Baru (Recommended)**

    ```bash
    adduser deployer
    usermod -aG sudo deployer
    su - deployer
    ```

3.  **Konfigurasi Firewall (UFW)**

    ```bash
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    ```

## 3. Langkah 2: Instalasi Dependensi

### Node.js & pnpm

```bash
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh

# Aktifkan pnpm (mungkin perlu logout dan login kembali)
source ~/.bashrc
```

### PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Redis

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### PM2

PM2 adalah process manager untuk aplikasi Node.js.

```bash
sudo npm install -g pm2
```

## 4. Langkah 3: Konfigurasi Database

1.  Masuk ke shell PostgreSQL.

    ```bash
    sudo -u postgres psql
    ```

2.  Buat database dan user untuk aplikasi Kahade. Ganti `STRONG_PASSWORD_HERE` dengan password yang aman.

    ```sql
    CREATE DATABASE kahade_prod;
    CREATE USER kahade_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
    GRANT ALL PRIVILEGES ON DATABASE kahade_prod TO kahade_user;
    \q
    ```

## 5. Langkah 4: Deployment Backend

1.  **Clone Repository**

    ```bash
    git clone https://github.com/rekberkan/rekberkan.git
    cd rekberkan/kahade-backend
    ```

2.  **Install Dependencies**

    ```bash
    pnpm install
    ```

3.  **Konfigurasi Environment**

    Salin file `.env.example` dan sesuaikan isinya.

    ```bash
    cp .env.production .env
    nano .env
    ```

    Pastikan Anda mengisi semua variabel yang dibutuhkan, terutama:

    -   `DATABASE_URL`
    -   `JWT_SECRET` & `JWT_REFRESH_SECRET` (gunakan `openssl rand -base64 64` untuk generate)
    -   `REDIS_PASSWORD` (jika ada)
    -   `CORS_ORIGIN` (contoh: `https://domain.com,https://app.domain.com,https://admin.domain.com`)
    -   Kunci API untuk layanan eksternal (Midtrans, dll.)

4.  **Jalankan Migrasi Database**

    ```bash
    pnpm prisma migrate deploy
    ```

5.  **Build Aplikasi**

    ```bash
    pnpm build
    ```

6.  **Jalankan dengan PM2**

    ```bash
    pm2 start dist/main.js --name kahade-api
    pm2 save
    pm2 startup
    ```

## 6. Langkah 5: Deployment Frontend

1.  **Navigasi ke Folder Frontend**

    ```bash
    cd ../kahade-frontend
    ```

2.  **Install Dependencies**

    ```bash
    pnpm install
    ```

3.  **Konfigurasi Environment**

    Buat file `.env.production` dan sesuaikan isinya. Ganti `domain.com` dengan domain Anda.

    ```bash
    cp .env.production .env
    nano .env
    ```

    Isi file `.env`:

    ```env
    VITE_API_URL=https://api.domain.com/api/v1
    VITE_BASE_DOMAIN=domain.com
    VITE_LANDING_URL=https://domain.com
    VITE_APP_URL=https://app.domain.com
    VITE_ADMIN_URL=https://admin.domain.com
    VITE_COOKIE_DOMAIN=.domain.com
    ```

4.  **Build Semua Frontend**

    Script ini akan membuat tiga folder build: `dist/landing`, `dist/app`, dan `dist/admin`.

    ```bash
    pnpm build
    ```

5.  **Pindahkan Hasil Build ke Web Root**

    Buat folder untuk setiap subdomain di direktori web root Nginx.

    ```bash
    sudo mkdir -p /var/www/kahade/landing
    sudo mkdir -p /var/www/kahade/app
    sudo mkdir -p /var/www/kahade/admin

    sudo cp -r dist/landing/* /var/www/kahade/landing/
    sudo cp -r dist/app/* /var/www/kahade/app/
    sudo cp -r dist/admin/* /var/www/kahade/admin/

    sudo chown -R www-data:www-data /var/www/kahade
    ```

## 7. Langkah 6: Konfigurasi Nginx

Buat satu file konfigurasi Nginx untuk menangani semua subdomain.

```bash
sudo nano /etc/nginx/sites-available/kahade
```

Salin dan tempel konfigurasi berikut. **Jangan lupa ganti `domain.com` dengan domain Anda.**

```nginx
# Backend API Server (api.domain.com)
server {
    listen 80;
    server_name api.domain.com;

    location / {
        proxy_pass http://localhost:3001; # Port backend NestJS
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

# Landing Page (domain.com)
server {
    listen 80;
    server_name domain.com;

    root /var/www/kahade/landing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# User App (app.domain.com)
server {
    listen 80;
    server_name app.domain.com;

    root /var/www/kahade/app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Admin Panel (admin.domain.com)
server {
    listen 80;
    server_name admin.domain.com;

    root /var/www/kahade/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Aktifkan konfigurasi ini:

```bash
sudo ln -s /etc/nginx/sites-available/kahade /etc/nginx/sites-enabled/
sudo nginx -t # Test konfigurasi
sudo systemctl restart nginx
```

## 8. Langkah 7: Konfigurasi SSL dengan Let's Encrypt

1.  **Install Certbot**

    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    ```

2.  **Dapatkan Sertifikat SSL**

    Jalankan perintah berikut dan ikuti instruksi di layar. Certbot akan otomatis mendeteksi domain dari file konfigurasi Nginx Anda dan mengeditnya untuk HTTPS.

    ```bash
    sudo certbot --nginx -d domain.com -d app.domain.com -d admin.domain.com -d api.domain.com
    ```

3.  **Verifikasi Auto-Renewal**

    Certbot akan otomatis memperbarui sertifikat. Anda bisa melakukan dry run untuk memastikannya.

    ```bash
    sudo certbot renew --dry-run
    ```

## 9. Langkah 8: Menjalankan Aplikasi

Pada titik ini, semua layanan seharusnya sudah berjalan.

-   **Backend**: Dijalankan oleh PM2.
-   **Frontend**: Disajikan oleh Nginx.
-   **Database & Redis**: Berjalan sebagai service systemd.

Anda bisa memeriksa status PM2 dengan:

```bash
pm2 status
```

Buka browser Anda dan akses:

-   `https://domain.com`
-   `https://app.domain.com`
-   `https://admin.domain.com`

## 10. Troubleshooting

-   **502 Bad Gateway**: Cek status backend dengan `pm2 logs kahade-api`. Pastikan backend berjalan dan tidak ada error saat start.
-   **CORS Error**: Pastikan variabel `CORS_ORIGIN` di file `.env` backend sudah benar dan menyertakan semua subdomain frontend.
-   **Nginx Error**: Cek log Nginx di `/var/log/nginx/error.log`.
-   **Permission Denied**: Pastikan user `www-data` memiliki hak akses baca ke folder `/var/www/kahade`.

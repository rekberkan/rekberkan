# Production Deployment Guide (VPS Ubuntu 22.04)

Panduan ini menjelaskan langkah-langkah _end-to-end_ untuk deployment **Kahade** di VPS Ubuntu 22.04 dengan praktik keamanan produksi. Panduan mencakup backend (API), frontend (landing/app/admin), database, reverse proxy (Nginx), SSL, dan process manager (PM2).

> **Catatan**: Pastikan domain sudah mengarah ke IP VPS (A/AAAA record) sebelum memasang SSL.

---

## 1) Prasyarat VPS

### 1.1 Update server & paket dasar

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl ufw unzip
```

### 1.2 Buat user non-root + SSH hardening (opsional)

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

Login sebagai user `deploy`, dan pastikan SSH key sudah terpasang:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 1.3 Konfigurasi firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 2) Instalasi Runtime

### 2.1 Instal Node.js (disarankan 20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 2.2 Instal PM2 & Yarn

```bash
sudo npm install -g pm2 yarn
pm2 -v
yarn -v
```

> **Catatan**: Backend menggunakan `yarn` pada script deploy. Frontend menggunakan `npm`.

---

## 3) Persiapan Database & Redis

### 3.1 PostgreSQL (contoh lokal di VPS)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Buat user & database (ganti `STRONG_PASSWORD`):

```bash
sudo -u postgres psql <<'SQL'
CREATE USER kahade_prod WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD';
CREATE DATABASE kahade_production OWNER kahade_prod;
\q
SQL
```

### 3.2 Redis (opsional tapi disarankan)

```bash
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
```

> Untuk produksi, aktifkan password + TLS (lihat `.env.example`).

---

## 4) Clone Repository

```bash
git clone https://github.com/rekberkan/kahade.git
cd kahade
```

Struktur utama:
- `kahade-backend` (API)
- `kahade-frontend` (landing/app/admin + server SSR/SPA)

---

## 5) Konfigurasi Environment Variables

### 5.1 Backend

```bash
cd ~/kahade/kahade-backend
cp .env.example .env.production
nano .env.production
```

Pastikan variabel penting terisi:
- `NODE_ENV=production`
- `APP_URL`, `FRONTEND_URL` **HTTPS**
- `DATABASE_URL` memakai TLS/SSL
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` kuat
- `REDIS_*` (jika pakai Redis)
- `PAYMENT_*`, `MAIL_*` untuk integrasi payment/email
- `ENABLE_SWAGGER=false`

### 5.2 Frontend

Gunakan file template:

```bash
cd ~/kahade/kahade-frontend
cp env.production.template.txt .env.production
nano .env.production
```

> Pastikan base URL API mengarah ke domain API (HTTPS).

---

## 6) Build & Run Backend (PM2)

### 6.1 Instal dependencies + build

```bash
cd ~/kahade/kahade-backend
yarn install --production=false
yarn prisma:generate
yarn prisma:migrate deploy
yarn build
```

### 6.2 Jalankan dengan PM2

```bash
pm2 start deploy/pm2.config.js
pm2 save
pm2 startup
```

> PM2 config default menjalankan di port **3000**.

---

## 7) Build & Run Frontend (PM2)

### 7.1 Build

```bash
cd ~/kahade/kahade-frontend
npm install
npm run build
npm run build:server
```

### 7.2 Jalankan server frontend

Server frontend adalah Express (lihat `server/index.ts`) dan menjalankan file `dist/index.js`.

Buat file PM2 untuk frontend:

```bash
cat <<'EOF_PM2' > ~/kahade/kahade-frontend/pm2.frontend.config.cjs
module.exports = {
  apps: [
    {
      name: 'kahade-frontend',
      script: 'dist/index.js',
      cwd: '/home/deploy/kahade/kahade-frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
EOF_PM2
```

Jalankan:

```bash
cd ~/kahade/kahade-frontend
pm2 start pm2.frontend.config.cjs
pm2 save
```

> Sesuaikan `PORT` jika dibutuhkan.

---

## 8) Konfigurasi Nginx (Reverse Proxy)

### 8.1 API (backend)

Gunakan file yang sudah disediakan:

```bash
sudo cp ~/kahade/kahade-backend/deploy/nginx.conf /etc/nginx/nginx.conf
```

Periksa `server_name` dan upstream `api` di file tersebut:

- `server_name` harus sesuai domain
- `upstream api` harus menunjuk ke host backend (contoh `127.0.0.1:3000` jika backend di VPS yang sama)

> Jika backend berjalan di VPS yang sama, ubah bagian upstream menjadi:
>
> ```nginx
> upstream api {
>   least_conn;
>   server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
>   keepalive 32;
> }
> ```

### 8.2 Frontend (landing/app/admin)

Tambahkan server block untuk frontend. Contoh `/etc/nginx/sites-available/kahade-frontend`:

```nginx
server {
    listen 80;
    server_name kahade.com www.kahade.com app.kahade.com admin.kahade.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        include /etc/nginx/proxy_params;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/kahade-frontend /etc/nginx/sites-enabled/kahade-frontend
sudo nginx -t
sudo systemctl restart nginx
```

---

## 9) SSL/TLS dengan Let’s Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kahade.com -d www.kahade.com -d app.kahade.com -d admin.kahade.com -d api.kahade.com
```

Auto-renew:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## 10) Deployment Update (Backend)

Gunakan script deploy:

```bash
cd ~/kahade/kahade-backend
./deploy/deploy.sh
```

Script akan melakukan:
1. `git pull`
2. `yarn install`
3. `prisma:generate`
4. `prisma:migrate deploy`
5. `yarn build`
6. `pm2 reload`

---

## 11) Observability & Monitoring

### 11.1 PM2

```bash
pm2 status
pm2 logs kahade-api
pm2 logs kahade-frontend
```

### 11.2 Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 12) Backup & Recovery (Checklist)

- **Database**: jadwalkan `pg_dump` harian
- **Uploads**: backup lokasi `UPLOAD_DEST` (atau bucket cloud)
- **Secrets**: simpan di secret manager (Vault/SSM/Secrets Manager)
- **Rollback**: gunakan git tag/commit sebelumnya

---

## 13) Troubleshooting Cepat

- **502 Bad Gateway**: cek PM2 & port backend (`pm2 status`, `pm2 logs`)
- **SSL error**: cek `certbot renew` dan `nginx -t`
- **DB connect error**: cek `DATABASE_URL` dan akses jaringan
- **CORS error**: pastikan `CORS_ORIGIN` berisi domain frontend

---

## Referensi Internal

- Backend deploy script: `kahade-backend/deploy/deploy.sh`
- PM2 backend config: `kahade-backend/deploy/pm2.config.js`
- Nginx config: `kahade-backend/deploy/nginx.conf`
- Backend env template: `kahade-backend/.env.example`
- Frontend env template: `kahade-frontend/env.production.template.txt`

# Runbook Operasional: Proyek KAHade

**Tanggal:** 28 Januari 2026

Dokumen ini berisi panduan teknis untuk deployment, monitoring, dan pemeliharaan aplikasi KAHade.

## 1. Persiapan Lingkungan

### 1.1. Kebutuhan Sistem

- **Server**: Ubuntu 22.04 LTS atau yang kompatibel.
- **Runtime**: Node.js v18.x atau lebih tinggi, Docker, Docker Compose.
- **Database**: PostgreSQL v14 atau lebih tinggi (atau database lain yang kompatibel dengan Prisma).
- **Reverse Proxy**: Nginx atau Caddy (direkomendasikan untuk SSL).

### 1.2. Konfigurasi Environment Variables (`.env`)

Buat file `.env` di root direktori `kahade-backend` dengan variabel berikut:

```
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

# Xendit API Keys & Tokens
XENDIT_API_KEY="..."
XENDIT_WEBHOOK_VERIFICATION_TOKEN="..."

# Application
NODE_ENV="production"
PORT=3000

# Frontend URLs (for CORS)
FRONTEND_APP_URL="https://app.domain.com"
FRONTEND_ADMIN_URL="https://admin.domain.com"
FRONTEND_LANDING_URL="https://domain.com"
```

## 2. Proses Deployment

### 2.1. Backend (`kahade-backend`)

Metode yang direkomendasikan adalah menggunakan Docker.

1. **Build Docker Image**:
   ```bash
   cd /path/to/kahade-backend
   docker build -t kahade-backend:latest .
   ```

2. **Jalankan Database Migration**:
   Sebelum menjalankan aplikasi untuk pertama kali, jalankan migrasi Prisma.
   ```bash
   npx prisma migrate deploy
   ```

3. **Jalankan Aplikasi**:
   Gunakan Docker Compose (lihat `docker-compose.yml` sebagai referensi) atau jalankan container secara manual.
   ```bash
   docker run -d --name kahade-backend -p 3000:3000 --env-file .env kahade-backend:latest
   ```

### 2.2. Frontend (`kahade-frontend`)

1. **Konfigurasi Environment**:
   Buat file `.env.production` di root `kahade-frontend/client`.
   ```
   VITE_API_URL="https://api.domain.com"
   VITE_APP_URL="https://app.domain.com"
   VITE_ADMIN_URL="https://admin.domain.com"
   VITE_LANDING_URL="https://domain.com"
   ```

2. **Build Aplikasi React**:
   ```bash
   cd /path/to/kahade-frontend/client
   npm install
   npm run build
   ```

3. **Serve Static Files**:
   Salin konten dari direktori `dist` ke root direktori web server Anda (e.g., `/var/www/html`). Konfigurasikan Nginx atau web server lain untuk menyajikan file statis ini dan menangani *client-side routing*.

   Contoh konfigurasi Nginx:
   ```nginx
   server {
       listen 80;
       server_name app.domain.com;

       root /var/www/app;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 3. Monitoring & Pemeliharaan

### 3.1. Health Check

Backend menyediakan endpoint health check yang dapat digunakan oleh *load balancer* atau sistem monitoring.

- **URL**: `https://api.domain.com/health`
- **Respon Sukses**: `200 OK` dengan status komponen (database, dll.).

### 3.2. Logging

Log aplikasi (termasuk error) akan dicetak ke `stdout` dan `stderr` di dalam container Docker. Gunakan perintah `docker logs` untuk melihatnya.

```bash
docker logs -f kahade-backend
```

Untuk logging terpusat, konfigurasikan Docker log driver untuk mengirim log ke layanan seperti ELK Stack, Graylog, atau Datadog.

### 3.3. Backup Database

Gunakan `pg_dump` untuk membuat backup rutin dari database PostgreSQL.

```bash
pg_dump -U <user> -h <host> <database> | gzip > backup_`date +%Y%m%d`.sql.gz
```

Jalankan perintah ini sebagai cron job harian.

## 4. Prosedur Darurat

### 4.1. Rollback Deployment

- **Backend**: Jika deployment baru menyebabkan masalah, hentikan container baru dan jalankan kembali image Docker versi sebelumnya yang stabil.
- **Frontend**: Ganti file di direktori web server dengan konten dari build stabil sebelumnya.

### 4.2. Penanganan Kegagalan Webhook

`XenditWebhookController` menyimpan setiap event webhook yang masuk ke dalam tabel `WebhookEvent`. Jika terjadi kegagalan pemrosesan, statusnya akan ditandai sebagai `FAILED`.

1. **Identifikasi Kegagalan**: Query tabel `WebhookEvent` untuk status `FAILED`.
   ```sql
   SELECT * FROM "WebhookEvent" WHERE status = 'FAILED' ORDER BY "createdAt" DESC;
   ```
2. **Analisis Penyebab**: Periksa kolom `processingError` untuk mengetahui penyebab kegagalan.
3. **Proses Ulang (Manual)**: Setelah memperbaiki masalah, event dapat diproses ulang secara manual dengan memanggil logika service yang relevan dengan data dari kolom `payload`.

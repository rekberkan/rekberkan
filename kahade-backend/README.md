# Kahade Backend - Rekberkan P2P Escrow Platform

Backend API untuk platform escrow P2P Rekberkan, dibangun dengan NestJS, Prisma, dan PostgreSQL.

## Tech Stack

- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (HttpOnly Cookies)

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Start development server
pnpm run start:dev
```

## API Configuration

### API Prefix

API menggunakan versioning melalui NestJS `@Version()` decorator. Konfigurasi:

```env
# ⚠️ PENTING: Jangan sertakan versi di API_PREFIX
# Versioning ditangani oleh NestJS secara otomatis
API_PREFIX=api
```

Endpoint akan tersedia di: `http://localhost:3000/api/v1/...`

## Authentication

### Password Requirements

Password harus memenuhi kriteria keamanan berikut:

| Kriteria | Requirement |
|----------|-------------|
| Panjang Minimum | 8 karakter |
| Panjang Maksimum | 128 karakter |
| Huruf Besar | Minimal 1 karakter (A-Z) |
| Huruf Kecil | Minimal 1 karakter (a-z) |
| Angka | Minimal 1 karakter (0-9) |
| Simbol | Minimal 1 karakter (!@#$%^&*) |

**Contoh Password Valid:**
```
SecureP@ssw0rd!2024
MyStr0ng#Pass!
Test123!@#Secure
```

**Contoh Password Invalid:**
```
password123      # Tidak ada huruf besar dan simbol
PASSWORD123!     # Tidak ada huruf kecil
Secure123        # Tidak ada simbol
Short1!          # Kurang dari 8 karakter
```

### Register Endpoint

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username123",
  "password": "SecureP@ssw0rd!2024"
}
```

### Login Endpoint

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!2024"
}
```

Response akan menyertakan HttpOnly cookies:
- `rekberkan_access_token` - JWT access token (15 menit)
- `rekberkan_refresh_token` - JWT refresh token (7 hari)
- `XSRF-TOKEN` - CSRF protection token

## Database

### Migrations

```bash
# Generate migration dari schema changes
pnpm prisma migrate dev --name migration_name

# Apply migrations ke database
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset

# View database dengan Prisma Studio
pnpm prisma studio
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm run start:dev` | Start development server dengan hot reload |
| `pnpm run build` | Build untuk production |
| `pnpm run start:prod` | Start production server |
| `pnpm run test` | Run unit tests |
| `pnpm run lint` | Run ESLint |
| `pnpm prisma migrate deploy` | Apply database migrations |
| `pnpm prisma generate` | Generate Prisma client |

## Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang diperlukan.

**Variabel Penting:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public

# JWT (Generate dengan: openssl rand -base64 64)
JWT_SECRET=your-64-char-secret
JWT_REFRESH_SECRET=your-different-64-char-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# API
API_PREFIX=api
PORT=3000
```

## License

MIT

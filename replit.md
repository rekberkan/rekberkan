# Kahade - P2P Escrow Platform

## Overview

Kahade is a secure peer-to-peer escrow platform with blockchain integration for transparent and trusted transactions. The project consists of two main applications:

- **kahade-backend**: NestJS API server with PostgreSQL, Redis, and payment gateway integrations
- **kahade-frontend**: React SPA with Vite, featuring glassmorphic "Blockchain Clarity" design system

The platform enables users to create escrow transactions, manage disputes, handle KYC verification, and process payments through integrated gateways (Midtrans, Xendit).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend (NestJS)

**Framework & Language**: NestJS 10 with TypeScript 5, following modular architecture with clear separation of concerns.

**Database Layer**: PostgreSQL 16 with Prisma ORM. Schema includes users, transactions, wallets, disputes, KYC records, and audit logs. Uses BigInt for monetary values (minor units) to avoid floating-point issues.

**Caching & Queues**: Redis 7 for caching and Bull queues for background jobs (email, notifications, withdrawals). Queue processors handle async operations like email sending and notification creation.

**Authentication**: JWT-based auth with refresh tokens, Passport.js strategies (local, JWT). MFA support with TOTP. Bank-grade security including rate limiting, CSRF protection, and encryption services.

**Core Modules**:
- `core/auth` - Authentication and authorization
- `core/user` - User management
- `core/transaction` - Escrow transaction handling
- `core/wallet` - Balance management
- `core/dispute` - Dispute resolution
- `core/kyc` - Identity verification
- `core/payment` - Payment processing

**Integrations**:
- Payment gateways: Midtrans, Xendit with webhook handling
- Email: Nodemailer for notifications
- Blockchain: Web3.js/Ethers.js for transaction recording

**Security Features**:
- Rate limiting with tiered limits for different endpoint types
- Idempotency guards for financial operations
- Request signature verification for webhooks
- PII sanitization in error responses
- Audit logging for compliance

### Frontend (React + Vite)

**Framework**: React 19 with TypeScript, Vite build tool, Wouter for routing.

**UI Components**: shadcn/ui with Radix primitives, Tailwind CSS 4, Framer Motion for animations.

**Design System**: "Blockchain Clarity" - glassmorphic theme with Deep Indigo primary (#4338CA), Cyan accent (#22D3EE). Typography uses Outfit (display), Inter (body), JetBrains Mono (data).

**Theme System**: Supports light, dark, and system (auto-detect) modes via ThemeContext. Theme preference stored in localStorage with key "kahade-theme". Default is "system" mode which auto-detects user's OS preference. ThemeToggle component available in Navbar, DashboardLayout, and AdminLayout.

**URL Structure** (designed for future subdomain support):
- `/` - Landing pages (kahade.com): Home, About, How It Works, Contact
- `/app/*` - User Dashboard (app.kahade.com): Transactions, Wallet, Notifications, Profile, Settings
- `/admin/*` - Admin Dashboard (admin.kahade.com): Users, Transactions, Disputes, Audit Logs, Settings
- `/login`, `/register`, `/forgot-password` - Auth pages

**Server**: Express server for production serving with SPA routing support.

### Path Aliases

Backend uses `@/`, `@core/`, `@common/`, `@config/`, `@infrastructure/`, `@integrations/`, `@security/`, `@api/` aliases configured in tsconfig.json.

Frontend uses `@/` for `./client/src/*` and `@shared/*` for shared code.

## External Dependencies

### Database
- **PostgreSQL 16**: Primary database via Prisma ORM
- **Redis 7**: Caching, session storage, and Bull queue backend

### Payment Gateways
- **Midtrans**: Indonesian payment gateway with webhook verification
- **Xendit**: Alternative payment processor with signature validation

### Email
- **Nodemailer**: SMTP email sending (default: Gmail SMTP)

### Blockchain
- **Web3.js / Ethers.js**: Ethereum blockchain integration for transaction transparency

### Infrastructure
- **Bull**: Redis-based job queue for background processing
- **PM2**: Process manager for production deployment
- **Nginx**: Reverse proxy (production deployment configs included)

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Authentication secrets
- `MAIL_*`: Email service configuration
- `PAYMENT_GATEWAY_*`: Payment gateway credentials
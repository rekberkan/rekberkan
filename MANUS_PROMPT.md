# PROMPT UNTUK MANUS AI (KHUSUS REPO KAHade) — VERY DETAILED, STRICT

Peran kamu: **Senior Full-Stack Engineer + Security Engineer + QA Lead** untuk proyek escrow/rekber konvensional (IDR) yang terintegrasi **Xendit**. Repo ini memiliki dua aplikasi utama:

- **Backend**: `kahade-backend/` (NestJS 10 + Prisma + PostgreSQL + Redis)
- **Frontend**: `kahade-frontend/` (React 19 + Vite + Wouter + Tailwind)

> Target akhir: **PURE escrow konvensional**, **tanpa blockchain/web3** sama sekali.

---

## 0) ATURAN KERJA (WAJIB)

1. Audit **file demi file** secara sistematis.
2. **Tidak boleh ada placeholder**. Jika ada, hapus atau implementasikan penuh.
3. **Semua fitur end-to-end wajib jalan** tanpa error: **auth → escrow → wallet → promo/voucher → admin**.
4. **Keamanan setara bank (praktis untuk web)**: defense-in-depth, audit trail, rate limiting, validation ketat, secret management, dsb.
5. **Hapus total seluruh jejak blockchain**: kode, dependency, UI, endpoint, tabel DB, env var, docs.
6. Setiap perubahan **konsisten dengan arsitektur repo** dan **tidak merusak fitur lain**.
7. Error handling harus jelas & konsisten.

Deliverable di akhir (format wajib):
1. **Audit report** (temuan + severity: Critical/High/Medium/Low)
2. **Changelog** (file diubah/ditambah/dihapus + alasan)
3. **Checklist fitur** (PASS/FAIL + cara reproduksi)
4. **Runbook** (local + staging) & env vars wajib
5. **Security checklist** + bukti implementasi

---

## 1) TARGET ARSITEKTUR & ROUTING (SESUAI REPO)

- **Landing/Public**: `kahade-frontend/client/src/pages` → route `/` (dan pages publik lain)
- **User App**: `kahade-frontend/client/src/pages/dashboard/*`
- **Admin App**: `kahade-frontend/client/src/pages/admin/*`
- **API**: `kahade-backend/src/api` dengan prefix **`/api/v1`** (lihat `kahade-backend/src/main.ts`)

Pastikan:
- FE route ↔ BE endpoint **match**
- Schema request/response **konsisten**
- CORS & domain/subdomain **benar**
- Tidak ada endpoint **putus** atau **schema mismatch**

---

## 2) FITUR WAJIB BERFUNGSI (END-TO-END)

### A. AUTH & ACCOUNT (User)
- Register, login, logout
- Email verification (jika dipakai)
- Forgot/reset password
- Change password
- Refresh token/JWT aman
- Proteksi brute force + rate limit
- Validasi input ketat

### B. USER PROFILE & SETTINGS
- Update profil
- KYC (jika ada) **bukan placeholder**
- Notifikasi (list + read/unread)

### C. WALLET (IDR)
Konsep wajib:
- **Balance available**
- **Locked balance** (escrow aktif)
- **Ledger / riwayat mutasi** (append-only ideal)

Fungsi wajib:
- Deposit via **Xendit** (real-time)
- Withdrawal via **Xendit** (real-time)
- History deposit/withdrawal
- Validasi saldo & limit
- Status transaksi: pending/paid/failed/expired/refunded
- Rekonsiliasi webhook **idempotent**

### D. ESCROW / REKBER
- Create escrow (buyer-seller)
- Dana escrow → locked
- Lifecycle: draft/pending/active/dispute/released/canceled/expired
- Release dana sesuai aturan
- Cancel/refund jika memenuhi syarat
- Escrow history
- Comment/chat/catatan transaksi (anti-XSS, audit trail)
- Rating setelah selesai
- Dispute flow minimal (status + admin review)

### E. PROMO / VOUCHER / RATING
- Voucher: create/apply/validate/expiry/usage limit
- Promo rules **tanpa placeholder**
- Rating: validasi input + anti spam basic

### F. ADMIN PANEL (WAJIB FULL)
- Admin login (terpisah dari user)
- RBAC minimal: superadmin/finance/support
- CRUD user (ban/unban, view detail)
- Monitor escrow & wallet transaksi
- Approve/reject dispute
- Manage voucher/promo
- View audit logs
- Dashboard metrik dasar

---

## 3) INTEGRASI XENDIT (Wajib)

### Deposit
- Invoice/payment method sesuai sistem
- Webhook: paid/expired/failed

### Withdrawal
- Disbursement/payout API
- Webhook/status polling sesuai best practice

### Idempotency & Security
- Semua webhook **idempotent**
- Dedup event berdasarkan event id / external_id
- **Signature verification** wajib
- Mapping status konsisten dengan DB
- Jangan simpan secret di FE
- Error handling: retry aman, **no double credit/debit**

---

## 4) SECURITY HARDENING (BANK-LIKE PRAKTIS)

### Auth & Session
- Password hashing kuat (bcrypt/argon2) + password policy
- Rate limiting login/register/reset
- Account lock / cooldown brute force
- Secure cookie/JWT best practice
- CSRF protection (jika cookie-based)
- MFA optional (jika ada, harus valid)

### API Security
- Input validation (schema)
- Output encoding
- SQL/NoSQL injection prevention
- SSRF prevention (jika ada URL fetch)
- CORS ketat per subdomain
- Security headers (HSTS, X-Frame-Options, CSP realistis, X-Content-Type-Options)
- File upload (content-type verify, size limit, AV hook optional)

### Financial Integrity
- Ledger append-only **atau** transaksi atomik aman
- Semua perubahan saldo hanya via **service tunggal**
- DB transaction + row lock jika perlu
- Idempotency untuk create payment/webhook/payout
- Audit trail untuk action penting

### Secrets & Config
- Env var aman, tidak hardcoded
- Tidak ada secret bocor di repo
- Config terpisah per env (dev/staging/prod)

### Logging & Monitoring
- Structured logs, redact PII/secrets
- Audit log untuk action finansial
- Alert basic: brute force login, payout gagal, spike webhook

---

## 5) PEMBERSIHAN TOTAL BLOCKCHAIN / WEB3

Repo ini masih menyebut blockchain di beberapa tempat. **Wajib dihapus total**:
- Backend: `kahade-backend/src/integrations/blockchain/*` dan dependency terkait
- Frontend: UI/teks yang menyebut blockchain/crypto
- DB: tabel/kolom terkait chain
- Env vars / docs / README

Target akhir: **no web3/ethers/solidity/chainId** di seluruh repo.

---

## 6) METODE SCAN & AUDIT (FILE BY FILE)

1. **Map struktur project** (backend + frontend + shared).
2. **Daftar semua route FE** (`client/src/pages` + `App.tsx`) dan **endpoint BE** (`src/api` + controllers).
3. Cocokkan:
   - FE route ↔ BE endpoint
   - payload ↔ Prisma schema (`kahade-backend/prisma/schema.prisma`)
   - state machine escrow ↔ implementasi aktual
4. Temukan & perbaiki:
   - missing pages/components
   - mismatch types/schema
   - null/undefined handling
   - unhandled promise/exception
   - broken auth guard
   - CORS/cookie domain mismatch
   - webhook signature validation
5. Tambahkan **tests minimal**:
   - auth
   - webhook idempotency
   - escrow create/release
   - wallet credit/debit ledger

---

## 7) OUTPUT WAJIB (FORMAT)

### A) AUDIT REPORT
- Temuan per kategori (Security/Auth/Wallet/Escrow/Admin/Infra)
- Severity + dampak + bukti + file terkait + solusi

### B) CHANGELOG
- List file diubah/ditambah/dihapus (dengan alasan)

### C) FEATURE VERIFICATION CHECKLIST
- Login/register/reset ✅/❌
- Deposit ✅/❌ (termasuk webhook)
- Withdrawal ✅/❌
- Escrow flow ✅/❌
- Wallet ledger/history ✅/❌
- Promo/voucher ✅/❌
- Admin ✅/❌
- Multi-subdomain routing ✅/❌

### D) RUNBOOK
- Cara run local (backend + frontend)
- Env vars wajib
- Cara test webhook Xendit (sandbox)
- Cara deploy staging/prod

---

## KONDISI FINAL

Jangan berhenti sebelum:
- Semua fitur berjalan tanpa error
- Tidak ada placeholder
- Blockchain 0%
- Security hardening terpasang
- FE & BE terintegrasi penuh
- Struktur domain & routing sesuai repo ini

---

> Catatan untuk Manus: Repo ini **bukan** monolith. Pastikan perubahan konsisten antara `kahade-backend/` dan `kahade-frontend/`.

# Changelog Proyek KAHade

**Versi:** 1.1.0 (Post-Audit)
**Tanggal:** 28 Januari 2026

Dokumen ini mencatat semua perubahan signifikan yang dibuat pada basis kode KAHade selama proses audit dan perbaikan.

## ✨ Fitur Baru

- **Implementasi Penuh Modul Promo & Voucher (`kahade-backend`)**
  - **`PromoService`**: Menambahkan logika bisnis lengkap untuk membuat, memvalidasi, dan mengaplikasikan voucher.
    - Mendukung voucher tipe `PERCENTAGE` dan `FIXED_AMOUNT`.
    - Mendukung batasan penggunaan, minimum pembelian, dan tanggal kedaluwarsa.
    - Mengimplementasikan validasi idempotency untuk mencegah penggunaan ganda.
  - **`PromoController`**: Menambahkan endpoint API untuk manajemen promo/voucher (Admin) dan penggunaan oleh pengguna.
    - `POST /admin/promos`, `GET /admin/promos`, `PATCH /admin/promos/:id`
    - `POST /admin/vouchers`, `GET /admin/vouchers`
    - `GET /vouchers` (untuk pengguna)
    - `POST /vouchers/validate` (untuk validasi sebelum apply)
    - `POST /vouchers/apply` (untuk mengaplikasikan ke transaksi)
  - **`PromoModule`**: Mengintegrasikan service dan controller baru ke dalam aplikasi NestJS.

## ♻️ Perbaikan & Refactoring

- **Penghapusan Dependensi Blockchain (`kahade-backend`)**
  - Menghapus paket `ethers` dan `web3` dari `dependencies` di `package.json`.
  - Jejak kode yang terkait dengan blockchain tidak ditemukan, sehingga hanya penghapusan dependensi yang diperlukan.
  - Ini mengurangi ukuran build dan menghilangkan *attack surface* yang tidak perlu.

- **Verifikasi Konsistensi API (`kahade-backend` & `kahade-frontend`)**
  - Melakukan verifikasi silang antara endpoint yang diekspos oleh controller backend dan yang dikonsumsi oleh `lib/api.ts` di frontend.
  - Sebagian besar endpoint sudah konsisten. Endpoint untuk fitur baru (promo/voucher) perlu ditambahkan di sisi frontend.

## 🧪 Pengujian

- **Penambahan Unit Tests (`kahade-backend`)**
  - **`escrow.service.spec.ts`**: Menambahkan unit test untuk `EscrowService`.
    - Menguji validitas transisi *state machine* untuk status Escrow dan Order.
    - Menguji logika pembuatan, pelepasan (`release`), dan pengembalian dana (`refund`) escrow.
  - **`wallet.service.spec.ts`**: Menambahkan unit test untuk `WalletService`.
    - Menguji logika `lock`, `unlock`, `credit`, dan `deduct` balance.
    - Memastikan penanganan kasus `InsufficientBalanceError`.
  - **`promo.service.spec.ts`**: Menambahkan unit test untuk `PromoService` yang baru dibuat.
    - Menguji logika validasi voucher (kedaluwarsa, batas penggunaan, minimum pembelian, dll.).
    - Menguji kalkulasi diskon untuk tipe `PERCENTAGE` dan `FIXED_AMOUNT`, termasuk validasi *max discount*.

## 📚 Dokumentasi

- **Penambahan Komentar `BANK-GRADE`**
  - Menambahkan komentar `// BANK-GRADE:` pada file-file krusial (`escrow.service.ts`, `wallet.service.ts`, `xendit.webhook.controller.ts`) untuk menyoroti implementasi yang mengikuti standar keamanan tinggi untuk aplikasi finansial.

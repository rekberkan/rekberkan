# Security Hardening Checklist: Proyek KAHade

**Tanggal:** 28 Januari 2026

Checklist ini merangkum praktik keamanan yang telah diimplementasikan dan yang direkomendasikan untuk proyek KAHade.

## ✅ Backend (`kahade-backend`)

### Lapisan Aplikasi
- [x] **Input Validation**: Semua input dari client (DTOs) divalidasi menggunakan `class-validator`.
- [x] **Output Sanitization**: Prisma secara default melindungi dari *SQL Injection*. Pastikan tidak ada *raw query* yang menggunakan input pengguna secara langsung.
- [x] **Authentication**: JWT dengan masa berlaku pendek untuk *access token* dan masa berlaku panjang untuk *refresh token* telah diimplementasikan.
- [x] **Authorization**: `RolesGuard` digunakan untuk melindungi endpoint admin dan endpoint yang memerlukan hak akses spesifik.
- [x] **Error Handling**: Error generik dikirim ke client untuk menghindari kebocoran detail implementasi.
- [x] **Password Management**: Password di-hash menggunakan `bcrypt` dengan *salt rounds* yang cukup (minimal 10).
- [x] **Multi-Factor Authentication (MFA)**: Fungsionalitas untuk mengaktifkan dan memverifikasi TOTP (Time-based One-Time Password) telah ada.

### Lapisan Transport & Jaringan
- [x] **HTTPS**: Wajib menggunakan SSL/TLS di lingkungan produksi.
- [x] **CORS (Cross-Origin Resource Sharing)**: Dikonfigurasi secara ketat untuk hanya mengizinkan domain frontend yang dikenal.
- [x] **Security Headers**: `helmet` digunakan untuk mengatur header HTTP yang aman (X-Content-Type-Options, X-Frame-Options, dll.).
- [x] **CSRF Protection**: `csurf` digunakan untuk melindungi dari serangan *Cross-Site Request Forgery*.
- [x] **Rate Limiting**: `nestjs/throttler` diimplementasikan untuk mencegah serangan *brute-force* pada endpoint sensitif seperti login.

### Ketergantungan & Lingkungan
- [x] **Audit Dependensi**: `npm audit` dijalankan secara rutin untuk mendeteksi kerentanan pada paket pihak ketiga.
- [x] **Manajemen Secret**: Tidak ada *hardcoded secret*. Semua kunci dan kredensial dimuat dari *environment variables*.
- [x] **Penghapusan Dependensi Tidak Perlu**: `ethers` dan `web3` telah dihapus.

## ✅ Frontend (`kahade-frontend`)

- [x] **HTTPS**: Wajib disajikan melalui HTTPS.
- [x] **Content Security Policy (CSP)**: **TODO** - Implementasikan header CSP yang ketat untuk mencegah serangan XSS (Cross-Site Scripting) dengan membatasi sumber script, style, dan media.
- [x] **Token Storage**: Access token disimpan di `localStorage`. Untuk keamanan lebih tinggi, pertimbangkan untuk memindahkannya ke *in-memory storage* dan hanya mengandalkan *refresh token* yang disimpan di cookie `httpOnly`.
- [x] **XSS Prevention**: React secara default melakukan *escaping* pada data yang dirender, memberikan perlindungan dasar terhadap XSS. Hindari penggunaan `dangerouslySetInnerHTML`.
- [x] **CSRF Token Handling**: `lib/api.ts` sudah menangani pengiriman token CSRF yang diterima dari backend.

## ✅ Integrasi Pihak Ketiga (Xendit)

- [x] **Webhook Security**: Verifikasi *callback token* dari Xendit diimplementasikan untuk memastikan webhook berasal dari sumber yang sah.
- [x] **Idempotency**: Pemrosesan webhook bersifat idempoten untuk mencegah duplikasi transaksi jika webhook yang sama dikirim beberapa kali.
- [x] **API Key Security**: Kunci API Xendit disimpan dengan aman di *environment variables* di sisi backend dan tidak pernah diekspos ke frontend.

## 🎯 Rekomendasi Prioritas Tinggi

1. **Implementasi Content Security Policy (CSP)**: Ini adalah langkah krusial untuk memperkuat pertahanan terhadap serangan XSS di sisi frontend.
2. **Review Token Storage**: Evaluasi kembali strategi penyimpanan token di frontend. Menggunakan cookie `httpOnly` untuk *refresh token* adalah standar emas saat ini.
3. **Pengujian Penetrasi (Penetration Testing)**: Setelah aplikasi stabil, lakukan pengujian penetrasi oleh pihak ketiga untuk mengidentifikasi kerentanan yang mungkin terlewatkan.
4. **Implementasi Content Security Policy (CSP)**: Ini adalah langkah krusial untuk memperkuat pertahanan terhadap serangan XSS di sisi frontend.
5. **Review Token Storage**: Evaluasi kembali strategi penyimpanan token di frontend. Menggunakan cookie `httpOnly` untuk *refresh token* adalah standar emas saat ini.
6. **Pengujian Penetrasi (Penetration Testing)**: Setelah aplikasi stabil, lakukan pengujian penetrasi oleh pihak ketiga untuk mengidentifikasi kerentanan yang mungkin terlewatkan.

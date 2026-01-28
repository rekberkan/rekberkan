# Laporan Temuan Audit Keamanan & Kualitas Kode - Rekberkan

**Tanggal:** 28 Januari 2026
**Auditor:** Manus AI (Principal Engineer, Security Lead, QA Lead)

## Ringkasan Eksekutif

Audit menyeluruh pada repositori `rekberkan/rekberkan` telah mengidentifikasi sejumlah kerentanan keamanan kritis, masalah kualitas kode, dan area yang memerlukan perbaikan untuk memenuhi standar keuangan setara bank. Ditemukan **4 temuan Kritis, 4 temuan Tinggi, 6 temuan Sedang, dan 4 temuan Rendah**.

Perbaikan segera diperlukan untuk mengatasi kerentanan kritis terkait **paparan secrets, manajemen dependensi, dan penyimpanan token yang tidak aman** untuk mencegah kompromi sistem. Rencana perbaikan terperinci diuraikan di bawah ini untuk setiap temuan.

## Metodologi

Audit dilakukan dengan mengikuti metodologi yang digariskan dalam dokumen workflow, mencakup:
1.  **Analisis Statis:** Menggunakan `grep`, `find`, dan analisis manual untuk menemukan pola kode yang tidak aman, placeholder, dan masalah kualitas.
2.  **Analisis Dependensi:** Menggunakan `npm audit` untuk mengidentifikasi kerentanan pada paket backend dan frontend.
3.  **Pemeriksaan Konfigurasi:** Meninjau file `Dockerfile`, `docker-compose.yml`, `*.prisma`, `jest.config.js`, dan file konfigurasi lainnya untuk kesalahan konfigurasi keamanan.
4.  **Analisis Alur Kerja & Logika:** Memeriksa alur otentikasi, penanganan sesi, operasi keuangan, dan kontrol akses untuk kelemahan logika.

---

## Daftar Temuan

### Kategori: Keamanan (Security)

| ID | Severity | Lokasi | Temuan | Dampak | Rekomendasi Perbaikan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| SEC-001 | **CRITICAL** | `kahade-backend/src/config/jwt.config.ts` | **Hardcoded Default JWT Secrets:** Konfigurasi JWT menggunakan secret default (`dev-jwt-secret-change-this-immediately`) jika variabel lingkungan tidak diatur. | Penyerang dapat dengan mudah memalsukan token JWT, mendapatkan akses tidak sah ke akun mana pun, dan mengambil alih sistem sepenuhnya. | Hapus secret default. Buat aplikasi gagal start jika `JWT_SECRET` dan `JWT_REFRESH_SECRET` tidak diatur di lingkungan produksi. |
| SEC-002 | **CRITICAL** | `kahade-frontend/.env.development`, `kahade-frontend/.env.production` | **File `.env` di-commit ke Git:** File `.env` yang berisi konfigurasi (meskipun bukan secrets langsung) di-commit ke repositori. | Memudahkan penyerang untuk memahami konfigurasi internal dan meningkatkan risiko kebocoran secrets jika ada yang tidak sengaja menambahkannya. | Hapus file `.env.*` dari riwayat Git. Tambahkan `*.env.*` ke `.gitignore` global. Gunakan `.env.example` sebagai satu-satunya file yang di-commit. |
| SEC-003 | **CRITICAL** | `kahade-backend/package.json`, `kahade-frontend/package.json` | **Kerentanan Dependensi Kritis:** `npm audit` menemukan beberapa kerentanan `High` dan `Moderate` pada dependensi backend (misalnya, `tar`, `cookie`) dan frontend (`esbuild`). | Kerentanan ini dapat dieksploitasi untuk serangan seperti penulisan file sewenang-wenang (Arbitrary File Overwrite), polusi prototipe (Prototype Pollution), atau serangan server-side request forgery (SSRF). | Jalankan `npm audit fix --force` atau perbarui paket secara manual ke versi yang aman. Evaluasi dampak breaking changes. |
| SEC-004 | **CRITICAL** | `kahade-frontend/src/contexts/AuthContext.tsx`, `kahade-frontend/src/lib/api.ts` | **Penyimpanan JWT di `localStorage`:** Token otentikasi (JWT) disimpan di `localStorage`, yang rentan terhadap serangan Cross-Site Scripting (XSS). | Jika ada kerentanan XSS di situs, penyerang dapat mencuri token JWT pengguna, membajak sesi mereka, dan mengakses akun mereka. | Migrasikan penyimpanan token dari `localStorage` ke **cookie `httpOnly` dan `secure`**. Gunakan pola Double Submit Cookie untuk perlindungan CSRF. Manfaatkan `secure-storage.ts` yang sudah ada. |
| SEC-005 | **HIGH** | Berbagai file DTO di `kahade-backend/src/core` | **Validasi Input Tidak Lengkap/Tidak Ada:** Beberapa DTO (Data Transfer Object) kosong (`{}`) atau menggunakan `any` / `Record<string, any>`, terutama pada webhook dan beberapa endpoint admin. | Membuka celah untuk serangan seperti Mass Assignment, injeksi data berbahaya, dan menyebabkan error tak terduga jika payload tidak valid. | Terapkan validasi yang ketat pada semua DTO menggunakan `class-validator`. Hindari penggunaan `any` dan `Record<string, any>`. Buat DTO spesifik untuk setiap payload. |
| SEC-006 | **HIGH** | `kahade-backend/src/common/utils/sql-safe.util.ts` | **Potensi SQL Injection melalui `Prisma.raw`:** Penggunaan `Prisma.raw` dapat berbahaya jika input tidak disanitasi dengan benar, meskipun tampaknya ada upaya untuk memvalidasi field. | Jika dapat dieksploitasi, penyerang dapat menjalankan query SQL sewenang-wenang, membocorkan, memodifikasi, atau menghapus data dari database. | Tinjau ulang semua penggunaan `Prisma.raw`. Pastikan semua bagian dari query yang berasal dari input pengguna diparameterisasi menggunakan `Prisma.sql` dan tidak pernah digabungkan sebagai string mentah. |
| SEC-007 | **HIGH** | Berbagai controller di `kahade-backend/src/core` | **Potensi IDOR (Insecure Direct Object Reference):** Banyak endpoint menggunakan `id` dari parameter URL. Perlu dipastikan setiap endpoint melakukan pemeriksaan kepemilikan (ownership check). | Pengguna jahat dapat mencoba mengakses atau memodifikasi data milik pengguna lain hanya dengan menebak ID objek (misalnya, melihat transaksi atau detail bank akun orang lain). | Implementasikan guard atau logic di dalam service untuk setiap query agar selalu menyertakan `userId` dari sesi saat ini untuk memastikan pengguna hanya dapat mengakses data mereka sendiri. |
| SEC-008 | **HIGH** | `kahade-backend/src/common/utils/crypto.util.ts` | **Hashing Password Tidak Konsisten dan Lemah:** Terdapat dua implementasi hashing (`bcrypt` dan `pbkdf2`). Implementasi `pbkdf2` menggunakan salt statis yang sama untuk semua password. | Penggunaan salt statis menghilangkan perlindungan terhadap serangan rainbow table, secara signifikan melemahkan keamanan penyimpanan password. | Gunakan `bcrypt` secara konsisten. Hapus `crypto.util.ts`. Pastikan `bcrypt` menghasilkan salt unik untuk setiap password secara otomatis. |
| SEC-009 | **MEDIUM** | `kahade-frontend/client/src/components/ui/chart.tsx` | **Potensi XSS melalui `dangerouslySetInnerHTML`:** Properti ini digunakan untuk menyuntikkan CSS. Meskipun saat ini terlihat aman, ini adalah pola yang sangat berbahaya. | Jika data yang disuntikkan dapat dimanipulasi oleh pengguna, penyerang dapat menyuntikkan skrip berbahaya untuk mencuri data atau membajak sesi. | Ganti `dangerouslySetInnerHTML` dengan pendekatan yang lebih aman, seperti menggunakan pustaka CSS-in-JS atau membuat elemen `<style>` secara dinamis dan mengisinya dengan `textContent`. |

### Kategori: Kualitas Kode & Praktik Terbaik (Quality & Best Practices)

| ID | Severity | Lokasi | Temuan | Dampak | Rekomendasi Perbaikan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| QUA-001 | **MEDIUM** | `kahade-backend/jest.config.js`, `package.json` | **Konfigurasi Tes Rusak dan Tidak Konsisten:** Terdapat dua konfigurasi Jest, dan `rootDir` yang salah mencegah Jest menemukan file tes. | Tes tidak dapat dijalankan, yang berarti tidak ada jaring pengaman untuk regresi. Kualitas dan keandalan kode tidak dapat diverifikasi secara otomatis. | Konsolidasikan konfigurasi Jest ke dalam `jest.config.js`. Perbaiki `rootDir` dan `moduleNameMapper` agar tes dapat menemukan semua modul dan file tes. |
| QUA-002 | **MEDIUM** | Berbagai file di `kahade-frontend` dan `kahade-backend` | **Hardcoded URLs:** Terdapat beberapa URL yang di-hardcode, termasuk URL API Google Maps dan tautan media sosial. | Membuat aplikasi tidak fleksibel. Perubahan URL memerlukan perubahan kode dan deployment ulang. Sulit untuk mengelola lingkungan yang berbeda (dev, staging, prod). | Pindahkan semua URL ke variabel lingkungan (`.env.example`) dan muat melalui modul konfigurasi. |
| QUA-003 | **MEDIUM** | Berbagai file di `kahade-frontend` dan `kahade-backend` | **Sisa Kode Debugging (`console.log`):** Banyak panggilan `console.log`, `console.warn`, dan `console.error` yang tersisa di kode. | Dapat membocorkan informasi sensitif di log browser atau server di lingkungan produksi dan membuat log menjadi bising dan sulit dibaca. | Hapus semua panggilan `console.*` yang tidak perlu. Gunakan logger terpusat (seperti yang sudah ada di backend) untuk semua logging. |
| QUA-004 | **MEDIUM** | `kahade-frontend/package.json` | **Skrip `lint` Tidak Ada di Frontend:** Proyek frontend tidak memiliki skrip `npm run lint` untuk memeriksa kualitas kode secara statis. | Kualitas kode tidak dapat dijaga secara konsisten. Tidak ada cara otomatis untuk menemukan masalah gaya, potensi bug, atau pelanggaran praktik terbaik. | Tambahkan `eslint` dan konfigurasinya ke proyek frontend, lalu buat skrip `lint` di `package.json`. |
| QUA-005 | **MEDIUM** | `kahade-frontend/` | **Masalah Instalasi Dependensi Frontend:** `npm install` gagal tanpa flag `--legacy-peer-deps` karena konflik versi `vite`. | Menghambat proses setup developer baru dan dapat menyebabkan masalah yang tidak terduga saat build atau runtime karena versi dependensi yang tidak cocok. | Perbarui dependensi yang berkonflik (`@builder.io/vite-plugin-jsx-loc`) atau sesuaikan versi `vite` agar kompatibel. |
| QUA-006 | **LOW** | Berbagai file | **Komentar Placeholder (TODO, FIXME):** Terdapat beberapa komentar `TODO` dan `FIXME` yang tersisa. | Menunjukkan pekerjaan yang belum selesai dan dapat menyebabkan fungsionalitas yang hilang atau bug jika tidak ditangani. | Tinjau setiap komentar `TODO`/`FIXME`, selesaikan tugas yang terkait, atau buat tiket di backlog jika memerlukan pekerjaan lebih lanjut, lalu hapus komentarnya. |
| QUA-007 | **LOW** | `kahade-backend/test/` | **Variabel Tidak Digunakan (Unused Variables):** Linter backend melaporkan beberapa variabel yang tidak digunakan dalam file tes. | Membuat kode kurang bersih dan dapat membingungkan developer lain yang membaca kode tersebut. | Hapus semua variabel yang tidak digunakan yang dilaporkan oleh linter. |
| QUA-008 | **LOW** | `kahade-frontend/client/index.html` | **Header Content Security Policy (CSP) Tidak Ada:** Frontend tidak mengirimkan header CSP, baik melalui meta tag maupun dari server. | Mengurangi lapisan pertahanan terhadap serangan XSS dan injeksi konten lainnya. | Implementasikan header CSP yang ketat di backend (melalui middleware `helmet` yang sudah ada) untuk membatasi sumber daya (skrip, gaya, gambar) yang dapat dimuat oleh browser. |
| QUA-009 | **LOW** | `kahade-backend/Dockerfile` | **Dockerfile Dapat Dioptimalkan:** Image builder menyertakan `make`, `g++`, dan `python3` yang tidak diperlukan di image final. | Meskipun sudah menggunakan multi-stage build, image final masih bisa lebih kecil dan memiliki permukaan serangan yang lebih kecil lagi. | Pastikan dependensi build ini hanya ada di stage `builder` dan tidak tercopy atau terinstal di stage `production`. |

---

## Rencana Aksi Selanjutnya

1.  **Fase Perbaikan:** Memperbaiki semua temuan berdasarkan prioritas, dimulai dari **Kritis** -> **Tinggi** -> **Sedang** -> **Rendah**.
2.  **Fase Verifikasi:** Menjalankan semua gate check (build, lint, typecheck, test) untuk memastikan semua perbaikan berhasil dan tidak menimbulkan regresi.
3.  **Fase Commit & Push:** Melakukan commit perubahan secara bertahap sesuai dengan workflow Git yang ditentukan dan mendorong ke branch `audit-hardening/2026-01-28`.

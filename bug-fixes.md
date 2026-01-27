# Bug Fixes Documentation

## 1. Auth Resend Verification - FRONTEND FIX
**Problem:** Frontend `resendVerification()` tidak mengirim email, tapi backend butuh email
**Solution:** Ubah frontend untuk mengirim email dari user context

## 2. Wallet Withdraw - BACKEND + FRONTEND FIX  
**Problem:** Frontend kirim bankCode/accountNumber/accountName, backend butuh bankAccountId
**Solution:** 
- Option A: Ubah backend untuk menerima bankCode/accountNumber/accountName (lebih user-friendly)
- Option B: Tambah endpoint bank account management di backend
**Chosen:** Option A - ubah backend DTO untuk menerima data bank langsung

## 3. Topup Method Mismatch - FRONTEND FIX
**Problem:** Frontend pakai bank_transfer/card/ewallet, backend butuh va_*/ewallet_*/qris
**Solution:** Ubah frontend untuk mapping ke method yang valid

## 4. Dispute Evidence - FRONTEND FIX
**Problem:** Frontend kirim { fileUrls: string[], description }, backend butuh { type, fileUrl }
**Solution:** Ubah frontend untuk mengirim format yang benar

## 5. Admin Reports - BACKEND FIX
**Problem:** Frontend memanggil /admin/reports/* yang tidak ada
**Solution:** Tambah endpoint reports di admin controller

## 6. Bank Account Management - BACKEND FIX
**Problem:** Tidak ada endpoint untuk manage bank account
**Solution:** Tambah endpoint CRUD bank account

## 7. Auth Sessions Response - FRONTEND FIX
**Problem:** Frontend expect response.data.sessions, backend return array langsung
**Solution:** Ubah frontend untuk handle response array langsung

## 8. Admin Pages Mock Data - FRONTEND FIX
**Problem:** Admin pages masih pakai mock data
**Solution:** Connect ke adminApi yang sudah ada

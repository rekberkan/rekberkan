# Bug Fixes Notes

## Bugs to Fix:

### 1. Authentication & Security
- [ ] Email verification stub - verifyEmail() hanya return success tanpa validasi
- [ ] resendVerificationEmail() tidak generate/send token baru
- [ ] MFA setup menyimpan secret tanpa enkripsi yang proper

### 2. Webhook Duplication & Token Inconsistency
- [ ] Duplicate webhook routes: /webhooks/xendit/invoice & /webhooks/xendit/disbursement di 2 controller
- [ ] Xendit token tidak konsisten: XENDIT_CALLBACK_TOKEN vs XENDIT_WEBHOOK_VERIFICATION_TOKEN

### 3. Jobs/Queue Not Connected
- [ ] Email/Notification queue processor ada tapi tidak ada producer (@InjectQueue/.add())

### 4. Dispute Evidence DTO Not Used
- [ ] SubmitEvidenceDto tidak dipakai di controller, validasi type hilang

### 5. DB Fields Not Used
- [ ] autoReleaseJobId & timeoutJobId tidak pernah diisi
- [ ] DeliveryProof.notes selalu hardcoded

### 6. Rate Limiting Not Active
- [ ] ThrottlerGuard in-memory tidak dipasang sebagai APP_GUARD
- [ ] RateLimitGuard adalah no-op (always return true)
- [ ] rate-limit.config.ts tidak digunakan

### 7. Scheduler/Cron Missing
- [ ] AutoReleaseEscrowCron tidak memanggil processExpiredEscrows()
- [ ] Tidak ada @Cron decorator

### 8. Admin Navigation
- [ ] Admin navigation links menggunakan /admin prefix yang salah (seharusnya / karena sudah di admin subdomain)

## Files to Modify:
1. auth.service.ts - email verification
2. auto-release-escrow.cron.ts - add scheduler
3. jobs.module.ts - add ScheduleModule
4. app.module.ts - add ThrottlerGuard as APP_GUARD
5. rate-limit.guard.ts - implement proper rate limiting
6. AdminLayout.tsx - fix navigation links
7. core/payment/webhook.controller.ts - consolidate or remove duplicate
8. xendit.webhook.controller.ts - use consistent token
9. dispute.controller.ts - use DTO for evidence

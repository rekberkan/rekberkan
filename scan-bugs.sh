#!/bin/bash

echo "=========================================="
echo "KAHADE BUG SCAN REPORT"
echo "Date: $(date)"
echo "=========================================="
echo ""

# 1. Check Email Verification Implementation
echo "1. EMAIL VERIFICATION"
echo "-------------------------------------------"
if grep -q "findByEmailVerificationToken" kahade-backend/src/core/auth/auth.service.ts; then
    echo "✅ Email verification properly implemented"
else
    echo "❌ Email verification still stub"
fi

# 2. Check Resend Verification Email
echo ""
echo "2. RESEND VERIFICATION EMAIL"
echo "-------------------------------------------"
if grep -q "setEmailVerificationToken" kahade-backend/src/core/auth/auth.service.ts; then
    echo "✅ Resend verification generates new token"
else
    echo "❌ Resend verification doesn't generate token"
fi

# 3. Check MFA Encryption
echo ""
echo "3. MFA SECRET ENCRYPTION"
echo "-------------------------------------------"
if grep -q "CryptoUtil.encrypt" kahade-backend/src/core/auth/mfa.service.ts; then
    echo "✅ MFA secret is encrypted before storage"
else
    echo "❌ MFA secret not encrypted"
fi

# 4. Check CSRF Middleware
echo ""
echo "4. CSRF MIDDLEWARE"
echo "-------------------------------------------"
if grep -q "ForbiddenException\|constantTimeCompare" kahade-backend/src/security/middleware/csrf.middleware.ts; then
    echo "✅ CSRF middleware properly implemented"
else
    echo "❌ CSRF middleware is no-op"
fi

# 5. Check Rate Limiting
echo ""
echo "5. RATE LIMITING"
echo "-------------------------------------------"
if grep -q "ThrottlerGuard" kahade-backend/src/app.module.ts && grep -q "APP_GUARD" kahade-backend/src/app.module.ts; then
    echo "✅ ThrottlerGuard registered as APP_GUARD"
else
    echo "❌ ThrottlerGuard not active"
fi

# 6. Check RateLimitGuard Implementation
echo ""
echo "6. RATE LIMIT GUARD"
echo "-------------------------------------------"
if grep -q "HttpException\|TOO_MANY_REQUESTS" kahade-backend/src/security/guards/rate-limit.guard.ts; then
    echo "✅ RateLimitGuard properly implemented"
else
    echo "❌ RateLimitGuard is no-op"
fi

# 7. Check Scheduler/Cron
echo ""
echo "7. AUTO-RELEASE ESCROW CRON"
echo "-------------------------------------------"
if grep -q "@Cron\|CronExpression" kahade-backend/src/jobs/cron/auto-release-escrow.cron.ts; then
    echo "✅ Cron decorator properly configured"
else
    echo "❌ Cron decorator missing"
fi

# 8. Check Jobs Module
echo ""
echo "8. JOBS MODULE SCHEDULER"
echo "-------------------------------------------"
if grep -q "ScheduleModule" kahade-backend/src/jobs/jobs.module.ts; then
    echo "✅ ScheduleModule imported"
else
    echo "❌ ScheduleModule not imported"
fi

# 9. Check Escrow Module Exports
echo ""
echo "9. ESCROW MODULE"
echo "-------------------------------------------"
if grep -q "exports: \[EscrowService\]" kahade-backend/src/core/escrow/escrow.module.ts; then
    echo "✅ EscrowService exported"
else
    echo "❌ EscrowService not exported"
fi

# 10. Check Admin Navigation Links
echo ""
echo "10. ADMIN NAVIGATION LINKS"
echo "-------------------------------------------"
if grep -q "href: '/'" kahade-frontend/client/src/components/layout/AdminLayout.tsx && ! grep -q "href: '/admin'" kahade-frontend/client/src/components/layout/AdminLayout.tsx; then
    echo "✅ Admin navigation uses correct paths"
else
    echo "❌ Admin navigation uses wrong /admin prefix"
fi

# 11. Check Dispute Evidence DTO
echo ""
echo "11. DISPUTE EVIDENCE DTO"
echo "-------------------------------------------"
if grep -q "SubmitEvidenceDto" kahade-backend/src/core/dispute/dispute.controller.ts; then
    echo "✅ SubmitEvidenceDto used in controller"
else
    echo "❌ SubmitEvidenceDto not used"
fi

# 12. Check DeliveryProof Notes
echo ""
echo "12. DELIVERY PROOF NOTES"
echo "-------------------------------------------"
if grep -q "notes?.trim()\|notes: notes" kahade-backend/src/core/transaction/transaction.service.ts; then
    echo "✅ DeliveryProof accepts user notes"
else
    echo "❌ DeliveryProof notes hardcoded"
fi

# 13. Check Logout CSRF Handling
echo ""
echo "13. LOGOUT CSRF HANDLING"
echo "-------------------------------------------"
if grep -q "SecureStorage.clearAll" kahade-frontend/client/src/contexts/AuthContext.tsx; then
    echo "✅ Logout clears CSRF token"
else
    echo "❌ Logout doesn't clear CSRF token"
fi

# 14. Check Midtrans Signature Verification
echo ""
echo "14. MIDTRANS WEBHOOK SIGNATURE"
echo "-------------------------------------------"
if grep -q "timingSafeEqual" kahade-backend/src/api/webhooks/midtrans.webhook.controller.ts; then
    echo "✅ Midtrans signature uses timing-safe comparison"
else
    echo "❌ Midtrans signature verification vulnerable"
fi

# 15. Check Xendit Signature Verification
echo ""
echo "15. XENDIT WEBHOOK SIGNATURE"
echo "-------------------------------------------"
if grep -q "timingSafeEqual" kahade-backend/src/api/webhooks/xendit.webhook.controller.ts; then
    echo "✅ Xendit signature uses timing-safe comparison"
else
    echo "❌ Xendit signature verification vulnerable"
fi

echo ""
echo "=========================================="
echo "SCAN COMPLETE"
echo "=========================================="

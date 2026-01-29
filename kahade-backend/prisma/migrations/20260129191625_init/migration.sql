-- CreateEnum
CREATE TYPE "InitiatorRole" AS ENUM ('BUYER', 'SELLER');

-- CreateEnum
CREATE TYPE "OrderCategory" AS ENUM ('ELECTRONICS', 'SERVICES', 'DIGITAL_GOODS', 'PHYSICAL_GOODS', 'OTHER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('IDR', 'USD');

-- CreateEnum
CREATE TYPE "FeePayer" AS ENUM ('BUYER', 'SELLER', 'SPLIT', 'FIFTY_FIFTY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('WAITING_COUNTERPARTY', 'PENDING_ACCEPT', 'ACCEPTED', 'PAID', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowHoldStatus" AS ENUM ('ACTIVE', 'HELD', 'RELEASED', 'REFUNDED', 'DISPUTED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESPONDED', 'ESCALATED', 'UNDER_REVIEW', 'UNDER_ARBITRATION', 'AWAITING_RESPONSE', 'DECIDED', 'APPEALED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeDecision" AS ENUM ('NONE', 'PENDING', 'BUYER_WINS', 'SELLER_WINS', 'SPLIT', 'CANCELLED', 'RELEASE_ALL_TO_SELLER', 'REFUND_ALL_TO_BUYER', 'SPLIT_SETTLEMENT', 'CANCEL_VOID');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PromoTargetType" AS ENUM ('USER', 'ORDER');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'ORDER_CREATE', 'PAYMENT_SUCCESS', 'TRANSACTION_CREATED', 'TRANSACTION_UPDATED', 'PROFILE_UPDATED', 'WALLET_TOPUP', 'WALLET_WITHDRAW');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "ScheduledJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('TRANSACTION', 'ADJUSTMENT', 'DEPOSIT', 'WITHDRAWAL', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'TRANSFER', 'FEE', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('XENDIT', 'MIDTRANS');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VIRTUAL_ACCOUNT', 'EWALLET', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('SAVINGS', 'CHECKING');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReferralRewardType" AS ENUM ('CASHBACK', 'COMMISSION');

-- CreateEnum
CREATE TYPE "ReferralRewardStatus" AS ENUM ('PENDING', 'CLAIMED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTION', 'DISPUTE', 'PAYMENT', 'SYSTEM', 'WALLET', 'KYC');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'REFUND', 'FEE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAYMENT_CONFIRMED', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WalletAdjustmentStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalletAdjustmentType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_LOCKED', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'MFA_ENABLED', 'MFA_DISABLED', 'MFA_FAILED', 'SESSION_REVOKED', 'SUSPICIOUS_ACTIVITY', 'WITHDRAWAL_FLAGGED', 'ADMIN_ACTION');

-- CreateEnum
CREATE TYPE "SecurityEventSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "promos" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_type" "PromoTargetType" NOT NULL,
    "discount_type" "VoucherType" NOT NULL,
    "discount_value" BIGINT,
    "discount_percent" DECIMAL(5,2),
    "max_discount_minor" BIGINT,
    "max_total_usages" INTEGER,
    "max_usage_per_user" INTEGER NOT NULL DEFAULT 1,
    "current_usages" INTEGER NOT NULL DEFAULT 0,
    "min_purchase_minor" BIGINT,
    "applicable_categories" JSONB,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_assignments" (
    "id" TEXT NOT NULL,
    "promo_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "promo_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "promo_id" TEXT,
    "code" TEXT NOT NULL,
    "voucher_type" "VoucherType" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "discount_minor" BIGINT,
    "discount_percent" DECIMAL(5,2),
    "max_discount_minor" BIGINT,
    "max_usages" INTEGER NOT NULL DEFAULT 1,
    "current_usages" INTEGER NOT NULL DEFAULT 0,
    "min_purchase_minor" BIGINT,
    "applicable_categories" JSONB,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "assigned_to_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_usages" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "original_minor" BIGINT NOT NULL,
    "discount_minor" BIGINT NOT NULL,
    "final_minor" BIGINT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT,

    CONSTRAINT "voucher_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "password_updated_at" TIMESTAMPTZ,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "last_failed_login_at" TIMESTAMPTZ,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "suspended_at" TIMESTAMPTZ,
    "suspended_until" TIMESTAMPTZ,
    "suspend_reason" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret_enc" TEXT,
    "backup_codes_hash" JSONB,
    "email_verified_at" TIMESTAMPTZ,
    "email_verification_token" TEXT,
    "email_verification_expires" TIMESTAMPTZ,
    "kyc_status" "KYCStatus" NOT NULL DEFAULT 'NONE',
    "reputationScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "notification_settings" JSONB,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "revoked_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_family_id" TEXT,
    "rotated_at" TIMESTAMPTZ,
    "replaced_by_session_id" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "country" TEXT,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_comments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_hash" TEXT,
    "prev_hash" TEXT,
    "correlation_id" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_limits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "kyc_status" "KYCStatus" NOT NULL DEFAULT 'NONE',
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "daily_limit_minor" BIGINT NOT NULL,
    "per_tx_limit_minor" BIGINT NOT NULL,
    "monthly_limit_minor" BIGINT,
    "daily_withdrawal_limit_minor" BIGINT,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_overridden" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,
    "overridden_by" TEXT,
    "overridden_at" TIMESTAMPTZ,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderCategory" "OrderCategory",
    "min_amount_minor" BIGINT,
    "max_amount_minor" BIGINT,
    "fee_percentage" DECIMAL(5,4) NOT NULL,
    "flat_fee_minor" BIGINT NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_account_keys" (
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "account_type" "LedgerAccountType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_account_keys_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "scheduled_jobs" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "executed_at" TIMESTAMP(3),
    "status" "ScheduledJobStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "payload" JSONB,
    "result" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "balance_minor" BIGINT NOT NULL DEFAULT 0,
    "locked_minor" BIGINT NOT NULL DEFAULT 0,
    "last_reconciled_at" TIMESTAMP(3),
    "reconciliation_hash" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT,
    "platform_key" TEXT,
    "type" "LedgerAccountType" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_journals" (
    "id" TEXT NOT NULL,
    "type" "JournalType" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "amount_minor" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deposit_id" TEXT,
    "withdrawal_id" TEXT,
    "dispute_id" TEXT,
    "referral_reward_id" TEXT,
    "voucher_usage_id" TEXT,
    "order_settlement_id" TEXT,
    "order_id" TEXT,
    "escrow_hold_id" TEXT,

    CONSTRAINT "ledger_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "journal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "running_balance_minor" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_adjustments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "type" "WalletAdjustmentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "WalletAdjustmentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "approver_notes" TEXT,
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "user_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "response" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_backup_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" "SecurityEventType" NOT NULL,
    "severity" "SecurityEventSeverity" NOT NULL DEFAULT 'LOW',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "is_alerted" BOOLEAN NOT NULL DEFAULT false,
    "alerted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'XENDIT',
    "provider_invoice_id" TEXT,
    "payment_type" "PaymentType" NOT NULL,
    "payment_method" "PaymentMethod",
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "amount_minor" BIGINT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_details" JSONB,
    "paid_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "is_reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciled_at" TIMESTAMPTZ,
    "reconciled_by" TEXT,
    "reconciliation_ref" TEXT,
    "settlement_date" TIMESTAMPTZ,
    "settlement_amount" BIGINT,
    "settlement_fees" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "order_id" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_status_history" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "from_status" "PaymentStatus",
    "to_status" "PaymentStatus" NOT NULL,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,
    "reason" TEXT,
    "webhook_event_id" TEXT,

    CONSTRAINT "payment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'XENDIT',
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "last_retry_at" TIMESTAMPTZ,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "processing_error" TEXT,
    "payment_id" TEXT,
    "provider_event_at" TIMESTAMPTZ,
    "signature_valid" BOOLEAN NOT NULL,
    "signature_error" TEXT,
    "request_ip" TEXT,
    "request_headers" JSONB,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "amount_minor" BIGINT NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number_enc" TEXT NOT NULL,
    "account_number_last4" TEXT NOT NULL,
    "account_name_enc" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ,
    "verification_method" TEXT,
    "last_used_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "amount_minor" BIGINT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "review_started_at" TIMESTAMPTZ,
    "review_notes" TEXT,
    "admin_notes" TEXT,
    "risk_hold_until" TIMESTAMPTZ,
    "requires_multiple_approvals" BOOLEAN NOT NULL DEFAULT false,
    "approval_count" INTEGER NOT NULL DEFAULT 0,
    "required_approvals" INTEGER NOT NULL DEFAULT 1,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "provider_disbursement_id" TEXT,
    "provider_response" JSONB,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "idempotency_key" TEXT,
    "velocity_score" DECIMAL(5,2),
    "is_flagged_by_system" BOOLEAN NOT NULL DEFAULT false,
    "flag_reason" TEXT,
    "cooling_period_ends_at" TIMESTAMPTZ,
    "can_process_after" TIMESTAMPTZ,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_approvals" (
    "id" TEXT NOT NULL,
    "withdrawal_id" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "notes" TEXT,
    "approved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "initiator_id" TEXT NOT NULL,
    "counterparty_id" TEXT,
    "initiator_role" "InitiatorRole" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "OrderCategory" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "amount_minor" BIGINT NOT NULL,
    "fee_payer" "FeePayer" NOT NULL,
    "platform_fee_minor" BIGINT NOT NULL,
    "holding_period_days" INTEGER NOT NULL,
    "custom_terms" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_ACCEPT',
    "invite_token" TEXT NOT NULL,
    "invite_expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "auto_release_at" TIMESTAMPTZ,
    "auto_release_job_id" TEXT,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_holds" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "buyer_wallet_id" TEXT NOT NULL,
    "seller_wallet_id" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "amount_minor" BIGINT NOT NULL,
    "status" "EscrowHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "timeout_at" TIMESTAMPTZ,
    "timeout_job_id" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "escrow_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_settlements" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "seller_user_id" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "seller_amount_minor" BIGINT NOT NULL,
    "buyer_refund_minor" BIGINT NOT NULL,
    "platform_fee_minor" BIGINT NOT NULL,
    "settled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_proofs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "courier" TEXT,
    "tracking_number" TEXT,
    "file_urls" JSONB NOT NULL,
    "notes" TEXT NOT NULL,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "response_deadline" TIMESTAMP(3),
    "escalated_at" TIMESTAMP(3),
    "escalated_to" TEXT,
    "arbitrator_id" TEXT,
    "decision" "DisputeDecision" NOT NULL DEFAULT 'NONE',
    "seller_amount_minor" BIGINT,
    "buyer_refund_minor" BIGINT,
    "admin_notes" TEXT,
    "resolution_notes" TEXT,
    "can_appeal" BOOLEAN NOT NULL DEFAULT true,
    "appeal_deadline" TIMESTAMP(3),
    "appeal_count" INTEGER NOT NULL DEFAULT 0,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidence" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "file_urls" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_timeline" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "score" SMALLINT NOT NULL,
    "review" TEXT,
    "is_moderated" BOOLEAN NOT NULL DEFAULT false,
    "moderated_at" TIMESTAMPTZ,
    "moderated_by" TEXT,
    "moderation_action" TEXT,
    "moderation_notes" TEXT,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "hidden_reason" TEXT,
    "contains_profanity" BOOLEAN NOT NULL DEFAULT false,
    "toxicity_score" DECIMAL(5,2),
    "has_response" BOOLEAN NOT NULL DEFAULT false,
    "response_text" TEXT,
    "responded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "id_card_object_key" TEXT NOT NULL,
    "selfie_object_key" TEXT NOT NULL,
    "id_card_hash" TEXT NOT NULL,
    "selfie_hash" TEXT NOT NULL,
    "full_name_enc" TEXT NOT NULL,
    "id_number_enc" TEXT NOT NULL,
    "date_of_birth_enc" TEXT NOT NULL,
    "address_enc" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "kyc_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "max_usages" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_usages" (
    "id" TEXT NOT NULL,
    "referral_code_id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "required_action" TEXT,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL,
    "referral_usage_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reward_type" "ReferralRewardType" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "amount_minor" BIGINT NOT NULL,
    "tier" INTEGER,
    "description" TEXT,
    "status" "ReferralRewardStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promos_code_key" ON "promos"("code");

-- CreateIndex
CREATE INDEX "promos_is_active_valid_from_valid_until_idx" ON "promos"("is_active", "valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "promos_target_type_idx" ON "promos"("target_type");

-- CreateIndex
CREATE INDEX "promo_assignments_user_id_idx" ON "promo_assignments"("user_id");

-- CreateIndex
CREATE INDEX "promo_assignments_promo_id_idx" ON "promo_assignments"("promo_id");

-- CreateIndex
CREATE UNIQUE INDEX "promo_assignments_promo_id_user_id_key" ON "promo_assignments"("promo_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_status_valid_from_valid_until_idx" ON "vouchers"("status", "valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "vouchers_assigned_to_user_id_idx" ON "vouchers"("assigned_to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_usages_idempotency_key_key" ON "voucher_usages"("idempotency_key");

-- CreateIndex
CREATE INDEX "voucher_usages_voucher_id_used_at_idx" ON "voucher_usages"("voucher_id", "used_at");

-- CreateIndex
CREATE INDEX "voucher_usages_user_id_idx" ON "voucher_usages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_kyc_status_idx" ON "users"("kyc_status");

-- CreateIndex
CREATE INDEX "users_kyc_status_email_verified_at_idx" ON "users"("kyc_status", "email_verified_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_is_admin_deleted_at_idx" ON "users"("is_admin", "deleted_at");

-- CreateIndex
CREATE INDEX "users_email_email_verified_at_idx" ON "users"("email", "email_verified_at");

-- CreateIndex
CREATE INDEX "users_reputationScore_idx" ON "users"("reputationScore" DESC);

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "sessions_session_family_id_idx" ON "sessions"("session_family_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "user_activities_user_id_created_at_idx" ON "user_activities"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_activities_activity_type_created_at_idx" ON "user_activities"("activity_type", "created_at");

-- CreateIndex
CREATE INDEX "user_activities_created_at_idx" ON "user_activities"("created_at");

-- CreateIndex
CREATE INDEX "order_comments_order_id_created_at_idx" ON "order_comments"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_comments_deleted_at_idx" ON "order_comments"("deleted_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_created_at_idx" ON "audit_logs"("performed_by", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_correlation_id_idx" ON "audit_logs"("correlation_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_is_active_idx" ON "system_configs"("key", "is_active");

-- CreateIndex
CREATE INDEX "transaction_limits_user_id_is_active_idx" ON "transaction_limits"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "transaction_limits_kyc_status_is_active_idx" ON "transaction_limits"("kyc_status", "is_active");

-- CreateIndex
CREATE INDEX "transaction_limits_overridden_by_idx" ON "transaction_limits"("overridden_by");

-- CreateIndex
CREATE INDEX "fee_configs_orderCategory_is_active_idx" ON "fee_configs"("orderCategory", "is_active");

-- CreateIndex
CREATE INDEX "fee_configs_effective_from_effective_until_idx" ON "fee_configs"("effective_from", "effective_until");

-- CreateIndex
CREATE INDEX "scheduled_jobs_job_type_status_scheduled_at_idx" ON "scheduled_jobs"("job_type", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "scheduled_jobs_scheduled_at_status_idx" ON "scheduled_jobs"("scheduled_at", "status");

-- CreateIndex
CREATE INDEX "scheduled_jobs_entity_type_entity_id_idx" ON "scheduled_jobs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_user_id_idx" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_last_reconciled_at_idx" ON "wallets"("last_reconciled_at");

-- CreateIndex
CREATE INDEX "ledger_accounts_wallet_id_type_currency_idx" ON "ledger_accounts"("wallet_id", "type", "currency");

-- CreateIndex
CREATE INDEX "ledger_accounts_platform_key_type_currency_idx" ON "ledger_accounts"("platform_key", "type", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_journals_idempotency_key_key" ON "ledger_journals"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_journals_deposit_id_key" ON "ledger_journals"("deposit_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_journals_withdrawal_id_key" ON "ledger_journals"("withdrawal_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_journals_dispute_id_key" ON "ledger_journals"("dispute_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_journals_referral_reward_id_key" ON "ledger_journals"("referral_reward_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_journals_voucher_usage_id_key" ON "ledger_journals"("voucher_usage_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_journals_order_settlement_id_key" ON "ledger_journals"("order_settlement_id");

-- CreateIndex
CREATE INDEX "ledger_journals_created_at_idx" ON "ledger_journals"("created_at");

-- CreateIndex
CREATE INDEX "ledger_journals_type_created_at_idx" ON "ledger_journals"("type", "created_at");

-- CreateIndex
CREATE INDEX "ledger_journals_deposit_id_idx" ON "ledger_journals"("deposit_id");

-- CreateIndex
CREATE INDEX "ledger_journals_withdrawal_id_idx" ON "ledger_journals"("withdrawal_id");

-- CreateIndex
CREATE INDEX "ledger_journals_dispute_id_idx" ON "ledger_journals"("dispute_id");

-- CreateIndex
CREATE INDEX "ledger_journals_referral_reward_id_idx" ON "ledger_journals"("referral_reward_id");

-- CreateIndex
CREATE INDEX "ledger_journals_voucher_usage_id_idx" ON "ledger_journals"("voucher_usage_id");

-- CreateIndex
CREATE INDEX "ledger_journals_order_settlement_id_idx" ON "ledger_journals"("order_settlement_id");

-- CreateIndex
CREATE INDEX "ledger_journals_order_id_idx" ON "ledger_journals"("order_id");

-- CreateIndex
CREATE INDEX "ledger_journals_escrow_hold_id_idx" ON "ledger_journals"("escrow_hold_id");

-- CreateIndex
CREATE INDEX "ledger_journals_order_id_created_at_idx" ON "ledger_journals"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_journals_escrow_hold_id_created_at_idx" ON "ledger_journals"("escrow_hold_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_account_id_created_at_id_idx" ON "ledger_entries"("account_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "ledger_entries_account_id_journal_id_idx" ON "ledger_entries"("account_id", "journal_id");

-- CreateIndex
CREATE INDEX "ledger_entries_journal_id_created_at_idx" ON "ledger_entries"("journal_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_adjustments_user_id_status_idx" ON "wallet_adjustments"("user_id", "status");

-- CreateIndex
CREATE INDEX "wallet_adjustments_status_requested_at_idx" ON "wallet_adjustments"("status", "requested_at");

-- CreateIndex
CREATE INDEX "wallet_adjustments_requested_by_idx" ON "wallet_adjustments"("requested_by");

-- CreateIndex
CREATE INDEX "wallet_adjustments_approved_by_idx" ON "wallet_adjustments"("approved_by");

-- CreateIndex
CREATE INDEX "password_history_user_id_created_at_idx" ON "password_history"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_idempotency_key_key" ON "idempotency_records"("idempotency_key");

-- CreateIndex
CREATE INDEX "idempotency_records_user_id_created_at_idx" ON "idempotency_records"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

-- CreateIndex
CREATE INDEX "mfa_backup_codes_user_id_used_at_idx" ON "mfa_backup_codes"("user_id", "used_at");

-- CreateIndex
CREATE INDEX "security_events_user_id_created_at_idx" ON "security_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "security_events_event_type_created_at_idx" ON "security_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "security_events_severity_is_alerted_idx" ON "security_events"("severity", "is_alerted");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_invoice_id_key" ON "payments"("provider_invoice_id");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_provider_provider_invoice_id_idx" ON "payments"("provider", "provider_invoice_id");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_user_id_status_created_at_idx" ON "payments"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "payments_is_reconciled_settlement_date_idx" ON "payments"("is_reconciled", "settlement_date");

-- CreateIndex
CREATE INDEX "payments_expires_at_status_idx" ON "payments"("expires_at", "status");

-- CreateIndex
CREATE INDEX "payment_status_history_payment_id_changed_at_idx" ON "payment_status_history"("payment_id", "changed_at");

-- CreateIndex
CREATE INDEX "payment_status_history_webhook_event_id_idx" ON "payment_status_history"("webhook_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "webhook_events_provider_received_at_idx" ON "webhook_events"("provider", "received_at");

-- CreateIndex
CREATE INDEX "webhook_events_status_retry_count_idx" ON "webhook_events"("status", "retry_count");

-- CreateIndex
CREATE INDEX "webhook_events_event_type_idx" ON "webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "webhook_events_payment_id_idx" ON "webhook_events"("payment_id");

-- CreateIndex
CREATE INDEX "webhook_events_signature_valid_status_idx" ON "webhook_events"("signature_valid", "status");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_payment_id_key" ON "deposits"("payment_id");

-- CreateIndex
CREATE INDEX "deposits_wallet_id_status_idx" ON "deposits"("wallet_id", "status");

-- CreateIndex
CREATE INDEX "deposits_created_at_idx" ON "deposits"("created_at");

-- CreateIndex
CREATE INDEX "bank_accounts_user_id_is_default_idx" ON "bank_accounts"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "bank_accounts_user_id_is_active_is_default_idx" ON "bank_accounts"("user_id", "is_active", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_idempotency_key_key" ON "withdrawals"("idempotency_key");

-- CreateIndex
CREATE INDEX "withdrawals_status_requested_at_idx" ON "withdrawals"("status", "requested_at");

-- CreateIndex
CREATE INDEX "withdrawals_wallet_id_requested_at_idx" ON "withdrawals"("wallet_id", "requested_at");

-- CreateIndex
CREATE INDEX "withdrawals_requires_multiple_approvals_approval_count_idx" ON "withdrawals"("requires_multiple_approvals", "approval_count");

-- CreateIndex
CREATE INDEX "withdrawals_user_id_requested_at_idx" ON "withdrawals"("user_id", "requested_at");

-- CreateIndex
CREATE INDEX "withdrawals_is_flagged_by_system_status_idx" ON "withdrawals"("is_flagged_by_system", "status");

-- CreateIndex
CREATE INDEX "withdrawals_can_process_after_status_idx" ON "withdrawals"("can_process_after", "status");

-- CreateIndex
CREATE INDEX "withdrawals_cooling_period_ends_at_idx" ON "withdrawals"("cooling_period_ends_at");

-- CreateIndex
CREATE INDEX "withdrawal_approvals_withdrawal_id_idx" ON "withdrawal_approvals"("withdrawal_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_approvals_withdrawal_id_approved_by_key" ON "withdrawal_approvals"("withdrawal_id", "approved_by");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_invite_token_key" ON "orders"("invite_token");

-- CreateIndex
CREATE UNIQUE INDEX "orders_auto_release_job_id_key" ON "orders"("auto_release_job_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_invite_token_idx" ON "orders"("invite_token");

-- CreateIndex
CREATE INDEX "orders_auto_release_at_status_idx" ON "orders"("auto_release_at", "status");

-- CreateIndex
CREATE INDEX "orders_invite_expires_at_idx" ON "orders"("invite_expires_at");

-- CreateIndex
CREATE INDEX "orders_initiator_id_status_created_at_idx" ON "orders"("initiator_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_counterparty_id_status_created_at_idx" ON "orders"("counterparty_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_auto_release_at_idx" ON "orders"("status", "auto_release_at");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_holds_order_id_key" ON "escrow_holds"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_holds_timeout_job_id_key" ON "escrow_holds"("timeout_job_id");

-- CreateIndex
CREATE INDEX "escrow_holds_status_created_at_idx" ON "escrow_holds"("status", "created_at");

-- CreateIndex
CREATE INDEX "escrow_holds_buyer_wallet_id_idx" ON "escrow_holds"("buyer_wallet_id");

-- CreateIndex
CREATE INDEX "escrow_holds_seller_wallet_id_idx" ON "escrow_holds"("seller_wallet_id");

-- CreateIndex
CREATE INDEX "escrow_holds_timeout_at_status_idx" ON "escrow_holds"("timeout_at", "status");

-- CreateIndex
CREATE UNIQUE INDEX "order_settlements_order_id_key" ON "order_settlements"("order_id");

-- CreateIndex
CREATE INDEX "order_settlements_order_id_idx" ON "order_settlements"("order_id");

-- CreateIndex
CREATE INDEX "order_settlements_seller_user_id_idx" ON "order_settlements"("seller_user_id");

-- CreateIndex
CREATE INDEX "order_settlements_buyer_user_id_idx" ON "order_settlements"("buyer_user_id");

-- CreateIndex
CREATE INDEX "order_settlements_settled_at_idx" ON "order_settlements"("settled_at");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_proofs_order_id_key" ON "delivery_proofs"("order_id");

-- CreateIndex
CREATE INDEX "delivery_proofs_order_id_idx" ON "delivery_proofs"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_order_id_key" ON "disputes"("order_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_response_deadline_idx" ON "disputes"("response_deadline");

-- CreateIndex
CREATE INDEX "disputes_appeal_deadline_idx" ON "disputes"("appeal_deadline");

-- CreateIndex
CREATE INDEX "dispute_evidence_dispute_id_submitted_at_idx" ON "dispute_evidence"("dispute_id", "submitted_at");

-- CreateIndex
CREATE INDEX "dispute_timeline_dispute_id_created_at_idx" ON "dispute_timeline"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "ratings_to_user_id_is_hidden_created_at_idx" ON "ratings"("to_user_id", "is_hidden", "created_at");

-- CreateIndex
CREATE INDEX "ratings_score_created_at_idx" ON "ratings"("score", "created_at");

-- CreateIndex
CREATE INDEX "ratings_is_moderated_contains_profanity_idx" ON "ratings"("is_moderated", "contains_profanity");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_order_id_from_user_id_key" ON "ratings"("order_id", "from_user_id");

-- CreateIndex
CREATE INDEX "kyc_submissions_status_submitted_at_idx" ON "kyc_submissions"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "kyc_submissions_user_id_attempt_number_idx" ON "kyc_submissions"("user_id", "attempt_number");

-- CreateIndex
CREATE INDEX "kyc_submissions_expires_at_idx" ON "kyc_submissions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_user_id_key" ON "referral_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_is_active_expires_at_idx" ON "referral_codes"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "referral_usages_referrer_id_status_idx" ON "referral_usages"("referrer_id", "status");

-- CreateIndex
CREATE INDEX "referral_usages_referred_user_id_idx" ON "referral_usages"("referred_user_id");

-- CreateIndex
CREATE INDEX "referral_usages_status_completed_at_idx" ON "referral_usages"("status", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "referral_usages_referral_code_id_referred_user_id_key" ON "referral_usages"("referral_code_id", "referred_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_rewards_idempotency_key_key" ON "referral_rewards"("idempotency_key");

-- CreateIndex
CREATE INDEX "referral_rewards_user_id_status_idx" ON "referral_rewards"("user_id", "status");

-- CreateIndex
CREATE INDEX "referral_rewards_referral_usage_id_idx" ON "referral_rewards"("referral_usage_id");

-- CreateIndex
CREATE INDEX "referral_rewards_expires_at_idx" ON "referral_rewards"("expires_at");

-- AddForeignKey
ALTER TABLE "promo_assignments" ADD CONSTRAINT "promo_assignments_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_assignments" ADD CONSTRAINT "promo_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_usages" ADD CONSTRAINT "voucher_usages_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_usages" ADD CONSTRAINT "voucher_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_replaced_by_session_id_fkey" FOREIGN KEY ("replaced_by_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_limits" ADD CONSTRAINT "transaction_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_limits" ADD CONSTRAINT "transaction_limits_overridden_by_fkey" FOREIGN KEY ("overridden_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_referral_reward_id_fkey" FOREIGN KEY ("referral_reward_id") REFERENCES "referral_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_voucher_usage_id_fkey" FOREIGN KEY ("voucher_usage_id") REFERENCES "voucher_usages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_order_settlement_id_fkey" FOREIGN KEY ("order_settlement_id") REFERENCES "order_settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_escrow_hold_id_fkey" FOREIGN KEY ("escrow_hold_id") REFERENCES "escrow_holds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "ledger_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reconciled_by_fkey" FOREIGN KEY ("reconciled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_webhook_event_id_fkey" FOREIGN KEY ("webhook_event_id") REFERENCES "webhook_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_approvals" ADD CONSTRAINT "withdrawal_approvals_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_approvals" ADD CONSTRAINT "withdrawal_approvals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_holds" ADD CONSTRAINT "escrow_holds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_holds" ADD CONSTRAINT "escrow_holds_buyer_wallet_id_fkey" FOREIGN KEY ("buyer_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_holds" ADD CONSTRAINT "escrow_holds_seller_wallet_id_fkey" FOREIGN KEY ("seller_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_settlements" ADD CONSTRAINT "order_settlements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_settlements" ADD CONSTRAINT "order_settlements_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_settlements" ADD CONSTRAINT "order_settlements_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_arbitrator_id_fkey" FOREIGN KEY ("arbitrator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_timeline" ADD CONSTRAINT "dispute_timeline_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_timeline" ADD CONSTRAINT "dispute_timeline_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_submissions" ADD CONSTRAINT "kyc_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_submissions" ADD CONSTRAINT "kyc_submissions_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referral_usage_id_fkey" FOREIGN KEY ("referral_usage_id") REFERENCES "referral_usages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

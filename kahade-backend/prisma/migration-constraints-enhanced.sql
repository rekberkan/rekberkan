-- ============================================================================
-- ENHANCED DATABASE CONSTRAINTS FOR BANK-GRADE SECURITY
-- Run after Prisma migrations to add business logic constraints
-- ============================================================================

-- ============================================================================
-- TIER-0: STATE MACHINE CONSTRAINTS (CRITICAL)
-- ============================================================================

-- Order Status State Machine
ALTER TABLE orders ADD CONSTRAINT check_order_status_valid
  CHECK (status IN (
    'PENDING_ACCEPT', 'ACCEPTED', 'PAID', 'COMPLETED', 
    'CANCELLED', 'DISPUTED', 'REFUNDED'
  ));

-- Payment Status State Machine
ALTER TABLE payments ADD CONSTRAINT check_payment_status_valid
  CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'));

-- Withdrawal Status State Machine  
ALTER TABLE withdrawals ADD CONSTRAINT check_withdrawal_status_valid
  CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'));

-- Escrow Hold Status State Machine
ALTER TABLE escrow_holds ADD CONSTRAINT check_escrow_status_valid
  CHECK (status IN ('ACTIVE', 'RELEASED', 'REFUNDED', 'DISPUTED', 'ADJUSTED'));

-- Dispute Status State Machine
ALTER TABLE disputes ADD CONSTRAINT check_dispute_status_valid
  CHECK (status IN (
    'OPEN', 'RESPONDED', 'ESCALATED', 'UNDER_ARBITRATION', 
    'DECIDED', 'APPEALED', 'CLOSED'
  ));

-- ============================================================================
-- TIER-1: MONEY & FINANCIAL CONSTRAINTS (ZERO TOLERANCE)
-- ============================================================================

-- Wallet: Balances must be non-negative
ALTER TABLE wallets ADD CONSTRAINT check_wallet_balance_non_negative
  CHECK (balance_minor >= 0);

ALTER TABLE wallets ADD CONSTRAINT check_wallet_locked_non_negative
  CHECK (locked_minor >= 0);

ALTER TABLE wallets ADD CONSTRAINT check_wallet_locked_not_exceed_balance
  CHECK (locked_minor <= balance_minor);

-- Payment: Amount must be positive
ALTER TABLE payments ADD CONSTRAINT check_payment_amount_positive
  CHECK (amount_minor > 0);

-- Withdrawal: Amount must be positive
ALTER TABLE withdrawals ADD CONSTRAINT check_withdrawal_amount_positive
  CHECK (amount_minor > 0);

-- Order: Amount must be positive
ALTER TABLE orders ADD CONSTRAINT check_order_amount_positive
  CHECK (amount_minor > 0);

-- Order: Platform fee must be non-negative
ALTER TABLE orders ADD CONSTRAINT check_order_platform_fee_non_negative
  CHECK (platform_fee_minor >= 0);

-- Escrow: Amount must be positive
ALTER TABLE escrow_holds ADD CONSTRAINT check_escrow_amount_positive
  CHECK (amount_minor > 0);

-- Ledger Entry: Amount cannot be zero (must be debit or credit)
ALTER TABLE ledger_entries ADD CONSTRAINT check_ledger_entry_amount_not_zero
  CHECK (amount_minor != 0);

-- ============================================================================
-- TIER-2: WEBHOOK SECURITY CONSTRAINTS (CRITICAL)
-- ============================================================================

-- Webhook: Signature validation MUST be performed
ALTER TABLE webhook_events ADD CONSTRAINT check_webhook_signature_validated
  CHECK (signature_valid IS NOT NULL);

-- Webhook: Cannot process without valid signature
CREATE OR REPLACE FUNCTION check_webhook_processed_only_if_valid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PROCESSED' AND NEW.signature_valid = FALSE THEN
    RAISE EXCEPTION 'Cannot process webhook with invalid signature';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_webhook_signature_before_processing
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION check_webhook_processed_only_if_valid();

-- ============================================================================
-- TIER-3: WITHDRAWAL LIMITS & VELOCITY (BANK-GRADE)
-- ============================================================================

-- TransactionLimit: Daily used cannot exceed limit
ALTER TABLE transaction_limits ADD CONSTRAINT check_daily_withdrawal_limit
  CHECK (daily_withdrawal_used_minor <= daily_withdrawal_limit_minor);

-- TransactionLimit: Monthly used cannot exceed limit
ALTER TABLE transaction_limits ADD CONSTRAINT check_monthly_withdrawal_limit
  CHECK (monthly_withdrawal_used_minor <= monthly_withdrawal_limit_minor);

-- TransactionLimit: Cooling period must be non-negative
ALTER TABLE transaction_limits ADD CONSTRAINT check_cooling_period_positive
  CHECK (cooling_period_minutes >= 0);

-- Withdrawal: Multi-approval count cannot exceed required
ALTER TABLE withdrawals ADD CONSTRAINT check_withdrawal_approval_count
  CHECK (approval_count <= required_approvals);

-- Withdrawal: Required approvals must be at least 1
ALTER TABLE withdrawals ADD CONSTRAINT check_withdrawal_required_approvals_min
  CHECK (required_approvals >= 1);

-- ============================================================================
-- TIER-4: TEMPORAL CONSTRAINTS (DATA INTEGRITY)
-- ============================================================================

-- Order: Auto-release date must be after paid date
ALTER TABLE orders ADD CONSTRAINT check_order_auto_release_after_paid
  CHECK (auto_release_at IS NULL OR paid_at IS NULL OR auto_release_at > paid_at);

-- Order: Completed date must be after paid date
ALTER TABLE orders ADD CONSTRAINT check_order_completed_after_paid
  CHECK (completed_at IS NULL OR paid_at IS NULL OR completed_at >= paid_at);

-- Payment: Paid date must be before or at expiry
ALTER TABLE payments ADD CONSTRAINT check_payment_paid_before_expiry
  CHECK (paid_at IS NULL OR expires_at IS NULL OR paid_at <= expires_at);

-- Withdrawal: Approved date before completed date
ALTER TABLE withdrawals ADD CONSTRAINT check_withdrawal_approved_before_completed
  CHECK (completed_at IS NULL OR approved_at IS NULL OR completed_at >= approved_at);

-- ============================================================================
-- TIER-5: RATING & REPUTATION CONSTRAINTS
-- ============================================================================

-- Rating: Score must be between 1 and 5
ALTER TABLE ratings ADD CONSTRAINT check_rating_score_range
  CHECK (score >= 1 AND score <= 5);

-- Rating: Toxicity score must be between 0 and 100
ALTER TABLE ratings ADD CONSTRAINT check_rating_toxicity_range
  CHECK (toxicity_score IS NULL OR (toxicity_score >= 0 AND toxicity_score <= 100));

-- User: Reputation score must be between 0 and 5
ALTER TABLE users ADD CONSTRAINT check_user_reputation_range
  CHECK (reputation_score >= 0 AND reputation_score <= 5);

-- ============================================================================
-- TIER-6: DISPUTE CONSTRAINTS
-- ============================================================================

-- Dispute: Settlement amounts must be non-negative
ALTER TABLE disputes ADD CONSTRAINT check_dispute_seller_amount_non_negative
  CHECK (seller_amount_minor IS NULL OR seller_amount_minor >= 0);

ALTER TABLE disputes ADD CONSTRAINT check_dispute_buyer_refund_non_negative
  CHECK (buyer_refund_minor IS NULL OR buyer_refund_minor >= 0);

-- Dispute: Appeal count must be non-negative
ALTER TABLE disputes ADD CONSTRAINT check_dispute_appeal_count_non_negative
  CHECK (appeal_count >= 0);

-- ============================================================================
-- TIER-7: LEDGER IMMUTABILITY (BANK-GRADE)
-- ============================================================================

-- Prevent UPDATE and DELETE on ledger_entries (append-only)
CREATE OR REPLACE FUNCTION prevent_ledger_entry_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are immutable. Cannot UPDATE or DELETE.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_ledger_entry_immutability_update
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_entry_modification();

CREATE TRIGGER enforce_ledger_entry_immutability_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_entry_modification();

-- Prevent UPDATE and DELETE on ledger_journals (append-only)
CREATE TRIGGER enforce_ledger_journal_immutability_update
  BEFORE UPDATE ON ledger_journals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_entry_modification();

CREATE TRIGGER enforce_ledger_journal_immutability_delete
  BEFORE DELETE ON ledger_journals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_entry_modification();

-- ============================================================================
-- TIER-8: PARTIAL UNIQUE INDEXES (COMPLEX CONSTRAINTS)
-- ============================================================================

-- LedgerAccount: Unique per wallet + type + currency (when wallet_id IS NOT NULL)
CREATE UNIQUE INDEX idx_ledger_account_wallet_unique
  ON ledger_accounts(wallet_id, type, currency)
  WHERE wallet_id IS NOT NULL;

-- LedgerAccount: Unique per platform_key + type + currency (when platform_key IS NOT NULL)
CREATE UNIQUE INDEX idx_ledger_account_platform_unique
  ON ledger_accounts(platform_key, type, currency)
  WHERE platform_key IS NOT NULL;

-- BankAccount: Only one default per user
CREATE UNIQUE INDEX idx_bank_account_one_default_per_user
  ON bank_accounts(user_id)
  WHERE is_default = TRUE AND deleted_at IS NULL;

-- ============================================================================
-- TIER-9: XOR CONSTRAINTS (BUSINESS LOGIC)
-- ============================================================================

-- LedgerAccount: Must have EITHER wallet_id OR platform_key (not both, not neither)
ALTER TABLE ledger_accounts ADD CONSTRAINT check_ledger_account_owner_xor
  CHECK (
    (wallet_id IS NOT NULL AND platform_key IS NULL) OR
    (wallet_id IS NULL AND platform_key IS NOT NULL)
  );

-- ============================================================================
-- TIER-10: PERFORMANCE INDEXES (OPTIMIZED)
-- ============================================================================

-- Composite index for common wallet balance queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_reconciled
  ON wallets(user_id, last_reconciled_at DESC);

-- Composite index for payment reconciliation queries
CREATE INDEX IF NOT EXISTS idx_payments_reconciliation
  ON payments(is_reconciled, settlement_date DESC)
  WHERE status = 'SUCCESS';

-- Composite index for withdrawal velocity checks
CREATE INDEX IF NOT EXISTS idx_withdrawals_velocity_check
  ON withdrawals(user_id, status, requested_at DESC);

-- Composite index for ledger entry balance calculation
CREATE INDEX IF NOT EXISTS idx_ledger_entries_balance_calc
  ON ledger_entries(account_id, created_at, id);

-- ============================================================================
-- VERIFICATION QUERIES (RUN AFTER DEPLOYMENT)
-- ============================================================================

-- Verify all constraints are created
-- SELECT conname, contype, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text LIKE '%wallets%'
--   OR conrelid::regclass::text LIKE '%payments%'
--   OR conrelid::regclass::text LIKE '%withdrawals%'
-- ORDER BY conname;

-- Verify all triggers are created
-- SELECT tgname, tgrelid::regclass, tgtype
-- FROM pg_trigger
-- WHERE tgname LIKE '%enforce%'
-- ORDER BY tgname;

-- ============================================================================
-- END OF CONSTRAINTS
-- ============================================================================

-- DEPLOYMENT NOTES:
-- 1. Run this AFTER all Prisma migrations
-- 2. Test in staging environment first
-- 3. Some constraints may fail on existing data - fix data first
-- 4. Monitor query performance after deployment
-- 5. Document any constraint exceptions granted

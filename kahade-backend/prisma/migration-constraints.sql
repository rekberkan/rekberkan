-- ============================================================================
-- KAHADE ESCROW - COMPLETE FINANCIAL CONSTRAINTS & TRIGGERS
-- ============================================================================
-- CRITICAL: Run this SQL AFTER running `prisma migrate dev`
-- This file contains all DB-level constraints that Prisma cannot express
-- ============================================================================

-- ============================================================================
-- PART 1: LEDGER ACCOUNTS - XOR & UNIQUE CONSTRAINTS
-- ============================================================================

-- Partial unique index: wallet accounts must be unique per (wallet_id, type, currency)
CREATE UNIQUE INDEX IF NOT EXISTS ledger_accounts_wallet_unique
  ON ledger_accounts(wallet_id, type, currency)
  WHERE wallet_id IS NOT NULL;

-- Partial unique index: platform accounts must be unique per (platform_key, type, currency)
CREATE UNIQUE INDEX IF NOT EXISTS ledger_accounts_platform_unique
  ON ledger_accounts(platform_key, type, currency)
  WHERE platform_key IS NOT NULL;

-- XOR constraint: account must have EITHER wallet_id OR platform_key (not both, not neither)
ALTER TABLE ledger_accounts 
  DROP CONSTRAINT IF EXISTS ledger_accounts_xor_owner;

ALTER TABLE ledger_accounts 
  ADD CONSTRAINT ledger_accounts_xor_owner CHECK (
    ((wallet_id IS NOT NULL)::int + (platform_key IS NOT NULL)::int) = 1
  );

-- Validate platform_key against allowed keys
ALTER TABLE ledger_accounts 
  DROP CONSTRAINT IF EXISTS valid_platform_key;

ALTER TABLE ledger_accounts 
  ADD CONSTRAINT valid_platform_key CHECK (
    platform_key IS NULL OR 
    platform_key IN (SELECT key FROM platform_account_keys WHERE is_active = TRUE)
  );

-- ============================================================================
-- PART 2: LEDGER JOURNAL - SINGLE OWNER CONSTRAINT (CRITICAL)
-- ============================================================================

-- Journal can have at most ONE 1:1 entity link
ALTER TABLE ledger_journals 
  DROP CONSTRAINT IF EXISTS ledger_journals_single_owner_1to1;

ALTER TABLE ledger_journals 
  ADD CONSTRAINT ledger_journals_single_owner_1to1 CHECK (
    ((deposit_id IS NOT NULL)::int +
     (withdrawal_id IS NOT NULL)::int +
     (dispute_id IS NOT NULL)::int +
     (referral_reward_id IS NOT NULL)::int +
     (voucher_usage_id IS NOT NULL)::int +
     (order_settlement_id IS NOT NULL)::int
    ) <= 1
  );

-- Journal type-specific link requirements
ALTER TABLE ledger_journals 
  DROP CONSTRAINT IF EXISTS journal_link_by_type_rules;

ALTER TABLE ledger_journals 
  ADD CONSTRAINT journal_link_by_type_rules CHECK (
    CASE type
      -- DEPOSIT must have deposit_id, no other links
      WHEN 'DEPOSIT_CREDIT' THEN 
        deposit_id IS NOT NULL 
        AND withdrawal_id IS NULL 
        AND dispute_id IS NULL 
        AND referral_reward_id IS NULL
        AND voucher_usage_id IS NULL 
        AND order_settlement_id IS NULL
        AND order_id IS NULL 
        AND escrow_hold_id IS NULL
      
      -- WITHDRAWAL must have withdrawal_id, no other links
      WHEN 'WITHDRAWAL_LOCK' THEN 
        withdrawal_id IS NOT NULL 
        AND deposit_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL 
        AND order_id IS NULL 
        AND escrow_hold_id IS NULL
      
      WHEN 'WITHDRAWAL_RELEASE' THEN 
        withdrawal_id IS NOT NULL 
        AND deposit_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL 
        AND order_id IS NULL 
        AND escrow_hold_id IS NULL
      
      WHEN 'WITHDRAWAL_DEBIT' THEN 
        withdrawal_id IS NOT NULL 
        AND deposit_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL 
        AND order_id IS NULL 
        AND escrow_hold_id IS NULL
      
      -- ESCROW must have both escrow_hold_id AND order_id
      WHEN 'ESCROW_HOLD' THEN 
        escrow_hold_id IS NOT NULL 
        AND order_id IS NOT NULL
        AND deposit_id IS NULL 
        AND withdrawal_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL
      
      WHEN 'ESCROW_RELEASE' THEN 
        escrow_hold_id IS NOT NULL 
        AND order_id IS NOT NULL
        AND deposit_id IS NULL 
        AND withdrawal_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL
      
      WHEN 'ESCROW_REFUND' THEN 
        escrow_hold_id IS NOT NULL 
        AND order_id IS NOT NULL
        AND deposit_id IS NULL 
        AND withdrawal_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL
      
      -- FEE_CHARGE can be linked to order or escrow
      WHEN 'FEE_CHARGE' THEN 
        (order_id IS NOT NULL OR escrow_hold_id IS NOT NULL)
        AND deposit_id IS NULL 
        AND withdrawal_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL
      
      -- DISPUTE must have dispute_id and order_id
      WHEN 'DISPUTE_SETTLEMENT' THEN 
        dispute_id IS NOT NULL 
        AND order_id IS NOT NULL
        AND deposit_id IS NULL 
        AND withdrawal_id IS NULL 
        AND escrow_hold_id IS NULL
        AND referral_reward_id IS NULL 
        AND voucher_usage_id IS NULL
        AND order_settlement_id IS NULL
      
      -- REFERRAL must have referral_reward_id
      WHEN 'REFERRAL_REWARD' THEN 
        referral_reward_id IS NOT NULL
        AND deposit_id IS NULL 
        AND withdrawal_id IS NULL 
        AND dispute_id IS NULL
        AND voucher_usage_id IS NULL 
        AND order_settlement_id IS NULL
        AND order_id IS NULL 
        AND escrow_hold_id IS NULL
      
      -- PROMO_CREDIT must have voucher_usage_id
      WHEN 'PROMO_CREDIT' THEN 
        voucher_usage_id IS NOT NULL
        AND deposit_id IS NULL 
        AND withdrawal_id IS NULL 
        AND dispute_id IS NULL
        AND referral_reward_id IS NULL 
        AND order_settlement_id IS NULL
        AND order_id IS NULL 
        AND escrow_hold_id IS NULL
      
      -- ADJUSTMENT can be standalone or linked
      WHEN 'ADJUSTMENT' THEN TRUE
      
      ELSE FALSE
    END
  );

-- Ensure escrow_hold journals are unique per type
CREATE UNIQUE INDEX IF NOT EXISTS escrow_hold_one_lock_journal
  ON ledger_journals(escrow_hold_id)
  WHERE escrow_hold_id IS NOT NULL AND type = 'ESCROW_HOLD';

CREATE UNIQUE INDEX IF NOT EXISTS escrow_hold_one_release_journal
  ON ledger_journals(escrow_hold_id)
  WHERE escrow_hold_id IS NOT NULL AND type = 'ESCROW_RELEASE';

CREATE UNIQUE INDEX IF NOT EXISTS escrow_hold_one_refund_journal
  ON ledger_journals(escrow_hold_id)
  WHERE escrow_hold_id IS NOT NULL AND type = 'ESCROW_REFUND';

-- Ensure withdrawal journals are unique per type
CREATE UNIQUE INDEX IF NOT EXISTS withdrawal_one_lock_journal
  ON ledger_journals(withdrawal_id)
  WHERE withdrawal_id IS NOT NULL AND type = 'WITHDRAWAL_LOCK';

CREATE UNIQUE INDEX IF NOT EXISTS withdrawal_one_release_journal
  ON ledger_journals(withdrawal_id)
  WHERE withdrawal_id IS NOT NULL AND type = 'WITHDRAWAL_RELEASE';

CREATE UNIQUE INDEX IF NOT EXISTS withdrawal_one_debit_journal
  ON ledger_journals(withdrawal_id)
  WHERE withdrawal_id IS NOT NULL AND type = 'WITHDRAWAL_DEBIT';

-- ============================================================================
-- PART 3: DOUBLE-ENTRY ACCOUNTING ENFORCEMENT (CRITICAL)
-- ============================================================================

-- No duplicate account in same journal
ALTER TABLE ledger_entries 
  DROP CONSTRAINT IF EXISTS ledger_entries_unique_account_per_journal;

ALTER TABLE ledger_entries 
  ADD CONSTRAINT ledger_entries_unique_account_per_journal 
  UNIQUE (journal_id, account_id);

-- Function: Check minimum 2 entries per journal
CREATE OR REPLACE FUNCTION check_journal_min_entries()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM ledger_entries WHERE journal_id = NEW.journal_id) < 2 THEN
    RAISE EXCEPTION 'Journal % must have at least 2 entries for double-entry', NEW.journal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_journal_min_entries ON ledger_entries;
CREATE CONSTRAINT TRIGGER enforce_journal_min_entries
  AFTER INSERT OR UPDATE ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_min_entries();

-- Function: Check journal balance = 0
CREATE OR REPLACE FUNCTION check_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  journal_sum BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount_minor), 0) INTO journal_sum
  FROM ledger_entries
  WHERE journal_id = NEW.journal_id;
  
  IF journal_sum != 0 THEN
    RAISE EXCEPTION 'Journal % is not balanced. Sum: %, Expected: 0', 
      NEW.journal_id, journal_sum;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_journal_balance ON ledger_entries;
CREATE CONSTRAINT TRIGGER enforce_journal_balance
  AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_balance();

-- ============================================================================
-- PART 4: LEDGER IMMUTABILITY (CRITICAL)
-- ============================================================================

-- Prevent UPDATE on ledger_journals
CREATE OR REPLACE FUNCTION prevent_ledger_journal_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger journals are immutable. Cannot UPDATE journal_id: %', OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_ledger_journals ON ledger_journals;
CREATE TRIGGER immutable_ledger_journals
  BEFORE UPDATE ON ledger_journals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_journal_update();

-- Prevent DELETE on ledger_journals
CREATE OR REPLACE FUNCTION prevent_ledger_journal_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger journals are immutable. Cannot DELETE journal_id: %', OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_ledger_journals_delete ON ledger_journals;
CREATE TRIGGER immutable_ledger_journals_delete
  BEFORE DELETE ON ledger_journals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_journal_delete();

-- Prevent UPDATE on ledger_entries
CREATE OR REPLACE FUNCTION prevent_ledger_entry_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are immutable. Cannot UPDATE entry_id: %', OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_ledger_entries ON ledger_entries;
CREATE TRIGGER immutable_ledger_entries
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_entry_update();

-- Prevent DELETE on ledger_entries
CREATE OR REPLACE FUNCTION prevent_ledger_entry_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are immutable. Cannot DELETE entry_id: %', OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_ledger_entries_delete ON ledger_entries;
CREATE TRIGGER immutable_ledger_entries_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_entry_delete();

-- Prevent DELETE on deposits (audit record)
CREATE OR REPLACE FUNCTION prevent_deposit_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Deposits are audit records and cannot be deleted. Use status updates instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_deposits ON deposits;
CREATE TRIGGER immutable_deposits
  BEFORE DELETE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION prevent_deposit_delete();

-- Prevent DELETE on withdrawals (audit record)
CREATE OR REPLACE FUNCTION prevent_withdrawal_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Withdrawals are audit records and cannot be deleted. Use status updates instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_withdrawals ON withdrawals;
CREATE TRIGGER immutable_withdrawals
  BEFORE DELETE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_withdrawal_delete();

-- ============================================================================
-- PART 5: WALLET CACHE CONSISTENCY (CRITICAL)
-- ============================================================================

-- Function to calculate actual balance from ledger
CREATE OR REPLACE FUNCTION calculate_wallet_balance(p_wallet_id UUID)
RETURNS TABLE(available_balance BIGINT, locked_balance BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE 
      WHEN la.type = 'USER_AVAILABLE' THEN le.amount_minor 
      ELSE 0 
    END), 0) as available_balance,
    COALESCE(SUM(CASE 
      WHEN la.type = 'USER_LOCKED' THEN le.amount_minor 
      ELSE 0 
    END), 0) as locked_balance
  FROM ledger_entries le
  JOIN ledger_accounts la ON le.account_id = la.id
  WHERE la.wallet_id = p_wallet_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update wallet cache on journal posting
CREATE OR REPLACE FUNCTION update_wallet_cache_on_journal()
RETURNS TRIGGER AS $$
DECLARE
  affected_wallet_ids UUID[];
  wallet_id UUID;
  calculated_balance RECORD;
BEGIN
  -- Get all affected wallet IDs from this journal's entries
  SELECT ARRAY_AGG(DISTINCT la.wallet_id)
  INTO affected_wallet_ids
  FROM ledger_entries le
  JOIN ledger_accounts la ON le.account_id = la.id
  WHERE le.journal_id = NEW.id AND la.wallet_id IS NOT NULL;
  
  -- Update each affected wallet
  FOREACH wallet_id IN ARRAY affected_wallet_ids
  LOOP
    SELECT * INTO calculated_balance 
    FROM calculate_wallet_balance(wallet_id);
    
    UPDATE wallets
    SET 
      balance_minor = calculated_balance.available_balance,
      locked_minor = calculated_balance.locked_balance,
      version = version + 1,
      last_reconciled_at = NOW(),
      reconciliation_hash = MD5(
        wallet_id::TEXT || 
        calculated_balance.available_balance::TEXT || 
        calculated_balance.locked_balance::TEXT ||
        NOW()::TEXT
      ),
      updated_at = NOW()
    WHERE id = wallet_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_wallet_cache ON ledger_journals;
CREATE TRIGGER auto_update_wallet_cache
  AFTER INSERT ON ledger_journals
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_cache_on_journal();

-- Reconciliation check function (run via scheduled job)
CREATE OR REPLACE FUNCTION reconcile_wallet_balances()
RETURNS TABLE(
  wallet_id UUID,
  cached_available BIGINT,
  actual_available BIGINT,
  cached_locked BIGINT,
  actual_locked BIGINT,
  is_matched BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as wallet_id,
    w.balance_minor as cached_available,
    COALESCE(actual.available_balance, 0) as actual_available,
    w.locked_minor as cached_locked,
    COALESCE(actual.locked_balance, 0) as actual_locked,
    (w.balance_minor = COALESCE(actual.available_balance, 0) AND 
     w.locked_minor = COALESCE(actual.locked_balance, 0)) as is_matched
  FROM wallets w
  LEFT JOIN LATERAL calculate_wallet_balance(w.id) actual ON TRUE
  WHERE w.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Alert function for mismatched balances
CREATE OR REPLACE FUNCTION alert_wallet_mismatch()
RETURNS TABLE(wallet_id UUID, user_id TEXT, mismatch_details JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.wallet_id,
    w.user_id,
    jsonb_build_object(
      'cached_available', r.cached_available,
      'actual_available', r.actual_available,
      'cached_locked', r.cached_locked,
      'actual_locked', r.actual_locked,
      'diff_available', r.cached_available - r.actual_available,
      'diff_locked', r.cached_locked - r.actual_locked,
      'last_reconciled', w.last_reconciled_at
    ) as mismatch_details
  FROM reconcile_wallet_balances() r
  JOIN wallets w ON w.id = r.wallet_id
  WHERE NOT r.is_matched;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: ORDER STATUS/TIMESTAMP INVARIANTS
-- ============================================================================

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS order_status_timestamp_consistency;

ALTER TABLE orders 
  ADD CONSTRAINT order_status_timestamp_consistency CHECK (
    CASE status
      WHEN 'PENDING_ACCEPT' THEN
        accepted_at IS NULL 
        AND paid_at IS NULL 
        AND completed_at IS NULL 
        AND cancelled_at IS NULL
        AND auto_release_at IS NULL
      
      WHEN 'INVITE_EXPIRED' THEN
        accepted_at IS NULL
        AND paid_at IS NULL
        AND completed_at IS NULL
        AND cancelled_at IS NULL
      
      WHEN 'WAITING_PAYMENT' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NULL
        AND completed_at IS NULL
        AND cancelled_at IS NULL
      
      WHEN 'PAYMENT_FAILED' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NULL
        AND completed_at IS NULL
        AND cancelled_at IS NULL
      
      WHEN 'PAID_IN_ESCROW' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NOT NULL
        AND auto_release_at IS NOT NULL
        AND completed_at IS NULL
        AND cancelled_at IS NULL
      
      WHEN 'DELIVERED_PROOF_SUBMITTED' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NOT NULL
        AND completed_at IS NULL
        AND cancelled_at IS NULL
      
      WHEN 'IN_DISPUTE' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NOT NULL
        AND completed_at IS NULL
        AND cancelled_at IS NULL
      
      WHEN 'REFUND_PROCESSING' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NOT NULL
        AND completed_at IS NULL
        AND cancelled_at IS NULL
      
      WHEN 'COMPLETED' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NOT NULL
        AND completed_at IS NOT NULL
        AND cancelled_at IS NULL
      
      WHEN 'AUTO_RELEASED' THEN
        accepted_at IS NOT NULL
        AND paid_at IS NOT NULL
        AND auto_release_at IS NOT NULL
        AND completed_at IS NOT NULL
        AND cancelled_at IS NULL
      
      WHEN 'CANCELLED' THEN
        cancelled_at IS NOT NULL
        AND completed_at IS NULL
      
      ELSE FALSE
    END
  );

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS order_timestamp_ordering;

ALTER TABLE orders 
  ADD CONSTRAINT order_timestamp_ordering CHECK (
    (accepted_at IS NULL OR accepted_at >= created_at) AND
    (paid_at IS NULL OR (accepted_at IS NOT NULL AND paid_at >= accepted_at)) AND
    (completed_at IS NULL OR (paid_at IS NOT NULL AND completed_at >= paid_at)) AND
    (cancelled_at IS NULL OR cancelled_at >= created_at) AND
    (auto_release_at IS NULL OR (paid_at IS NOT NULL AND auto_release_at > paid_at))
  );

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_amount_positive;

ALTER TABLE orders 
  ADD CONSTRAINT orders_amount_positive CHECK (amount_minor > 0);

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_fee_non_negative;

ALTER TABLE orders 
  ADD CONSTRAINT orders_fee_non_negative CHECK (platform_fee_minor >= 0);

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_holding_period_positive;

ALTER TABLE orders 
  ADD CONSTRAINT orders_holding_period_positive CHECK (holding_period_days > 0);

-- ========================================================================
-- PART 6B: BASIC DATA QUALITY CHECKS
-- ========================================================================

ALTER TABLE wallets
  DROP CONSTRAINT IF EXISTS wallets_balance_non_negative;

ALTER TABLE wallets
  ADD CONSTRAINT wallets_balance_non_negative
  CHECK (balance_minor >= 0 AND locked_minor >= 0);

ALTER TABLE ratings
  DROP CONSTRAINT IF EXISTS ratings_value_range;

ALTER TABLE ratings
  ADD CONSTRAINT ratings_value_range
  CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE vouchers
  DROP CONSTRAINT IF EXISTS vouchers_discount_percent_range;

ALTER TABLE vouchers
  ADD CONSTRAINT vouchers_discount_percent_range
  CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));

ALTER TABLE promos
  DROP CONSTRAINT IF EXISTS promos_discount_percent_range;

ALTER TABLE promos
  ADD CONSTRAINT promos_discount_percent_range
  CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));

ALTER TABLE vouchers
  DROP CONSTRAINT IF EXISTS vouchers_usage_bounds;

ALTER TABLE vouchers
  ADD CONSTRAINT vouchers_usage_bounds
  CHECK (current_usages >= 0 AND current_usages <= max_usages);

ALTER TABLE promos
  DROP CONSTRAINT IF EXISTS promos_usage_bounds;

ALTER TABLE promos
  ADD CONSTRAINT promos_usage_bounds
  CHECK (
    current_usages >= 0 AND
    (max_total_usages IS NULL OR current_usages <= max_total_usages)
  );

-- ============================================================================
-- PART 7: PAYMENT STATUS MONOTONIC (STATE MACHINE)
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_payment_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transition BOOLEAN := FALSE;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  valid_transition := CASE
    WHEN OLD.status = 'PENDING' AND NEW.status IN ('PAID', 'EXPIRED', 'FAILED') THEN TRUE
    WHEN OLD.status IN ('PAID', 'EXPIRED', 'FAILED') THEN FALSE
    ELSE FALSE
  END;
  
  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Invalid payment status transition: % → % for payment_id: %', 
      OLD.status, NEW.status, NEW.id;
  END IF;
  
  INSERT INTO payment_status_history (payment_id, from_status, to_status, changed_by, changed_at)
  VALUES (NEW.id, OLD.status, NEW.status, 'SYSTEM', NOW());
  
  IF NEW.status = 'PAID' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_status_transition_guard ON payments;
CREATE TRIGGER payment_status_transition_guard
  BEFORE UPDATE OF status ON payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_payment_status_transition();

ALTER TABLE payments 
  DROP CONSTRAINT IF EXISTS payments_amount_positive;

ALTER TABLE payments 
  ADD CONSTRAINT payments_amount_positive CHECK (amount_minor > 0);

ALTER TABLE payments 
  DROP CONSTRAINT IF EXISTS payments_type_order_consistency;

ALTER TABLE payments 
  ADD CONSTRAINT payments_type_order_consistency CHECK (
    (payment_type = 'ORDER_PAYMENT' AND order_id IS NOT NULL) OR
    (payment_type = 'DEPOSIT' AND order_id IS NULL)
  );

-- ============================================================================
-- PART 8: WITHDRAWAL STATUS MONOTONIC
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_withdrawal_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transition BOOLEAN := FALSE;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  valid_transition := CASE
    WHEN OLD.status = 'PENDING' AND NEW.status IN ('UNDER_REVIEW', 'REJECTED', 'CANCELLED') THEN TRUE
    WHEN OLD.status = 'UNDER_REVIEW' AND NEW.status IN ('APPROVED', 'REJECTED', 'CANCELLED') THEN TRUE
    WHEN OLD.status = 'APPROVED' AND NEW.status IN ('PROCESSING', 'FAILED', 'CANCELLED') THEN TRUE
    WHEN OLD.status = 'PROCESSING' AND NEW.status IN ('COMPLETED', 'FAILED') THEN TRUE
    WHEN OLD.status IN ('COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED') THEN FALSE
    ELSE FALSE
  END;
  
  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Invalid withdrawal status transition: % → % for withdrawal_id: %',
      OLD.status, NEW.status, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawal_status_transition_guard ON withdrawals;
CREATE TRIGGER withdrawal_status_transition_guard
  BEFORE UPDATE OF status ON withdrawals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_withdrawal_status_transition();

ALTER TABLE withdrawals 
  DROP CONSTRAINT IF EXISTS withdrawals_amount_positive;

ALTER TABLE withdrawals 
  ADD CONSTRAINT withdrawals_amount_positive CHECK (amount_minor > 0);

ALTER TABLE withdrawals 
  DROP CONSTRAINT IF EXISTS withdrawals_approval_logic;

ALTER TABLE withdrawals 
  ADD CONSTRAINT withdrawals_approval_logic CHECK (approval_count <= required_approvals);

ALTER TABLE deposits 
  DROP CONSTRAINT IF EXISTS deposits_amount_positive;

ALTER TABLE deposits 
  ADD CONSTRAINT deposits_amount_positive CHECK (amount_minor > 0);

-- ============================================================================
-- PART 9: WEBHOOK PROCESSING INVARIANTS
-- ============================================================================

ALTER TABLE webhook_events 
  DROP CONSTRAINT IF EXISTS webhook_processed_invariants;

ALTER TABLE webhook_events 
  ADD CONSTRAINT webhook_processed_invariants CHECK (
    (status IN ('COMPLETED', 'FAILED', 'DEAD_LETTER') AND processed_at IS NOT NULL) OR
    (status NOT IN ('COMPLETED', 'FAILED', 'DEAD_LETTER'))
  );

ALTER TABLE webhook_events 
  DROP CONSTRAINT IF EXISTS webhook_events_retry_valid;

ALTER TABLE webhook_events 
  ADD CONSTRAINT webhook_events_retry_valid CHECK (retry_count <= max_retries);

CREATE OR REPLACE FUNCTION prevent_webhook_reprocess()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
    RAISE EXCEPTION 'Cannot reprocess completed webhook event_id: %', OLD.event_id;
  END IF;
  
  IF NEW.retry_count > NEW.max_retries THEN
    NEW.status := 'DEAD_LETTER';
  END IF;
  
  IF NEW.retry_count > OLD.retry_count THEN
    NEW.last_retry_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_processing_guard ON webhook_events;
CREATE TRIGGER webhook_processing_guard
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_webhook_reprocess();

-- ============================================================================
-- PART 10: SETTLEMENT CONSISTENCY
-- ============================================================================

ALTER TABLE escrow_holds 
  DROP CONSTRAINT IF EXISTS escrow_holds_amount_positive;

ALTER TABLE escrow_holds 
  ADD CONSTRAINT escrow_holds_amount_positive CHECK (amount_minor > 0);

CREATE OR REPLACE FUNCTION check_escrow_order_consistency()
RETURNS TRIGGER AS $$
DECLARE
  order_amount BIGINT;
BEGIN
  SELECT amount_minor INTO order_amount
  FROM orders
  WHERE id = NEW.order_id;
  
  IF order_amount IS NULL THEN
    RAISE EXCEPTION 'Cannot create escrow hold for non-existent order: %', NEW.order_id;
  END IF;
  
  IF NEW.amount_minor != order_amount THEN
    RAISE EXCEPTION 'Escrow hold amount (%) does not match order amount (%) for order: %',
      NEW.amount_minor, order_amount, NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS escrow_order_consistency ON escrow_holds;
CREATE TRIGGER escrow_order_consistency
  BEFORE INSERT OR UPDATE ON escrow_holds
  FOR EACH ROW
  EXECUTE FUNCTION check_escrow_order_consistency();

ALTER TABLE order_settlements 
  DROP CONSTRAINT IF EXISTS settlement_total_consistency;

ALTER TABLE order_settlements 
  ADD CONSTRAINT settlement_total_consistency CHECK (
    seller_amount_minor >= 0 AND 
    buyer_refund_minor >= 0 AND 
    platform_fee_minor >= 0
  );

CREATE OR REPLACE FUNCTION check_settlement_order_consistency()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  settlement_total BIGINT;
BEGIN
  SELECT amount_minor, platform_fee_minor INTO order_record
  FROM orders
  WHERE id = NEW.order_id;
  
  settlement_total := NEW.seller_amount_minor + NEW.buyer_refund_minor + NEW.platform_fee_minor;
  
  IF settlement_total != order_record.amount_minor THEN
    RAISE EXCEPTION 'Settlement total (%) does not match order amount (%) for order: %',
      settlement_total, order_record.amount_minor, NEW.order_id;
  END IF;
  
  IF NEW.platform_fee_minor != order_record.platform_fee_minor THEN
    RAISE WARNING 'Settlement platform fee (%) differs from order platform fee (%) for order: %',
      NEW.platform_fee_minor, order_record.platform_fee_minor, NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settlement_order_consistency ON order_settlements;
CREATE TRIGGER settlement_order_consistency
  BEFORE INSERT OR UPDATE ON order_settlements
  FOR EACH ROW
  EXECUTE FUNCTION check_settlement_order_consistency();

ALTER TABLE disputes 
  DROP CONSTRAINT IF EXISTS dispute_settlement_totals;

ALTER TABLE disputes 
  ADD CONSTRAINT dispute_settlement_totals CHECK (
    (decision = 'NONE' AND seller_amount_minor IS NULL AND buyer_refund_minor IS NULL) OR
    (decision != 'NONE' AND seller_amount_minor IS NOT NULL AND buyer_refund_minor IS NOT NULL AND
     seller_amount_minor >= 0 AND buyer_refund_minor >= 0)
  );

ALTER TABLE disputes 
  DROP CONSTRAINT IF EXISTS disputes_appeal_count_non_negative;

ALTER TABLE disputes 
  ADD CONSTRAINT disputes_appeal_count_non_negative CHECK (appeal_count >= 0);

CREATE OR REPLACE FUNCTION check_dispute_settlement_consistency()
RETURNS TRIGGER AS $$
DECLARE
  order_amount BIGINT;
  dispute_total BIGINT;
BEGIN
  IF NEW.decision = 'NONE' THEN
    RETURN NEW;
  END IF;
  
  SELECT amount_minor INTO order_amount
  FROM orders
  WHERE id = NEW.order_id;
  
  dispute_total := NEW.seller_amount_minor + NEW.buyer_refund_minor;
  
  IF dispute_total > order_amount THEN
    RAISE EXCEPTION 'Dispute settlement total (%) exceeds order amount (%) for order: %',
      dispute_total, order_amount, NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dispute_settlement_consistency ON disputes;
CREATE TRIGGER dispute_settlement_consistency
  BEFORE UPDATE OF decision, seller_amount_minor, buyer_refund_minor ON disputes
  FOR EACH ROW
  WHEN (NEW.decision != 'NONE')
  EXECUTE FUNCTION check_dispute_settlement_consistency();

CREATE OR REPLACE FUNCTION check_order_single_outcome()
RETURNS TRIGGER AS $$
DECLARE
  has_settlement BOOLEAN;
  has_dispute_settlement BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM order_settlements WHERE order_id = NEW.order_id)
  INTO has_settlement;
  
  SELECT EXISTS(SELECT 1 FROM disputes WHERE order_id = NEW.order_id AND decision != 'NONE')
  INTO has_dispute_settlement;
  
  IF has_settlement AND has_dispute_settlement THEN
    RAISE EXCEPTION 'Order % has both normal settlement and dispute settlement', NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_settlement_single_outcome ON order_settlements;
CREATE TRIGGER order_settlement_single_outcome
  AFTER INSERT OR UPDATE ON order_settlements
  FOR EACH ROW
  EXECUTE FUNCTION check_order_single_outcome();

DROP TRIGGER IF EXISTS order_dispute_single_outcome ON disputes;
CREATE TRIGGER order_dispute_single_outcome
  AFTER UPDATE OF decision ON disputes
  FOR EACH ROW
  WHEN (NEW.decision != 'NONE')
  EXECUTE FUNCTION check_order_single_outcome();

-- ============================================================================
-- PART 11: SCHEDULED JOBS UNIQUENESS
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_jobs_idempotency 
  ON scheduled_jobs(job_type, entity_type, entity_id, scheduled_at)
  WHERE status IN ('PENDING', 'RUNNING');

CREATE OR REPLACE FUNCTION prevent_duplicate_scheduled_job()
RETURNS TRIGGER AS $$
DECLARE
  existing_job_id UUID;
BEGIN
  SELECT id INTO existing_job_id
  FROM scheduled_jobs
  WHERE job_type = NEW.job_type
    AND entity_type = NEW.entity_type
    AND entity_id = NEW.entity_id
    AND scheduled_at = NEW.scheduled_at
    AND status IN ('PENDING', 'RUNNING')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  IF existing_job_id IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate scheduled job detected: existing job_id %', existing_job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_duplicate_jobs ON scheduled_jobs;
CREATE TRIGGER prevent_duplicate_jobs
  BEFORE INSERT OR UPDATE ON scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_scheduled_job();

ALTER TABLE scheduled_jobs 
  DROP CONSTRAINT IF EXISTS scheduled_jobs_retry_valid;

ALTER TABLE scheduled_jobs 
  ADD CONSTRAINT scheduled_jobs_retry_valid CHECK (
    retry_count >= 0 AND retry_count <= max_retries AND max_retries >= 0
  );

-- ============================================================================
-- PART 12: AUDIT LOG TAMPER-EVIDENCE
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_audit_log_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_log_hash TEXT;
BEGIN
  SELECT row_hash INTO prev_log_hash
  FROM audit_logs
  WHERE created_at < NEW.created_at
  ORDER BY created_at DESC, id DESC
  LIMIT 1;
  
  NEW.prev_hash := prev_log_hash;
  
  NEW.row_hash := encode(
    digest(
      NEW.id::TEXT || 
      NEW.action || 
      COALESCE(NEW.performed_by, '') ||
      NEW.entity_type ||
      COALESCE(NEW.entity_id, '') ||
      NEW.details::TEXT ||
      COALESCE(NEW.prev_hash, '') ||
      NEW.created_at::TEXT,
      'sha256'
    ),
    'hex'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_hash_chain ON audit_logs;
CREATE TRIGGER audit_log_hash_chain
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION compute_audit_log_hash();

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_audit_logs_update ON audit_logs;
CREATE TRIGGER immutable_audit_logs_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

DROP TRIGGER IF EXISTS immutable_audit_logs_delete ON audit_logs;
CREATE TRIGGER immutable_audit_logs_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================================
-- PART 13: SESSION SECURITY - TOKEN FAMILY ROTATION
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_session_reuse()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.rotated_at IS NOT NULL AND OLD.replaced_by_session_id IS NOT NULL THEN
    UPDATE

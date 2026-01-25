// ============================================================================
// TRANSACTION AND WITHDRAWAL LIMITS
// ============================================================================

export const TRANSACTION_LIMITS = {
  MIN_AMOUNT_IDR: 10000,
  MAX_AMOUNT_IDR: 100000000,
  MIN_AMOUNT_MINOR: 1000000n,
  MAX_AMOUNT_MINOR: 10000000000n,
} as const;

export const WITHDRAWAL_LIMITS = {
  MIN_AMOUNT_IDR: 50000,
  MAX_AMOUNT_IDR: 100000000,
  DAILY_LIMIT_IDR: 100000000,
  MONTHLY_LIMIT_IDR: 500000000,
  COOLING_PERIOD_MINUTES: 60,
} as const;

export const TOPUP_LIMITS = {
  MIN_AMOUNT_IDR: 10000,
  MAX_AMOUNT_IDR: 100000000,
} as const;

export const KYC_LIMITS = {
  NONE: {
    dailyLimit: 5000000,
    monthlyLimit: 20000000,
    perTxLimit: 1000000,
  },
  PENDING: {
    dailyLimit: 25000000,
    monthlyLimit: 100000000,
    perTxLimit: 10000000,
  },
  VERIFIED: {
    dailyLimit: 100000000,
    monthlyLimit: 500000000,
    perTxLimit: 50000000,
  },
} as const;

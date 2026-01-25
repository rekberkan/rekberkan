// ============================================================================
// PLATFORM FEES CONFIGURATION
// ============================================================================

export const PLATFORM_FEES = {
  ESCROW_FEE_PERCENTAGE: 2.5,
  MIN_ESCROW_FEE_IDR: 5000,
  MAX_ESCROW_FEE_IDR: 500000,
  WITHDRAWAL_FEE_IDR: 6500,
  TOPUP_FEE_PERCENTAGE: 0,
} as const;

export const FEE_CALCULATION = {
  calculateEscrowFee: (amountMinor: bigint): bigint => {
    const percentage = BigInt(Math.round(PLATFORM_FEES.ESCROW_FEE_PERCENTAGE * 100));
    const fee = (amountMinor * percentage) / 10000n;
    const minFee = BigInt(PLATFORM_FEES.MIN_ESCROW_FEE_IDR * 100);
    const maxFee = BigInt(PLATFORM_FEES.MAX_ESCROW_FEE_IDR * 100);
    
    if (fee < minFee) return minFee;
    if (fee > maxFee) return maxFee;
    return fee;
  },
  
  calculateWithdrawalFee: (): bigint => {
    return BigInt(PLATFORM_FEES.WITHDRAWAL_FEE_IDR * 100);
  },
} as const;

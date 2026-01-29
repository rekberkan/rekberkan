import { registerAs } from "@nestjs/config";

/**
 * Platform Configuration
 * Contains business-related configurable values
 */
export default registerAs("platform", () => ({
  // Fee configuration
  feePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "1"),
  minFeeMinor: BigInt(process.env.PLATFORM_MIN_FEE_MINOR || "1000"), // Minimum fee in minor units
  maxFeeMinor: BigInt(process.env.PLATFORM_MAX_FEE_MINOR || "100000000"), // Maximum fee in minor units

  // Order configuration
  inviteExpiryDays: parseInt(process.env.ORDER_INVITE_EXPIRY_DAYS || "7", 10),
  maxHoldingPeriodDays: parseInt(
    process.env.ORDER_MAX_HOLDING_PERIOD_DAYS || "30",
    10,
  ),
  minOrderAmountMinor: BigInt(process.env.ORDER_MIN_AMOUNT_MINOR || "1000000"), // Rp 10,000
  maxOrderAmountMinor: BigInt(
    process.env.ORDER_MAX_AMOUNT_MINOR || "100000000000",
  ), // Rp 1,000,000,000

  // Escrow configuration
  escrowTimeoutDays: parseInt(process.env.ESCROW_TIMEOUT_DAYS || "14", 10),
  autoReleaseEnabled: process.env.ESCROW_AUTO_RELEASE_ENABLED !== "false",

  // Withdrawal configuration
  minWithdrawalMinor: BigInt(
    process.env.WITHDRAWAL_MIN_AMOUNT_MINOR || "5000000",
  ), // Rp 50,000
  maxWithdrawalMinor: BigInt(
    process.env.WITHDRAWAL_MAX_AMOUNT_MINOR || "5000000000",
  ), // Rp 50,000,000
  withdrawalFeeMinor: BigInt(process.env.WITHDRAWAL_FEE_MINOR || "250000"), // Rp 2,500

  // Top-up configuration
  minTopUpMinor: BigInt(process.env.TOPUP_MIN_AMOUNT_MINOR || "1000000"), // Rp 10,000
  maxTopUpMinor: BigInt(process.env.TOPUP_MAX_AMOUNT_MINOR || "10000000000"), // Rp 100,000,000

  // Referral configuration
  referralBonusMinor: BigInt(process.env.REFERRAL_BONUS_MINOR || "2500000"), // Rp 25,000
  referralEnabled: process.env.REFERRAL_ENABLED !== "false",

  // KYC configuration
  kycRequired: process.env.KYC_REQUIRED === "true",
  kycRequiredForWithdrawal: process.env.KYC_REQUIRED_FOR_WITHDRAWAL !== "false",
}));

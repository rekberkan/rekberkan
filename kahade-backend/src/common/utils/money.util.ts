/**
 * Money Utility - Safe Financial Calculations
 * 
 * All amounts are stored as BIGINT in minor units (cents/sen).
 * 1 IDR = 100 sen (minor units)
 * 
 * Examples:
 * - 10,000 IDR = 1,000,000 minor units
 * - 50.50 IDR = 5,050 minor units
 */

export class MoneyUtil {
  /**
   * Convert IDR to minor units (cents/sen)
   * 10,000 IDR -> 1,000,000 minor units
   */
  static toMinor(amountIDR: number): bigint {
    return BigInt(Math.round(amountIDR * 100));
  }

  /**
   * Convert minor units to IDR
   * 1,000,000 minor units -> 10,000 IDR
   */
  static toIDR(amountMinor: bigint): number {
    return Number(amountMinor) / 100;
  }

  /**
   * Add two amounts safely
   */
  static add(a: bigint, b: bigint): bigint {
    return a + b;
  }

  /**
   * Subtract two amounts safely
   */
  static subtract(a: bigint, b: bigint): bigint {
    const result = a - b;
    if (result < BigInt(0)) {
      throw new Error('Subtraction resulted in negative amount');
    }
    return result;
  }

  /**
   * Multiply amount by factor
   */
  static multiply(amount: bigint, factor: number): bigint {
    return amount * BigInt(Math.round(factor * 100)) / BigInt(100);
  }

  /**
   * Calculate percentage
   * Example: 10% of 1000 IDR = 100 IDR
   */
  static calculatePercentage(amount: bigint, percentage: number): bigint {
    return amount * BigInt(Math.round(percentage * 100)) / BigInt(10000);
  }

  /**
   * Calculate platform fee
   */
  static calculatePlatformFee(
    amount: bigint,
    feePercentage: number,
  ): bigint {
    return this.calculatePercentage(amount, feePercentage);
  }

  /**
   * Format amount for display
   * 1000000 minor -> "Rp 10,000"
   */
  static format(amountMinor: bigint, includeSymbol = true): string {
    const idr = this.toIDR(amountMinor);
    const formatted = idr.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return includeSymbol ? `Rp ${formatted}` : formatted;
  }

  /**
   * Validate amount is positive
   */
  static validatePositive(amount: bigint): void {
    if (amount <= BigInt(0)) {
      throw new Error('Amount must be positive');
    }
  }

  /**
   * Validate amount is non-negative
   */
  static validateNonNegative(amount: bigint): void {
    if (amount < BigInt(0)) {
      throw new Error('Amount cannot be negative');
    }
  }

  /**
   * Compare two amounts
   */
  static compare(a: bigint, b: bigint): -1 | 0 | 1 {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /**
   * Check if amount is zero
   */
  static isZero(amount: bigint): boolean {
    return amount === BigInt(0);
  }

  /**
   * Get minimum of two amounts
   */
  static min(a: bigint, b: bigint): bigint {
    return a < b ? a : b;
  }

  /**
   * Get maximum of two amounts
   */
  static max(a: bigint, b: bigint): bigint {
    return a > b ? a : b;
  }
}
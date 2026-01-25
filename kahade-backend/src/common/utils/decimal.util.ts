import { Decimal } from '@prisma/client/runtime/library';

export class DecimalUtil {
  /**
   * Convert Prisma Decimal to number
   */
  static toNumber(decimal: Decimal | number | string | null | undefined): number {
    if (decimal === null || decimal === undefined) {
      return 0;
    }
    
    if (typeof decimal === 'number') {
      return decimal;
    }
    
    if (typeof decimal === 'string') {
      return parseFloat(decimal);
    }
    
    // Prisma Decimal object
    return decimal.toNumber();
  }

  /**
   * Convert number to Prisma Decimal
   */
  static fromNumber(value: number | string): Decimal {
    return new Decimal(value);
  }

  /**
   * Convert Prisma Decimal to string with fixed decimals
   */
  static toFixed(decimal: Decimal | number, decimals: number = 2): string {
    if (typeof decimal === 'number') {
      return decimal.toFixed(decimals);
    }
    return decimal.toFixed(decimals);
  }

  /**
   * Format as currency (IDR)
   */
  static toCurrency(decimal: Decimal | number, currency: string = 'IDR'): string {
    const number = this.toNumber(decimal);
    
    if (currency === 'IDR') {
      return `Rp ${number.toLocaleString('id-ID')}`;
    }
    
    return `${currency} ${number.toLocaleString()}`;
  }

  /**
   * Add two decimals
   */
  static add(a: Decimal | number, b: Decimal | number): Decimal {
    return new Decimal(a).plus(new Decimal(b));
  }

  /**
   * Subtract two decimals
   */
  static subtract(a: Decimal | number, b: Decimal | number): Decimal {
    return new Decimal(a).minus(new Decimal(b));
  }

  /**
   * Multiply two decimals
   */
  static multiply(a: Decimal | number, b: Decimal | number): Decimal {
    return new Decimal(a).times(new Decimal(b));
  }

  /**
   * Divide two decimals
   */
  static divide(a: Decimal | number, b: Decimal | number): Decimal {
    return new Decimal(a).dividedBy(new Decimal(b));
  }

  /**
   * Compare two decimals
   */
  static compare(a: Decimal | number, b: Decimal | number): number {
    return new Decimal(a).comparedTo(new Decimal(b));
  }

  /**
   * Check if decimal is greater than
   */
  static greaterThan(a: Decimal | number, b: Decimal | number): boolean {
    return new Decimal(a).greaterThan(new Decimal(b));
  }

  /**
   * Check if decimal is less than
   */
  static lessThan(a: Decimal | number, b: Decimal | number): boolean {
    return new Decimal(a).lessThan(new Decimal(b));
  }

  /**
   * Check if decimal equals
   */
  static equals(a: Decimal | number, b: Decimal | number): boolean {
    return new Decimal(a).equals(new Decimal(b));
  }
}

import * as crypto from 'crypto';

export class NumberUtil {
  static formatCurrency(amount: number, currency: string = 'IDR'): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  static formatNumber(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num);
  }

  static random(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxVal = Math.pow(256, bytesNeeded);
    const limit = maxVal - (maxVal % range);
    
    let value;
    do {
      value = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
    } while (value >= limit);
    
    return min + (value % range);
  }

  static round(num: number, decimals: number = 2): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return this.round((value / total) * 100, 2);
  }

  static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }
}

import { IsNumber, IsString, Min, Max, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// TOP UP DTO
// ============================================================================

// Specific payment methods (for direct selection)
const SPECIFIC_PAYMENT_METHODS = [
  'va_bca',
  'va_bni',
  'va_mandiri',
  'va_bri',
  'va_permata',
  'va_cimb',
  'ewallet_ovo',
  'ewallet_gopay',
  'ewallet_dana',
  'ewallet_shopeepay',
  'ewallet_linkaja',
  'qris',
];

// Generic payment methods (for UI simplicity, will be mapped to specific methods)
const GENERIC_PAYMENT_METHODS = [
  'bank_transfer', // Maps to default VA (va_bca)
  'card', // Maps to card payment
  'ewallet', // Maps to default e-wallet (ewallet_gopay)
];

const VALID_PAYMENT_METHODS = [...SPECIFIC_PAYMENT_METHODS, ...GENERIC_PAYMENT_METHODS];

export const mapPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    bank_transfer: 'va_bca',
    card: 'card',
    ewallet: 'ewallet_gopay',
  };
  return methodMap[method] || method;
};

export class TopUpDto {
  @ApiProperty({
    description: 'Amount to top up in IDR',
    minimum: 10000,
    maximum: 100000000,
    example: 100000,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10000, { message: 'Minimum top up amount is Rp 10,000' })
  @Max(100000000, { message: 'Maximum top up amount is Rp 100,000,000' })
  amount: number;

  @ApiProperty({
    description: 'Payment method (specific like va_bca or generic like bank_transfer)',
    enum: VALID_PAYMENT_METHODS,
    example: 'bank_transfer',
  })
  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsIn(VALID_PAYMENT_METHODS, { message: 'Invalid payment method' })
  method: string;
}

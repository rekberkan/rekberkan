import { IsNumber, IsString, Min, Max, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// TOP UP DTO
// ============================================================================

const VALID_PAYMENT_METHODS = [
  'va_bca', 'va_bni', 'va_mandiri', 'va_bri', 'va_permata', 'va_cimb',
  'ewallet_ovo', 'ewallet_gopay', 'ewallet_dana', 'ewallet_shopeepay', 'ewallet_linkaja',
  'qris',
];

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
    description: 'Payment method',
    enum: VALID_PAYMENT_METHODS,
    example: 'va_bca',
  })
  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsIn(VALID_PAYMENT_METHODS, { message: 'Invalid payment method' })
  method: string;
}

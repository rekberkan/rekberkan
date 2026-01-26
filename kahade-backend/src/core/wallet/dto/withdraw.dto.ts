import { IsNumber, IsString, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// WITHDRAW DTO
// ============================================================================

export class WithdrawDto {
  @ApiProperty({ 
    description: 'Amount to withdraw in IDR', 
    minimum: 50000,
    maximum: 50000000,
    example: 100000,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(50000, { message: 'Minimum withdrawal amount is Rp 50,000' })
  @Max(50000000, { message: 'Maximum withdrawal amount is Rp 50,000,000' })
  amount: number;

  @ApiProperty({
    description: 'Bank account ID linked to the user',
    example: 'b7f1c6a5-4b9c-4d1a-9e2b-3b7a0b0c1234',
  })
  @IsString()
  @IsNotEmpty({ message: 'Bank account ID is required' })
  bankAccountId: string;
}

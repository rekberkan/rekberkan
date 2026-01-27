import { IsNumber, IsString, Min, Max, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// WITHDRAW DTO
// Supports both bankAccountId (for saved accounts) and direct bank details
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
    description: 'Bank account ID linked to the user (optional if providing bank details)',
    example: 'b7f1c6a5-4b9c-4d1a-9e2b-3b7a0b0c1234',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiProperty({
    description: 'Bank code (required if bankAccountId not provided)',
    example: 'BCA',
    required: false,
  })
  @ValidateIf(o => !o.bankAccountId)
  @IsString()
  @IsNotEmpty({ message: 'Bank code is required when not using saved bank account' })
  bankCode?: string;

  @ApiProperty({
    description: 'Bank account number (required if bankAccountId not provided)',
    example: '1234567890',
    required: false,
  })
  @ValidateIf(o => !o.bankAccountId)
  @IsString()
  @IsNotEmpty({ message: 'Account number is required when not using saved bank account' })
  accountNumber?: string;

  @ApiProperty({
    description: 'Account holder name (required if bankAccountId not provided)',
    example: 'John Doe',
    required: false,
  })
  @ValidateIf(o => !o.bankAccountId)
  @IsString()
  @IsNotEmpty({ message: 'Account name is required when not using saved bank account' })
  accountName?: string;
}

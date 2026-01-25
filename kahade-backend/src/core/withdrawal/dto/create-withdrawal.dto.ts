import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, Max, MinLength, MaxLength, IsNotEmpty, Matches, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================================================
// CREATE WITHDRAWAL DTO
// ============================================================================

const VALID_BANK_CODES = [
  'BCA', 'BNI', 'MANDIRI', 'BRI', 'PERMATA', 'CIMB', 'DANAMON',
  'BTN', 'MEGA', 'PANIN', 'BSI', 'OCBC', 'MAYBANK', 'UOB',
];

export class CreateWithdrawalDto {
  @ApiProperty({ 
    description: 'Amount to withdraw in IDR',
    minimum: 50000,
    maximum: 50000000,
    example: 100000,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(50000, { message: 'Minimum withdrawal is Rp 50,000' })
  @Max(50000000, { message: 'Maximum withdrawal is Rp 50,000,000' })
  amount: number;

  @ApiProperty({ 
    description: 'Bank code',
    enum: VALID_BANK_CODES,
    example: 'BCA',
  })
  @IsString()
  @IsNotEmpty({ message: 'Bank code is required' })
  @IsIn(VALID_BANK_CODES, { message: 'Invalid bank code' })
  @Transform(({ value }) => value?.toUpperCase())
  bankCode: string;

  @ApiProperty({ 
    description: 'Bank account number (8-20 digits)',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  @MinLength(8, { message: 'Account number must be at least 8 digits' })
  @MaxLength(20, { message: 'Account number must not exceed 20 digits' })
  @Matches(/^[0-9]+$/, { message: 'Account number must contain only digits' })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  accountNumber: string;

  @ApiProperty({ 
    description: 'Account holder name',
    example: 'JOHN DOE',
  })
  @IsString()
  @IsNotEmpty({ message: 'Account name is required' })
  @MinLength(3, { message: 'Account name must be at least 3 characters' })
  @MaxLength(100, { message: 'Account name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s\.\-']+$/, { message: 'Account name contains invalid characters' })
  @Transform(({ value }) => value?.toUpperCase().trim())
  accountName: string;
}

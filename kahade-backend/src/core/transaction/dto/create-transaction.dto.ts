import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

// ============================================================================
// CREATE TRANSACTION DTO
// ============================================================================

export enum TransactionRole {
  BUYER = 'buyer',
  SELLER = 'seller',
}

export enum TransactionFeePayer {
  BUYER = 'buyer',
  SELLER = 'seller',
  SPLIT = 'split',
}

export enum TransactionCategory {
  ELECTRONICS = 'ELECTRONICS',
  SERVICES = 'SERVICES',
  DIGITAL_GOODS = 'DIGITAL_GOODS',
  PHYSICAL_GOODS = 'PHYSICAL_GOODS',
  FASHION = 'FASHION',
  AUTOMOTIVE = 'AUTOMOTIVE',
  PROPERTY = 'PROPERTY',
  FREELANCE = 'FREELANCE',
  OTHER = 'OTHER',
}

export class CreateTransactionDto {
  @ApiPropertyOptional({
    description: 'Counterparty email address',
    example: 'counterparty@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  counterpartyEmail?: string;

  @ApiPropertyOptional({
    description: 'Counterparty user ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  @MaxLength(36, { message: 'Invalid user ID format' })
  counterpartyId?: string;

  @ApiProperty({
    enum: TransactionRole,
    description: 'Role of the initiator in this transaction',
    example: 'buyer',
  })
  @IsEnum(TransactionRole, { message: 'Role must be either buyer or seller' })
  role: TransactionRole;

  @ApiProperty({
    description: 'Transaction title (3-100 characters)',
    example: 'iPhone 15 Pro Max 256GB',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    description: 'Transaction description (10-2000 characters)',
    example: 'Brand new iPhone 15 Pro Max 256GB, sealed box, official warranty.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({
    enum: TransactionCategory,
    description: 'Transaction category',
    example: 'ELECTRONICS',
  })
  @IsEnum(TransactionCategory, { message: 'Invalid category' })
  category: TransactionCategory;

  @ApiProperty({
    description: 'Transaction amount in IDR',
    minimum: 10000,
    maximum: 500000000,
    example: 20000000,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10000, { message: 'Minimum transaction amount is Rp 10,000' })
  @Max(500000000, { message: 'Maximum transaction amount is Rp 500,000,000' })
  amount: number;

  @ApiProperty({
    enum: TransactionFeePayer,
    description: 'Who pays the platform fee',
    example: 'buyer',
  })
  @IsEnum(TransactionFeePayer, { message: 'Fee payer must be buyer, seller, or split' })
  feePaidBy: TransactionFeePayer;

  @ApiPropertyOptional({
    description: 'Custom terms and conditions (max 5000 characters)',
    example: 'Item must be delivered within 3 business days.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Terms must not exceed 5000 characters' })
  @Transform(({ value }) => value?.trim())
  terms?: string;
}

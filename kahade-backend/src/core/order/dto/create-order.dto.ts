import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, Max, MinLength, MaxLength, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum InitiatorRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
}

export enum OrderCategory {
  ELECTRONICS = 'ELECTRONICS',
  SERVICES = 'SERVICES',
  DIGITAL_GOODS = 'DIGITAL_GOODS',
  PHYSICAL_GOODS = 'PHYSICAL_GOODS',
  OTHER = 'OTHER',
}

export enum FeePayer {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  SPLIT = 'SPLIT',
  FIFTY_FIFTY = 'FIFTY_FIFTY',
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Title of the order/transaction',
    example: 'iPhone 15 Pro Max 256GB',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    description: 'Detailed description of the order',
    example: 'Brand new iPhone 15 Pro Max, Natural Titanium color, 256GB storage. Includes original box and accessories.',
    minLength: 20,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({
    description: 'Category of the order',
    enum: OrderCategory,
    example: OrderCategory.ELECTRONICS,
  })
  @IsEnum(OrderCategory, { message: 'Invalid order category' })
  category: OrderCategory;

  @ApiProperty({
    description: 'Role of the initiator (BUYER or SELLER)',
    enum: InitiatorRole,
    example: InitiatorRole.BUYER,
  })
  @IsEnum(InitiatorRole, { message: 'Initiator role must be BUYER or SELLER' })
  initiatorRole: InitiatorRole;

  @ApiProperty({
    description: 'Amount in minor units (cents/sen). For IDR, this is the full amount.',
    example: 25000000,
    minimum: 10000,
    maximum: 1000000000,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(10000, { message: 'Minimum amount is Rp 10,000' })
  @Max(1000000000, { message: 'Maximum amount is Rp 1,000,000,000' })
  amountMinor: number;

  @ApiProperty({
    description: 'Who pays the platform fee',
    enum: FeePayer,
    example: FeePayer.BUYER,
  })
  @IsEnum(FeePayer, { message: 'Invalid fee payer option' })
  feePayer: FeePayer;

  @ApiProperty({
    description: 'Holding period in days before auto-release',
    example: 3,
    minimum: 1,
    maximum: 30,
  })
  @IsInt()
  @Type(() => Number)
  @Min(1, { message: 'Holding period must be at least 1 day' })
  @Max(30, { message: 'Holding period must not exceed 30 days' })
  holdingPeriodDays: number;

  @ApiPropertyOptional({
    description: 'Custom terms and conditions for this order',
    example: 'Item must be tested within 24 hours of delivery. No returns after testing.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Custom terms must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  customTerms?: string;

  @ApiPropertyOptional({
    description: 'Email of the counterparty to invite',
    example: 'counterparty@example.com',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  counterpartyEmail?: string;
}

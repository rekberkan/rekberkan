import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum OrderCategory {
  ELECTRONICS = 'ELECTRONICS',
  SERVICES = 'SERVICES',
  DIGITAL_GOODS = 'DIGITAL_GOODS',
  PHYSICAL_GOODS = 'PHYSICAL_GOODS',
  OTHER = 'OTHER',
}

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Updated title of the order',
    example: 'iPhone 15 Pro Max 256GB - Updated',
    minLength: 5,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the order',
    example: 'Updated description with more details...',
    minLength: 20,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated category of the order',
    enum: OrderCategory,
    example: OrderCategory.ELECTRONICS,
  })
  @IsOptional()
  @IsEnum(OrderCategory, { message: 'Invalid order category' })
  category?: OrderCategory;

  @ApiPropertyOptional({
    description: 'Updated amount in minor units (only before acceptance)',
    example: 26000000,
    minimum: 10000,
    maximum: 1000000000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(10000, { message: 'Minimum amount is Rp 10,000' })
  @Max(1000000000, { message: 'Maximum amount is Rp 1,000,000,000' })
  amountMinor?: number;

  @ApiPropertyOptional({
    description: 'Updated holding period in days (only before acceptance)',
    example: 5,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1, { message: 'Holding period must be at least 1 day' })
  @Max(30, { message: 'Holding period must not exceed 30 days' })
  holdingPeriodDays?: number;

  @ApiPropertyOptional({
    description: 'Updated custom terms and conditions',
    example: 'Updated terms...',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Custom terms must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  customTerms?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, MinLength, MaxLength, IsNotEmpty, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================================================
// CREATE DISPUTE DTO
// ============================================================================

export enum DisputeReason {
  PRODUCT_NOT_AS_DESCRIBED = 'PRODUCT_NOT_AS_DESCRIBED',
  PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED',
  PRODUCT_DAMAGED = 'PRODUCT_DAMAGED',
  SELLER_NOT_RESPONDING = 'SELLER_NOT_RESPONDING',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  OTHER = 'OTHER',
}

export class CreateDisputeDto {
  @ApiProperty({ 
    description: 'Order/Transaction ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'Invalid order ID format' })
  @IsNotEmpty({ message: 'Order ID is required' })
  orderId: string;

  @ApiProperty({ 
    description: 'Reason for dispute',
    enum: DisputeReason,
    example: 'PRODUCT_NOT_AS_DESCRIBED',
  })
  @IsEnum(DisputeReason, { message: 'Invalid dispute reason' })
  @IsNotEmpty({ message: 'Reason is required' })
  reason: DisputeReason;

  @ApiProperty({ 
    description: 'Detailed description of the dispute (20-2000 characters)',
    example: 'The product received is completely different from the description. I ordered a blue shirt but received a red one.',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;
}

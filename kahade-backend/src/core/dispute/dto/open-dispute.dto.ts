import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum DisputeReason {
  PRODUCT_NOT_AS_DESCRIBED = 'PRODUCT_NOT_AS_DESCRIBED',
  PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED',
  PRODUCT_DAMAGED = 'PRODUCT_DAMAGED',
  SELLER_NOT_RESPONDING = 'SELLER_NOT_RESPONDING',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  OTHER = 'OTHER',
}

export class OpenDisputeDto {
  @ApiProperty({
    description: 'Order ID to dispute',
    example: 'order-uuid-123',
  })
  @IsUUID('4', { message: 'Invalid order ID' })
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Reason for opening the dispute',
    enum: DisputeReason,
    example: DisputeReason.PRODUCT_NOT_AS_DESCRIBED,
  })
  @IsEnum(DisputeReason, { message: 'Invalid dispute reason' })
  reason: DisputeReason;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'The product I received is completely different from what was advertised...',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiPropertyOptional({
    description: 'URL to initial evidence',
    example: 'https://storage.example.com/evidence.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid evidence URL' })
  evidenceUrl?: string;
}

import { IsString, IsNotEmpty, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum RefundReason {
  SELLER_NO_RESPONSE = 'SELLER_NO_RESPONSE',
  ITEM_NOT_AS_DESCRIBED = 'ITEM_NOT_AS_DESCRIBED',
  ITEM_NOT_DELIVERED = 'ITEM_NOT_DELIVERED',
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
  ADMIN_DECISION = 'ADMIN_DECISION',
  OTHER = 'OTHER',
}

export class RefundEscrowDto {
  @ApiProperty({
    description: 'Reason for refund',
    enum: RefundReason,
    example: RefundReason.MUTUAL_AGREEMENT,
  })
  @IsEnum(RefundReason, { message: 'Invalid refund reason' })
  reason: RefundReason;

  @ApiPropertyOptional({
    description: 'Additional details about the refund',
    example: 'Both parties agreed to cancel the transaction.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  details?: string;
}

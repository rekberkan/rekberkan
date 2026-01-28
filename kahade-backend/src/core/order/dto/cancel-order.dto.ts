import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum CancellationReason {
  CHANGED_MIND = 'CHANGED_MIND',
  FOUND_BETTER_DEAL = 'FOUND_BETTER_DEAL',
  COUNTERPARTY_UNRESPONSIVE = 'COUNTERPARTY_UNRESPONSIVE',
  PRICE_DISAGREEMENT = 'PRICE_DISAGREEMENT',
  TERMS_DISAGREEMENT = 'TERMS_DISAGREEMENT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  OTHER = 'OTHER',
}

export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    enum: CancellationReason,
    example: CancellationReason.CHANGED_MIND,
  })
  @IsEnum(CancellationReason, { message: 'Invalid cancellation reason' })
  reason: CancellationReason;

  @ApiPropertyOptional({
    description: 'Additional details about the cancellation',
    example: 'I found a better price elsewhere.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Details must not exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  details?: string;
}

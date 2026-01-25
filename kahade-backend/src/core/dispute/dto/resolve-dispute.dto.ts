import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MinLength, MaxLength, IsNotEmpty, Matches, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { DisputeDecision } from '@common/shims/prisma-types.shim';

// ============================================================================
// RESOLVE DISPUTE DTO
// ============================================================================

export class ResolveDisputeDto {
  @ApiProperty({ 
    enum: DisputeDecision, 
    example: 'RELEASE_ALL_TO_SELLER',
    description: 'Resolution decision',
  })
  @IsEnum(DisputeDecision, { message: 'Invalid decision type' })
  @IsNotEmpty({ message: 'Decision is required' })
  decision: DisputeDecision;

  @ApiProperty({ 
    example: '1000000', 
    required: false, 
    description: 'Amount in minor units (cents) to give to seller. Required for SPLIT_SETTLEMENT.',
  })
  @ValidateIf(o => o.decision === 'SPLIT_SETTLEMENT')
  @IsNotEmpty({ message: 'Seller amount is required for split settlement' })
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'Seller amount must be a numeric string' })
  sellerAmountMinor?: string;

  @ApiProperty({ 
    example: '500000', 
    required: false, 
    description: 'Amount in minor units (cents) to refund to buyer. Required for SPLIT_SETTLEMENT.',
  })
  @ValidateIf(o => o.decision === 'SPLIT_SETTLEMENT')
  @IsNotEmpty({ message: 'Buyer refund amount is required for split settlement' })
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'Buyer refund amount must be a numeric string' })
  buyerRefundMinor?: string;

  @ApiProperty({ 
    example: 'After reviewing all evidence submitted by both parties, the buyer\'s claim is valid. The product description was misleading.',
    description: 'Detailed resolution notes (50-2000 characters)',
    minLength: 50,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Resolution notes are required' })
  @MinLength(50, { message: 'Resolution notes must be at least 50 characters' })
  @MaxLength(2000, { message: 'Resolution notes must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  resolutionNotes: string;
}

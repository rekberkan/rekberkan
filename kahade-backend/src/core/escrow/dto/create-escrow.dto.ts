import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsInt,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEscrowDto {
  @ApiProperty({
    description: 'Order ID to create escrow for',
    example: 'order-uuid-123',
  })
  @IsUUID('4', { message: 'Invalid order ID' })
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Seller user ID (if known)',
    example: 'user-uuid-456',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid seller ID' })
  sellerUserId?: string;

  @ApiProperty({
    description: 'Amount in minor units (cents/sen)',
    example: 25000000,
    minimum: 10000,
    maximum: 1000000000,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(10000, { message: 'Minimum escrow amount is Rp 10,000' })
  @Max(1000000000, { message: 'Maximum escrow amount is Rp 1,000,000,000' })
  amountMinor: number;

  @ApiProperty({
    description: 'Escrow timeout in hours',
    example: 72,
    minimum: 24,
    maximum: 720,
  })
  @IsInt()
  @Type(() => Number)
  @Min(24, { message: 'Minimum timeout is 24 hours' })
  @Max(720, { message: 'Maximum timeout is 720 hours (30 days)' })
  timeoutHours: number;
}

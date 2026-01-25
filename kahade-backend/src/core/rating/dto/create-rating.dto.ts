import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max, MinLength, MaxLength, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================================================
// CREATE RATING DTO
// ============================================================================

export class CreateRatingDto {
  @ApiProperty({ 
    description: 'Transaction/Order ID to rate',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'Invalid order ID format' })
  @IsNotEmpty({ message: 'Order ID is required' })
  orderId: string;

  @ApiProperty({ 
    description: 'Rating score (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsNumber({}, { message: 'Score must be a number' })
  @Min(1, { message: 'Minimum rating is 1' })
  @Max(5, { message: 'Maximum rating is 5' })
  score: number;

  @ApiProperty({ 
    description: 'Optional review comment (10-500 characters)',
    example: 'Great seller! Fast delivery and item as described.',
    required: false,
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'Comment must be at least 10 characters' })
  @MaxLength(500, { message: 'Comment must not exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  comment?: string;
}

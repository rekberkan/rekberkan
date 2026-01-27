import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateOrderCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'I have shipped the item. Tracking number: JNE123456789',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: 'comment-uuid-123',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid parent comment ID' })
  parentId?: string;
}

export class UpdateOrderCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'Updated: I have shipped the item. Tracking number: JNE123456789',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  content: string;
}

export class OrderCommentResponseDto {
  @ApiProperty({ example: 'comment-uuid-123' })
  id: string;

  @ApiProperty({ example: 'I have shipped the item...' })
  content: string;

  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiPropertyOptional({ example: 'comment-uuid-456' })
  parentId?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-15T11:00:00Z' })
  updatedAt?: Date;

  @ApiPropertyOptional({ example: false })
  isEdited?: boolean;
}

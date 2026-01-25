import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '@common/shims/prisma-types.shim';

export class CreateNotificationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: 'TRANSACTION' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Payment Received' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'You have received payment for transaction #123' })
  @IsString()
  message: string;

  @ApiProperty({ required: false, example: { transactionId: '123' } })
  @IsOptional()
  metadata?: any;
}

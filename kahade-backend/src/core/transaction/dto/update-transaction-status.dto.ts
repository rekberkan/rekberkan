import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../common/shims/prisma-types.shim';

export class UpdateTransactionStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

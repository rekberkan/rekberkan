import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OrderUserDto {
  @ApiProperty({ example: "user-uuid-123" })
  id: string;

  @ApiProperty({ example: "johndoe" })
  username: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  avatarUrl?: string;

  @ApiProperty({ example: 4.5 })
  reputationScore: number;

  @ApiProperty({ example: 50 })
  totalTransactions: number;
}

export class EscrowHoldDto {
  @ApiProperty({ example: "escrow-uuid-123" })
  id: string;

  @ApiProperty({ example: 25000000 })
  amountMinor: bigint;

  @ApiProperty({ example: "ACTIVE" })
  status: string;

  @ApiPropertyOptional({ example: "2024-01-15T10:00:00Z" })
  timeoutAt?: Date;
}

export class OrderDetailDto {
  @ApiProperty({ example: "order-uuid-123" })
  id: string;

  @ApiProperty({ example: "ORD-20240115-ABC123" })
  orderNumber: string;

  @ApiProperty({ example: "iPhone 15 Pro Max 256GB" })
  title: string;

  @ApiProperty({ example: "Brand new iPhone..." })
  description: string;

  @ApiProperty({ example: "ELECTRONICS" })
  category: string;

  @ApiProperty({ example: "IDR" })
  currency: string;

  @ApiProperty({ example: 25000000 })
  amountMinor: bigint;

  @ApiProperty({ example: "BUYER" })
  feePayer: string;

  @ApiProperty({ example: 250000 })
  platformFeeMinor: bigint;

  @ApiProperty({ example: 3 })
  holdingPeriodDays: number;

  @ApiPropertyOptional({ example: "Custom terms..." })
  customTerms?: string;

  @ApiProperty({ example: "PENDING_ACCEPT" })
  status: string;

  @ApiProperty({ example: "BUYER" })
  initiatorRole: string;

  @ApiProperty({ type: OrderUserDto })
  initiator: OrderUserDto;

  @ApiPropertyOptional({ type: OrderUserDto })
  counterparty?: OrderUserDto;

  @ApiPropertyOptional({ type: EscrowHoldDto })
  escrowHold?: EscrowHoldDto;

  @ApiProperty({ example: "2024-01-15T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-01-15T10:00:00Z" })
  updatedAt: Date;

  @ApiPropertyOptional({ example: "2024-01-15T12:00:00Z" })
  acceptedAt?: Date;

  @ApiPropertyOptional({ example: "2024-01-15T14:00:00Z" })
  paidAt?: Date;

  @ApiPropertyOptional({ example: "2024-01-18T10:00:00Z" })
  autoReleaseAt?: Date;

  @ApiPropertyOptional({ example: "2024-01-18T10:00:00Z" })
  completedAt?: Date;

  @ApiPropertyOptional({ example: "2024-01-16T10:00:00Z" })
  cancelledAt?: Date;
}

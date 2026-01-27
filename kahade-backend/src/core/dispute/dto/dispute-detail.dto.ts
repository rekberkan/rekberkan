import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisputePartyDto {
  @ApiProperty({ example: 'user-uuid-123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;
}

export class DisputeOrderDto {
  @ApiProperty({ example: 'order-uuid-123' })
  id: string;

  @ApiProperty({ example: 'ORD-20240115-ABC123' })
  orderNumber: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  title: string;

  @ApiProperty({ example: 25000000 })
  amountMinor: bigint;
}

export class DisputeEvidenceDto {
  @ApiProperty({ example: 'evidence-uuid-123' })
  id: string;

  @ApiProperty({ example: 'user-uuid-123' })
  submittedById: string;

  @ApiProperty({ example: 'SCREENSHOT' })
  type: string;

  @ApiProperty({ example: 'Screenshot showing the damaged product' })
  description: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/evidence.jpg' })
  fileUrl?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;
}

export class DisputeDetailDto {
  @ApiProperty({ example: 'dispute-uuid-123' })
  id: string;

  @ApiProperty({ type: DisputeOrderDto })
  order: DisputeOrderDto;

  @ApiProperty({ type: DisputePartyDto })
  initiator: DisputePartyDto;

  @ApiPropertyOptional({ type: DisputePartyDto })
  respondent?: DisputePartyDto;

  @ApiProperty({ example: 'PRODUCT_NOT_AS_DESCRIBED' })
  reason: string;

  @ApiProperty({ example: 'The product received is different from description...' })
  description: string;

  @ApiProperty({ example: 'UNDER_REVIEW' })
  status: string;

  @ApiPropertyOptional({ example: 'I disagree with the claim...' })
  respondentResponse?: string;

  @ApiPropertyOptional({ type: [DisputeEvidenceDto] })
  evidence?: DisputeEvidenceDto[];

  @ApiPropertyOptional({ example: 'Resolved in favor of buyer due to...' })
  resolution?: string;

  @ApiPropertyOptional({ example: '2024-01-20T10:00:00Z' })
  resolvedAt?: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T12:00:00Z' })
  updatedAt: Date;
}

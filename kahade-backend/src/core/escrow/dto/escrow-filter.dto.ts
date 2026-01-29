import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export enum EscrowStatus {
  ACTIVE = "ACTIVE",
  RELEASED = "RELEASED",
  REFUNDED = "REFUNDED",
  DISPUTED = "DISPUTED",
  EXPIRED = "EXPIRED",
}

export enum EscrowSortField {
  CREATED_AT = "createdAt",
  AMOUNT = "amountMinor",
  TIMEOUT_AT = "timeoutAt",
  STATUS = "status",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class EscrowFilterDto {
  @ApiPropertyOptional({
    description: "Filter by escrow status",
    enum: EscrowStatus,
    example: EscrowStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EscrowStatus)
  status?: EscrowStatus;

  @ApiPropertyOptional({
    description: "Filter by role (as_buyer or as_seller)",
    enum: ["as_buyer", "as_seller"],
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  role?: "as_buyer" | "as_seller";

  @ApiPropertyOptional({
    description: "Filter escrows created after this date",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: "Filter escrows created before this date",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: "Page number",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    example: 10,
    default: 10,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Sort field",
    enum: EscrowSortField,
    default: EscrowSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(EscrowSortField)
  sortBy?: EscrowSortField = EscrowSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

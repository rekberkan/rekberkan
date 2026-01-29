import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export enum WithdrawalStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum WithdrawalSortField {
  CREATED_AT = "createdAt",
  AMOUNT = "amountMinor",
  STATUS = "status",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class WithdrawalFilterDto {
  @ApiPropertyOptional({
    description: "Filter by withdrawal status",
    enum: WithdrawalStatus,
  })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({
    description: "Filter withdrawals created after this date",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: "Filter withdrawals created before this date",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: "Page number",
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
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
    enum: WithdrawalSortField,
    default: WithdrawalSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(WithdrawalSortField)
  sortBy?: WithdrawalSortField = WithdrawalSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

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

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  VIRTUAL_ACCOUNT = "VIRTUAL_ACCOUNT",
  E_WALLET = "E_WALLET",
  QRIS = "QRIS",
  CREDIT_CARD = "CREDIT_CARD",
  RETAIL_OUTLET = "RETAIL_OUTLET",
}

export enum PaymentSortField {
  CREATED_AT = "createdAt",
  AMOUNT = "amountMinor",
  STATUS = "status",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class PaymentFilterDto {
  @ApiPropertyOptional({
    description: "Filter by payment status",
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    description: "Filter by payment method",
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({
    description: "Filter payments created after this date",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: "Filter payments created before this date",
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
    enum: PaymentSortField,
    default: PaymentSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(PaymentSortField)
  sortBy?: PaymentSortField = PaymentSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

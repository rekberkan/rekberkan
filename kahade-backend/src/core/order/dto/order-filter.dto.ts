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

export enum OrderStatus {
  WAITING_COUNTERPARTY = "WAITING_COUNTERPARTY",
  PENDING_ACCEPT = "PENDING_ACCEPT",
  ACCEPTED = "ACCEPTED",
  PAID = "PAID",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
  REFUNDED = "REFUNDED",
}

export enum OrderSortField {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  AMOUNT = "amountMinor",
  STATUS = "status",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class OrderFilterDto {
  @ApiPropertyOptional({
    description: "Filter by order status",
    enum: OrderStatus,
    example: OrderStatus.PENDING_ACCEPT,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: "Invalid order status" })
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: "Filter by role (as_buyer or as_seller)",
    enum: ["as_buyer", "as_seller"],
    example: "as_buyer",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  role?: "as_buyer" | "as_seller";

  @ApiPropertyOptional({
    description: "Search by title or order number",
    example: "iPhone",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: "Filter orders created after this date",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: "Filter orders created before this date",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: "Minimum amount filter (in minor units)",
    example: 100000,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: "Maximum amount filter (in minor units)",
    example: 10000000,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: "Page number for pagination",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page",
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
    description: "Field to sort by",
    enum: OrderSortField,
    default: OrderSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(OrderSortField)
  sortBy?: OrderSortField = OrderSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

export enum DisputeDecision {
  FAVOR_BUYER = "FAVOR_BUYER",
  FAVOR_SELLER = "FAVOR_SELLER",
  SPLIT = "SPLIT",
  NO_ACTION = "NO_ACTION",
}

export class DisputeDecisionDto {
  @ApiProperty({
    description: "Decision on the dispute",
    enum: DisputeDecision,
    example: DisputeDecision.FAVOR_BUYER,
  })
  @IsEnum(DisputeDecision, { message: "Invalid decision" })
  decision: DisputeDecision;

  @ApiPropertyOptional({
    description: "Percentage of escrow to release to seller (0-100)",
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  sellerPercentage?: number;

  @ApiProperty({
    description: "Explanation for the decision",
    example: "Based on the evidence provided, the buyer claim is valid...",
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => value?.trim())
  explanation: string;

  @ApiPropertyOptional({
    description: "Internal notes (not visible to parties)",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  internalNotes?: string;
}

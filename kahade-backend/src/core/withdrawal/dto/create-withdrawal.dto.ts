import {
  IsNumber,
  IsUUID,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateWithdrawalDto {
  @ApiProperty({
    description: "Amount to withdraw in minor units (Rupiah)",
    example: 500000,
    minimum: 50000,
    maximum: 50000000,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(50000, { message: "Minimum withdrawal is Rp 50,000" })
  @Max(50000000, {
    message: "Maximum withdrawal is Rp 50,000,000 per transaction",
  })
  amountMinor: number;

  @ApiProperty({
    description: "Bank account ID to withdraw to",
    example: "bank-account-uuid-123",
  })
  @IsUUID("4", { message: "Invalid bank account ID" })
  bankAccountId: string;

  @ApiPropertyOptional({
    description: "Optional note for the withdrawal",
    example: "Monthly salary withdrawal",
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

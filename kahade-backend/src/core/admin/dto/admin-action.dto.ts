import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for admin actions that require a reason
 */
export class AdminReasonDto {
  @ApiProperty({
    description: "Reason for the admin action",
    example: "Violation of terms of service",
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: "Reason is required" })
  @MinLength(10, { message: "Reason must be at least 10 characters" })
  @MaxLength(1000, { message: "Reason must not exceed 1000 characters" })
  reason: string;
}

/**
 * DTO for admin actions with optional notes
 */
export class AdminActionWithNotesDto {
  @ApiProperty({
    description: "Reason for the admin action",
    example: "Violation of terms of service",
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: "Reason is required" })
  @MinLength(10, { message: "Reason must be at least 10 characters" })
  @MaxLength(1000, { message: "Reason must not exceed 1000 characters" })
  reason: string;

  @ApiPropertyOptional({
    description: "Additional notes for internal reference",
    example: "User was warned twice before suspension",
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: "Notes must not exceed 2000 characters" })
  notes?: string;
}

/**
 * DTO for user suspension with optional duration
 */
export class SuspendUserDto extends AdminReasonDto {
  @ApiPropertyOptional({
    description: "Suspension duration in days (null for permanent)",
    example: 30,
  })
  @IsOptional()
  durationDays?: number;
}

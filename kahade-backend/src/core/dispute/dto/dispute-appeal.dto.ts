import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class DisputeAppealDto {
  @ApiProperty({
    description: "Reason for appealing the dispute resolution",
    example:
      "I have new evidence that was not considered in the original decision...",
    minLength: 50,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: "Appeal reason is required" })
  @MinLength(50, { message: "Appeal reason must be at least 50 characters" })
  @MaxLength(2000, { message: "Appeal reason must not exceed 2000 characters" })
  @Transform(({ value }) => value?.trim())
  reason: string;

  @ApiPropertyOptional({
    description: "URL to new evidence supporting the appeal",
    example: "https://storage.example.com/new-evidence.pdf",
  })
  @IsOptional()
  @IsUrl({}, { message: "Invalid evidence URL" })
  newEvidenceUrl?: string;

  @ApiPropertyOptional({
    description: "Description of the new evidence",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  newEvidenceDescription?: string;
}

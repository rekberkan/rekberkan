import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class AcceptOrderDto {
  @ApiProperty({
    description: "Invite token received from the order creator",
    example: "abc123xyz789",
  })
  @IsString()
  @IsNotEmpty({ message: "Invite token is required" })
  @Transform(({ value }) => value?.trim())
  inviteToken: string;

  @ApiPropertyOptional({
    description: "Optional message to the order creator",
    example: "I accept this order. Looking forward to the transaction.",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Message must not exceed 500 characters" })
  @Transform(({ value }) => value?.trim())
  message?: string;
}

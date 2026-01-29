import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, MaxLength } from "class-validator";

// ============================================================================
// REFRESH TOKEN DTO
// ============================================================================

export class RefreshTokenDto {
  @ApiProperty({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty({ message: "Refresh token is required" })
  @MinLength(10, { message: "Invalid refresh token format" })
  @MaxLength(2048, { message: "Refresh token too long" })
  refreshToken: string;
}

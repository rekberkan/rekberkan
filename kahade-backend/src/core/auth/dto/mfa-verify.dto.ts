import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches, IsOptional } from 'class-validator';

// ============================================================================
// MFA VERIFY DTO
// ============================================================================

export class MfaVerifyDto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'MFA code is required' })
  @Length(6, 6, { message: 'MFA code must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'MFA code must contain only digits' })
  code: string;

  @ApiProperty({
    description: 'Whether this is a backup code instead of TOTP',
    required: false,
    default: false,
  })
  @IsOptional()
  isBackupCode?: boolean;
}

export class MfaDisableDto {
  @ApiProperty({
    description: 'Current password to confirm MFA disable',
    example: 'CurrentP@ss123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required to disable MFA' })
  password: string;

  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'MFA code is required' })
  @Length(6, 6, { message: 'MFA code must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'MFA code must contain only digits' })
  code: string;
}

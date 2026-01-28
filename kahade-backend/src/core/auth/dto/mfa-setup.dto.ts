import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

// ============================================================================
// MFA SETUP DTO
// ============================================================================

export class MfaSetupDto {
  @ApiProperty({
    description: 'TOTP code from authenticator app to verify setup',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'MFA code is required' })
  @Length(6, 6, { message: 'MFA code must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'MFA code must contain only digits' })
  code: string;
}

export class MfaEnableResponseDto {
  @ApiProperty({ description: 'Secret key for authenticator app' })
  secret: string;

  @ApiProperty({ description: 'QR code URL for scanning' })
  qrCodeUrl: string;

  @ApiProperty({ description: 'Backup codes for recovery' })
  backupCodes: string[];
}

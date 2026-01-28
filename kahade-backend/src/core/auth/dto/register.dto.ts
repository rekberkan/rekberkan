import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsNotEmpty,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================================================
// BANK-GRADE REGISTRATION DTO
// Implements: Input Validation, Sanitization, Security Constraints
// ============================================================================

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Valid email address',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username (3-30 characters, alphanumeric and underscore only)',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message: 'Username must start with a letter and contain only letters, numbers, and underscores',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @ApiProperty({
    example: 'SecureP@ss123!',
    description:
      'Strong password (min 8 chars, must include uppercase, lowercase, number, and special character)',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty({
    example: '+628123456789',
    required: false,
    description: 'Phone number in international format (optional)',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Phone number must be at least 10 characters' })
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  @Matches(/^\+?[0-9]{10,20}$/, {
    message: 'Please provide a valid phone number',
  })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  phone?: string;

  @ApiProperty({
    example: 'REF123ABC',
    required: false,
    description: 'Referral code (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Referral code must not exceed 20 characters' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Referral code must contain only uppercase letters and numbers',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  referralCode?: string;
}

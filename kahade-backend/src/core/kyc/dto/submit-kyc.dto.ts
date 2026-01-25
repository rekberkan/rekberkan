import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsDateString, IsOptional, Matches, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================================================
// SUBMIT KYC DTO
// ============================================================================

export enum KYCDocumentType {
  KTP = 'KTP',
  SIM = 'SIM',
  PASSPORT = 'PASSPORT',
}

export class SubmitKycDto {
  @ApiProperty({ 
    enum: KYCDocumentType,
    description: 'Type of identity document',
    example: 'KTP',
  })
  @IsEnum(KYCDocumentType, { message: 'Invalid document type' })
  @IsNotEmpty({ message: 'Document type is required' })
  documentType: KYCDocumentType;

  @ApiProperty({ 
    description: 'Full legal name as shown on document',
    example: 'JOHN DOE',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(3, { message: 'Full name must be at least 3 characters' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s\.\-']+$/, { message: 'Full name contains invalid characters' })
  @Transform(({ value }) => value?.toUpperCase().trim())
  fullName: string;

  @ApiProperty({ 
    description: 'Identity number (NIK for KTP, 16 digits)',
    example: '3201010101010001',
  })
  @IsString()
  @IsNotEmpty({ message: 'ID number is required' })
  @Matches(/^[0-9]{16}$/, { message: 'ID number must be exactly 16 digits (NIK format)' })
  idNumber: string;

  @ApiProperty({ 
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString({}, { message: 'Invalid date format. Use YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  dateOfBirth: string;

  @ApiProperty({ 
    description: 'Address as shown on document',
    example: 'Jl. Sudirman No. 123, Jakarta Selatan',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Address must not exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiProperty({ 
    description: 'URL of uploaded document image',
    example: 'https://storage.kahade.com/kyc/user123/ktp.jpg',
  })
  @IsString()
  @IsNotEmpty({ message: 'Document URL is required' })
  @MaxLength(500, { message: 'Document URL is too long' })
  documentUrl: string;

  @ApiProperty({ 
    description: 'URL of selfie with document',
    example: 'https://storage.kahade.com/kyc/user123/selfie.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Selfie URL is too long' })
  selfieUrl?: string;
}

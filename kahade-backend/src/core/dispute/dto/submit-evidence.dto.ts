import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsNotEmpty, IsEnum, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================================================
// SUBMIT EVIDENCE DTO
// ============================================================================

export enum EvidenceType {
  SCREENSHOT = 'SCREENSHOT',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  CHAT_LOG = 'CHAT_LOG',
  RECEIPT = 'RECEIPT',
  TRACKING_INFO = 'TRACKING_INFO',
  OTHER = 'OTHER',
}

export class SubmitEvidenceDto {
  @ApiProperty({ 
    enum: EvidenceType,
    description: 'Type of evidence being submitted',
    example: 'SCREENSHOT',
  })
  @IsEnum(EvidenceType, { message: 'Invalid evidence type' })
  @IsNotEmpty({ message: 'Evidence type is required' })
  type: EvidenceType;

  @ApiProperty({ 
    description: 'Description of the evidence (10-500 characters)',
    example: 'Screenshot of the product listing showing different specifications than what was received.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({ 
    description: 'URL of the uploaded evidence file',
    example: 'https://storage.kahade.com/evidence/123/screenshot.png',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid URL format' })
  @MaxLength(500, { message: 'URL must not exceed 500 characters' })
  fileUrl?: string;
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { memoryStorage } from 'multer';

// ============================================================================
// KYC CONTROLLER - BANK-GRADE SECURITY
// Implements: Document Upload, Status Tracking, Encrypted PII Storage
// ============================================================================

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = process.env.UPLOAD_DEST || './uploads';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class KycController {
  private readonly logger = new Logger(KycController.name);
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDir();

    // Initialize encryption key from environment
    const keyHex = this.configService.get<string>('KYC_ENCRYPTION_KEY');
    if (keyHex && keyHex.length === 64) {
      this.encryptionKey = Buffer.from(keyHex, 'hex');
    } else {
      // Generate a key for development (MUST be set in production)
      this.encryptionKey = crypto.randomBytes(32);
      this.logger.warn(
        'KYC_ENCRYPTION_KEY not set or invalid. Using random key (NOT FOR PRODUCTION)',
      );
    }
  }

  private ensureUploadDir(): void {
    const kycDir = path.join(UPLOAD_DIR, 'kyc');
    if (!fs.existsSync(kycDir)) {
      fs.mkdirSync(kycDir, { recursive: true });
    }
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * BANK-GRADE: Encrypt sensitive PII data using AES-256-GCM
   */
  private encryptPII(plaintext: string): string {
    if (!plaintext) return '';

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * BANK-GRADE: Decrypt sensitive PII data
   */
  private decryptPII(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) return '[Decryption Error]';

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = parts[2];

      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`PII decryption failed: ${error.message}`);
      return '[Decryption Error]';
    }
  }

  private async saveFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ path: string; hash: string }> {
    const userDir = path.join(UPLOAD_DIR, 'kyc', userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const fileHash = this.generateFileHash(file.buffer);
    const fileExt = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${fileHash.substring(0, 8)}.${fileExt}`;
    const filePath = path.join(userDir, fileName);
    const relativePath = `/uploads/kyc/${userId}/${fileName}`;

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    return { path: relativePath, hash: fileHash };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get KYC status' })
  @ApiResponse({ status: 200, description: 'Returns KYC status' })
  async getStatus(@CurrentUser('id') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
      },
    });

    const latestSubmission = await this.prisma.kYCSubmission.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        submittedAt: true,
        verifiedAt: true,
      },
    });

    return {
      status: user?.kycStatus || 'NONE',
      latestSubmission: latestSubmission || null,
    };
  }

  @Post('submit')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, PDF'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Submit KYC document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        document: { type: 'string', format: 'binary' },
        documentType: { type: 'string', enum: ['KTP', 'SIM', 'PASSPORT'] },
        fullName: { type: 'string' },
        idNumber: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        address: { type: 'string' },
      },
      required: ['document', 'documentType', 'fullName', 'idNumber'],
    },
  })
  @ApiResponse({ status: 201, description: 'KYC document submitted' })
  @ApiResponse({ status: 400, description: 'Invalid document or data' })
  async submitKyc(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      documentType: string;
      fullName: string;
      idNumber: string;
      dateOfBirth?: string;
      address?: string;
    },
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, PDF');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Validate document type
    const validDocTypes = ['KTP', 'SIM', 'PASSPORT'];
    if (!validDocTypes.includes(body.documentType?.toUpperCase())) {
      throw new BadRequestException('Invalid document type. Allowed: KTP, SIM, PASSPORT');
    }

    // Validate required fields
    if (!body.fullName || body.fullName.length < 2) {
      throw new BadRequestException('Full name is required (min 2 characters)');
    }

    if (!body.idNumber || body.idNumber.length < 6) {
      throw new BadRequestException('ID number is required (min 6 characters)');
    }

    // Sanitize ID number (remove spaces and special chars)
    const sanitizedIdNumber = body.idNumber.replace(/[^a-zA-Z0-9]/g, '');

    // Check for existing pending submission
    const existingPending = await this.prisma.kYCSubmission.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending KYC submission');
    }

    // Save file and generate hash
    const { path: filePath, hash: fileHash } = await this.saveFile(file, userId);

    // BANK-GRADE: Encrypt all PII data before storage
    const encryptedFullName = this.encryptPII(body.fullName.trim());
    const encryptedIdNumber = this.encryptPII(sanitizedIdNumber);
    const encryptedDateOfBirth = this.encryptPII(body.dateOfBirth || '');
    const encryptedAddress = this.encryptPII(body.address?.trim() || '');

    // Create KYC submission
    const submission = await this.prisma.$transaction(async (tx) => {
      // Create submission record with encrypted PII
      const kycSubmission = await tx.kYCSubmission.create({
        data: {
          userId,
          idCardObjectKey: filePath,
          selfieObjectKey: filePath, // Same file for now, can be separate in future
          idCardHash: fileHash,
          selfieHash: fileHash,
          fullNameEnc: encryptedFullName,
          idNumberEnc: encryptedIdNumber,
          dateOfBirthEnc: encryptedDateOfBirth,
          addressEnc: encryptedAddress,
          status: 'PENDING',
        },
      });

      // Update user KYC status
      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: 'PENDING' },
      });

      return kycSubmission;
    });

    this.logger.log(`KYC submission created: ${submission.id} for user ${userId}`);

    return {
      message: 'KYC document submitted successfully',
      submissionId: submission.id,
      status: 'PENDING',
    };
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get all KYC submissions' })
  @ApiResponse({ status: 200, description: 'Returns KYC submission history' })
  async getSubmissions(@CurrentUser('id') userId: string) {
    const submissions = await this.prisma.kYCSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        submittedAt: true,
        verifiedAt: true,
      },
    });

    return { submissions };
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get KYC submission details' })
  @ApiResponse({ status: 200, description: 'Returns KYC submission details' })
  async getSubmission(@CurrentUser('id') userId: string, @Param('id') submissionId: string) {
    const submission = await this.prisma.kYCSubmission.findFirst({
      where: {
        id: submissionId,
        userId, // Ensure user can only access their own submissions
      },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        submittedAt: true,
        verifiedAt: true,
        fullNameEnc: true,
        dateOfBirthEnc: true,
        addressEnc: true,
      },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    // Decrypt PII for display
    return {
      id: submission.id,
      status: submission.status,
      rejectionReason: submission.rejectionReason,
      submittedAt: submission.submittedAt,
      verifiedAt: submission.verifiedAt,
      fullName: this.decryptPII(submission.fullNameEnc),
      dateOfBirth: this.decryptPII(submission.dateOfBirthEnc),
      address: this.decryptPII(submission.addressEnc),
    };
  }
}

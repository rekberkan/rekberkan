import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { UserRepository, ICreateUser, IUpdateUser } from './user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationUtil, PaginationParams } from '@common/utils/pagination.util';
import { IUserResponse, KYCStatus } from '@common/interfaces/user.interface';
import { User } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { UploadKycDto } from './dto/upload-kyc.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// ============================================================================
// USER SERVICE - Production Ready
// ============================================================================

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly AVATAR_UPLOAD_DIR = process.env.AVATAR_UPLOAD_DEST || './uploads/avatars';
  private readonly KYC_UPLOAD_DIR = process.env.UPLOAD_DEST || './uploads';

  constructor(
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createUserData: ICreateUser): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(createUserData.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    if (createUserData.username) {
      const existingUsername = await this.userRepository.findByUsername(createUserData.username);
      if (existingUsername) {
        throw new BadRequestException('Username already exists');
      }
    }

    return this.userRepository.create(createUserData);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async findAll(params: PaginationParams) {
    const { page = 1, limit = 10 } = params;
    const skip = PaginationUtil.getSkip(page, limit);

    const { users, total } = await this.userRepository.findAll(skip, limit);

    const sanitizedUsers = users.map((user) => this.sanitizeUser(user));

    return PaginationUtil.paginate(sanitizedUsers, total, page, limit);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUserResponse> {
    await this.findById(id); // Validate user exists

    const updateData: IUpdateUser = {};

    if (updateUserDto.username) {
      // Check if username is taken by another user
      const existingUsername = await this.userRepository.findByUsername(updateUserDto.username);
      if (existingUsername && existingUsername.id !== id) {
        throw new BadRequestException('Username already exists');
      }
      updateData.username = updateUserDto.username;
    }
    if (updateUserDto.phone) updateData.phone = updateUserDto.phone;

    const updated = await this.userRepository.update(id, updateData);
    return this.sanitizeUser(updated);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.delete(id);
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    // Hash and update password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
      passwordUpdatedAt: new Date(),
    });

    this.logger.log(`Password changed for user ${userId}`);

    return { message: 'Password changed successfully' };
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
      passwordUpdatedAt: new Date(),
    });
  }

  async setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.userRepository.update(userId, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
    });
  }

  async findByPasswordResetToken(tokenHash: string): Promise<User | null> {
    return this.userRepository.findByPasswordResetToken(tokenHash);
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  async setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerificationToken: tokenHash,
      emailVerificationExpires: expiresAt,
    });
  }

  async findByEmailVerificationToken(tokenHash: string): Promise<User | null> {
    return this.userRepository.findByEmailVerificationToken(tokenHash);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }

  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return !!user.emailVerifiedAt;
  }

  // ============================================================================
  // KYC MANAGEMENT
  // ============================================================================

  async uploadKYCDocument(
    userId: string,
    file: Express.Multer.File,
    payload: UploadKycDto,
  ): Promise<{ message: string; status: string }> {
    await this.findById(userId);

    // In production, upload to S3/cloud storage
    // For now, we'll store the file on disk
    const userDir = path.join(this.KYC_UPLOAD_DIR, 'kyc', userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const fileExt = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const fileName = `${Date.now()}_${fileHash.substring(0, 8)}.${fileExt}`;
    const filePath = `/uploads/kyc/${userId}/${fileName}`;
    const fullPath = path.join(userDir, fileName);

    fs.writeFileSync(fullPath, file.buffer);

    await this.prisma.kYCSubmission.create({
      data: {
        userId,
        idCardObjectKey: filePath,
        selfieObjectKey: filePath,
        idCardHash: fileHash,
        selfieHash: fileHash,
        fullNameEnc: payload.fullName.trim(),
        idNumberEnc: payload.idNumber.trim(),
        dateOfBirthEnc: payload.dateOfBirth,
        addressEnc: payload.address?.trim() ?? '',
        status: 'PENDING',
      },
    });

    // Update user KYC status
    await this.userRepository.update(userId, {
      kycStatus: 'PENDING',
    });

    this.logger.log(`KYC document uploaded for user ${userId}`);

    return {
      message: 'KYC document uploaded successfully',
      status: 'PENDING',
    };
  }

  // ============================================================================
  // PROFILE & SETTINGS
  // ============================================================================

  async updateNotificationSettings(
    userId: string,
    settings: Record<string, boolean>,
  ): Promise<IUserResponse> {
    const updated = await this.userRepository.update(userId, {
      notificationSettings: settings,
    });
    return this.sanitizeUser(updated);
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<IUserResponse> {
    if (!fs.existsSync(this.AVATAR_UPLOAD_DIR)) {
      fs.mkdirSync(this.AVATAR_UPLOAD_DIR, { recursive: true });
    }

    const fileExt = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const fileName = `${Date.now()}_${fileHash.substring(0, 8)}.${fileExt}`;
    const filePath = path.join(this.AVATAR_UPLOAD_DIR, fileName);
    const relativePath = `/uploads/avatars/${fileName}`;

    fs.writeFileSync(filePath, file.buffer);

    const updated = await this.userRepository.update(userId, {
      avatarUrl: relativePath,
    });

    this.logger.log(`Avatar updated for user ${userId}`);

    return this.sanitizeUser(updated);
  }

  async getStats(userId: string): Promise<{
    totalTransactions: number;
    completedTransactions: number;
    disputeCount: number;
  }> {
    const where = {
      deletedAt: null,
      OR: [{ initiatorId: userId }, { counterpartyId: userId }],
    };

    const [totalTransactions, completedTransactions, disputeCount] = await Promise.all([
      (this.prisma as any).order.count({ where }),
      (this.prisma as any).order.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),
      (this.prisma as any).order.count({
        where: {
          ...where,
          status: 'DISPUTED',
        },
      }),
    ]);

    return {
      totalTransactions,
      completedTransactions,
      disputeCount,
    };
  }

  // ============================================================================
  // RATINGS
  // ============================================================================

  async getUserRatings(userId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    breakdown: Record<number, number>;
    recentRatings: any[];
  }> {
    const ratings = await (this.prisma as any).rating.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { select: { id: true, username: true } },
        order: { select: { id: true, title: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.score, 0) / totalRatings
        : 0;

    // Calculate breakdown
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r: any) => {
      breakdown[r.score] = (breakdown[r.score] || 0) + 1;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      breakdown,
      recentRatings: ratings.slice(0, 10).map((r: any) => ({
        id: r.id,
        score: r.score,
        review: r.review,
        rater: r.fromUser,
        order: r.order,
        createdAt: r.createdAt,
      })),
    };
  }

  // ============================================================================
  // ACCOUNT STATUS MANAGEMENT
  // ============================================================================

  async suspendUser(userId: string, reason: string, suspendedUntil?: Date): Promise<void> {
    await this.userRepository.update(userId, {
      suspendedAt: new Date(),
      suspendedUntil: suspendedUntil || null,
      suspendReason: reason,
    });
  }

  async unsuspendUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      suspendedAt: null,
      suspendedUntil: null,
      suspendReason: null,
    });
  }

  async isUserSuspended(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user.suspendedAt) {
      return false;
    }

    // Check if suspension has expired
    if (user.suspendedUntil && new Date(user.suspendedUntil) < new Date()) {
      // Auto-unsuspend
      await this.unsuspendUser(userId);
      return false;
    }

    return true;
  }

  // ============================================================================
  // FAILED LOGIN TRACKING
  // ============================================================================

  async incrementFailedLogin(userId: string): Promise<number> {
    const user = await this.findById(userId);
    const newCount = (user.failedLoginCount || 0) + 1;

    await this.userRepository.update(userId, {
      failedLoginCount: newCount,
      lastFailedLoginAt: new Date(),
    });

    return newCount;
  }

  async resetFailedLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      failedLoginCount: 0,
      lastFailedLoginAt: null,
    });
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  sanitizeUser(user: any): IUserResponse {
    // Destructure to omit sensitive fields - using void to satisfy linter
    const {
      passwordHash,
      passwordResetToken,
      passwordResetExpires,
      totpSecretEnc,
      backupCodesHash,
      ...sanitized
    } = user;

    // Explicitly void the sensitive fields to indicate intentional omission
    void passwordHash;
    void passwordResetToken;
    void passwordResetExpires;
    void totpSecretEnc;
    void backupCodesHash;

    return {
      ...sanitized,
      kycStatus: user.kycStatus as KYCStatus,
    } as IUserResponse;
  }
}

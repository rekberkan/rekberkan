import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { HashUtil } from '@common/utils/hash.util';
import { IUserResponse } from '@common/interfaces/user.interface';
import { TokenBlacklistService } from './token-blacklist.service';
import { SessionRepository } from './session.repository';
import { MFAService } from './mfa.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// ============================================================================
// AUTH SERVICE - Production Ready
// ============================================================================

export interface IAuthResponse {
  user: IUserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

interface FailedAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly failedAttempts = new Map<string, FailedAttempt>();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly sessionRepository: SessionRepository,
    private readonly mfaService: MFAService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    // Validate password strength
    this.validatePasswordStrength(registerDto.password);

    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await HashUtil.hash(registerDto.password);
    const user = await this.userService.create({
      email: registerDto.email.toLowerCase(),
      username: registerDto.username,
      phone: registerDto.phone,
      passwordHash: hashedPassword,
    } as any);

    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token in Session DB
    try {
      await this.sessionRepository.create({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    } catch (error) {
      this.logger.error(`Failed to store session in DB: ${error.message}`);
    }

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`New user registered: ${user.id}`);

    return {
      user: this.userService.sanitizeUser(user),
      ...tokens,
      expiresIn: 900, // 15 minutes
    };
  }

  // ============================================================================
  // LOGIN WITH BRUTE FORCE PROTECTION
  // ============================================================================

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<IAuthResponse> {
    const email = loginDto.email.toLowerCase();

    // Check if account is locked
    const lockStatus = this.checkAccountLock(email);
    if (lockStatus.isLocked) {
      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED',
        message: `Too many failed login attempts. Please try again in ${lockStatus.remainingMinutes} minutes.`,
        lockedUntil: lockStatus.lockedUntil,
      });
    }

    const user = await this.validateUser(email, loginDto.password);
    if (!user) {
      // Record failed attempt
      this.recordFailedAttempt(email);
      
      // Use constant-time comparison to prevent timing attacks
      await this.dummyPasswordCheck();
      
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is suspended
    if (user.suspendedAt) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact support.',
        suspendedUntil: user.suspendedUntil,
        suspendReason: user.suspendReason,
      });
    }

    if (user.mfaEnabled) {
      await this.verifyMfaOrThrow(user, loginDto.mfaCode);
    }

    // Clear failed attempts on successful login
    this.failedAttempts.delete(email);

    // Update last login
    await this.userService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token in Session DB
    try {
      await this.sessionRepository.create({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.error(`Failed to store session in DB: ${error.message}`);
    }

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User ${user.id} logged in successfully`);

    return {
      user: this.userService.sanitizeUser(user),
      ...tokens,
      expiresIn: 900,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await HashUtil.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================

  async getCurrentUser(userId: string): Promise<IUserResponse> {
    const user = await this.userService.findById(userId);
    return this.userService.sanitizeUser(user);
  }

  // ============================================================================
  // TOKEN REFRESH WITH ROTATION
  // ============================================================================

  async refreshToken(refreshToken: string): Promise<ITokenPair & { expiresIn: number }> {
    try {
      // Verify token exists in cache/DB before refresh
      const userId = await this.tokenBlacklistService.validateRefreshToken(refreshToken);
      if (!userId) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Verify DB session
      const dbSession = await this.sessionRepository.findByToken(refreshToken);
      if (!dbSession || dbSession.revokedAt || new Date(dbSession.expiresAt) < new Date()) {
        throw new UnauthorizedException('Session invalid or expired');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (payload.sub !== userId) {
        throw new UnauthorizedException('Token mismatch');
      }

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is suspended
      if (user.suspendedAt) {
        throw new ForbiddenException('Account suspended');
      }

      // Revoke old refresh token (rotation)
      await this.tokenBlacklistService.revokeRefreshToken(refreshToken);
      await this.sessionRepository.revoke(refreshToken);

      // Generate new token pair
      const tokens = await this.generateTokens(user.id, user.email);

      // Store new refresh token in DB
      await this.sessionRepository.create({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Store new refresh token in cache
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        ...tokens,
        expiresIn: 900,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ============================================================================
  // LOGOUT WITH TOKEN REVOCATION
  // ============================================================================

  async logout(userId: string, accessToken: string, refreshToken?: string): Promise<{ message: string }> {
    // Blacklist the access token
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '15m');
    const expiresInSeconds = this.parseExpirationToSeconds(expiresIn);
    
    await this.tokenBlacklistService.blacklistToken(accessToken, expiresInSeconds);

    if (refreshToken) {
      await this.tokenBlacklistService.revokeRefreshToken(refreshToken);
      await this.sessionRepository.revoke(refreshToken);
    }

    this.logger.log(`User ${userId} logged out`);

    return { message: 'Successfully logged out' };
  }

  async logoutAll(userId: string, currentAccessToken: string): Promise<{ message: string; sessionsRevoked: number }> {
    // Blacklist current access token
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '15m');
    const expiresInSeconds = this.parseExpirationToSeconds(expiresIn);
    await this.tokenBlacklistService.blacklistToken(currentAccessToken, expiresInSeconds);

    // Revoke all sessions for this user
    const revokedCount = await this.sessionRepository.revokeAllByUserId(userId);
    await this.tokenBlacklistService.revokeAllUserTokens(userId);

    this.logger.log(`User ${userId} logged out from all ${revokedCount} sessions`);

    return {
      message: 'Successfully logged out from all devices',
      sessionsRevoked: revokedCount,
    };
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isValid = await HashUtil.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Ensure new password is different
    const isSamePassword = await HashUtil.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash and update password
    const newPasswordHash = await HashUtil.hash(newPassword);
    await this.userService.updatePassword(userId, newPasswordHash);

    // Revoke all sessions (force re-login)
    await this.sessionRepository.revokeAllByUserId(userId);
    await this.tokenBlacklistService.revokeAllUserTokens(userId);

    this.logger.log(`Password changed for user ${userId}`);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email.toLowerCase());

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists with this email, a reset link has been sent.' };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store reset token (expires in 1 hour)
    await this.userService.setPasswordResetToken(user.id, resetTokenHash, new Date(Date.now() + 3600000));

    // In production, send email with reset link
    // await this.emailService.sendPasswordReset(user.email, resetToken);

    this.logger.log(`Password reset requested for ${email}`);

    return { message: 'If an account exists with this email, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await this.userService.findByPasswordResetToken(tokenHash);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password
    this.validatePasswordStrength(newPassword);

    // Hash and update password
    const newPasswordHash = await HashUtil.hash(newPassword);
    await this.userService.updatePassword(user.id, newPasswordHash);

    // Clear reset token
    await this.userService.clearPasswordResetToken(user.id);

    // Revoke all sessions
    await this.sessionRepository.revokeAllByUserId(user.id);
    await this.tokenBlacklistService.revokeAllUserTokens(user.id);

    // Clear any lockouts
    this.failedAttempts.delete(user.email);

    this.logger.log(`Password reset completed for user ${user.id}`);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await this.userService.findByEmailVerificationToken(tokenHash);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if already verified
    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }

    // Mark email as verified
    await this.userService.markEmailVerified(user.id);

    this.logger.log(`Email verified for user ${user.id}`);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email.toLowerCase());
    
    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists with this email, a verification link has been sent.' };
    }

    // Check if already verified
    if (user.emailVerifiedAt) {
      return { message: 'If an account exists with this email, a verification link has been sent.' };
    }

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Store verification token (expires in 24 hours)
    await this.userService.setEmailVerificationToken(
      user.id,
      verificationTokenHash,
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );

    // In production, send verification email with the token
    // await this.emailService.sendVerification(user.email, verificationToken);

    this.logger.log(`Verification email resent to ${email}`);

    return { message: 'If an account exists with this email, a verification link has been sent.' };
  }

  // ============================================================================
  // MFA MANAGEMENT
  // ============================================================================

  async setupMfa(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const setup = await this.mfaService.setupMFA(user.id, user.email);
    const backupCodes = setup.backupCodes.map((hash) => ({ hash, used: false }));

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecretEnc: setup.secret,
        backupCodesHash: backupCodes,
        mfaEnabled: false,
      },
    });

    return {
      secret: setup.secret,
      qrCodeUrl: setup.qrCodeDataURL,
      backupCodes: setup.backupCodesPlain,
    };
  }

  async enableMfa(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.userService.findById(userId);
    if (!user?.totpSecretEnc) {
      throw new BadRequestException('MFA setup is required before enabling');
    }

    await this.verifyMfaOrThrow(user, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { message: 'MFA enabled successfully' };
  }

  async disableMfa(userId: string, password: string, code: string): Promise<{ message: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await HashUtil.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.verifyMfaOrThrow(user, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        totpSecretEnc: null,
        backupCodesHash: { set: null } as any,
      },
    });

    return { message: 'MFA disabled successfully' };
  }

  async listSessions(userId: string) {
    return this.sessionRepository.findActiveByUserId(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    await this.sessionRepository.revokeById(sessionId, userId);
    await this.tokenBlacklistService.revokeRefreshTokenHash(session.refreshHash);

    return { message: 'Session revoked' };
  }

  async revokeAllSessions(userId: string): Promise<{ message: string; sessionsRevoked: number }> {
    const revokedCount = await this.sessionRepository.revokeAllByUserId(userId);
    await this.tokenBlacklistService.revokeAllUserTokens(userId);

    return { message: 'All sessions revoked', sessionsRevoked: revokedCount };
  }

  // ============================================================================
  // SECURITY HELPERS
  // ============================================================================

  private checkAccountLock(email: string): { isLocked: boolean; lockedUntil?: Date; remainingMinutes?: number } {
    const attempts = this.failedAttempts.get(email);
    
    if (!attempts) {
      return { isLocked: false };
    }

    if (attempts.lockedUntil) {
      if (new Date() < attempts.lockedUntil) {
        const remainingMs = attempts.lockedUntil.getTime() - Date.now();
        return {
          isLocked: true,
          lockedUntil: attempts.lockedUntil,
          remainingMinutes: Math.ceil(remainingMs / 60000),
        };
      } else {
        // Lockout expired, clear attempts
        this.failedAttempts.delete(email);
        return { isLocked: false };
      }
    }

    return { isLocked: false };
  }

  private recordFailedAttempt(email: string): void {
    const now = new Date();
    const attempts = this.failedAttempts.get(email);

    if (!attempts) {
      this.failedAttempts.set(email, { count: 1, lastAttempt: now });
      return;
    }

    // Reset count if outside attempt window
    if (now.getTime() - attempts.lastAttempt.getTime() > this.ATTEMPT_WINDOW_MS) {
      this.failedAttempts.set(email, { count: 1, lastAttempt: now });
      return;
    }

    // Increment count
    attempts.count++;
    attempts.lastAttempt = now;

    // Lock account if max attempts reached
    if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
      attempts.lockedUntil = new Date(now.getTime() + this.LOCKOUT_DURATION_MS);
      this.logger.warn(`Account ${email} locked due to ${attempts.count} failed attempts`);
    }

    this.failedAttempts.set(email, attempts);
  }

  private async dummyPasswordCheck(): Promise<void> {
    await bcrypt.compare('dummy', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/VTtYA/VT');
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecial) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
      errors.push('Password is too common');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Password does not meet security requirements',
        errors,
      });
    }
  }

  private async generateTokens(userId: string, email: string): Promise<ITokenPair> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresInSeconds = this.parseExpirationToSeconds(expiresIn);
    
    await this.tokenBlacklistService.storeRefreshToken(userId, refreshToken, expiresInSeconds);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // 15 minutes default
    }
  }

  private async verifyMfaOrThrow(user: { id: string; mfaEnabled: boolean; totpSecretEnc?: string | null; backupCodesHash?: any }, code?: string) {
    if (!code) {
      throw new UnauthorizedException({
        code: 'MFA_TOKEN_REQUIRED',
        message: 'MFA token required',
      });
    }

    const normalizedCode = String(code).trim();
    let valid = false;

    if (user.totpSecretEnc) {
      valid = await this.mfaService.verifyTOTP(user.totpSecretEnc, normalizedCode);
    }

    if (!valid && user.backupCodesHash) {
      const backupCodes = user.backupCodesHash as { hash: string; used?: boolean }[] | string[];

      if (Array.isArray(backupCodes) && backupCodes.length > 0) {
        if (typeof backupCodes[0] === 'string') {
          for (let i = 0; i < backupCodes.length; i++) {
            const isValid = await this.mfaService.verifyBackupCode([backupCodes[i] as string], normalizedCode);
            if (isValid.valid) {
              backupCodes.splice(i, 1);
              await this.prisma.user.update({
                where: { id: user.id },
                data: { backupCodesHash: backupCodes },
              });
              valid = true;
              break;
            }
          }
        } else {
          const hashedCodes = backupCodes as { hash: string; used?: boolean }[];
          for (let i = 0; i < hashedCodes.length; i++) {
            const entry = hashedCodes[i];
            if (entry.used) continue;
            let isValid = await this.mfaService.verifyBackupCode([entry.hash], normalizedCode);
            if (!isValid.valid) {
              const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');
              isValid = { valid: entry.hash === codeHash };
            }
            if (isValid.valid) {
              entry.used = true;
              await this.prisma.user.update({
                where: { id: user.id },
                data: { backupCodesHash: hashedCodes },
              });
              valid = true;
              break;
            }
          }
        }
      }
    }

    if (!valid) {
      throw new UnauthorizedException({
        code: 'MFA_INVALID',
        message: 'Invalid MFA token',
      });
    }
  }
}

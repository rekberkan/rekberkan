import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma.service';
import * as crypto from 'crypto';

// ============================================================================
// BANK-GRADE MFA GUARD
// Implements: TOTP Verification, Admin Enforcement, Rate Limiting
// ============================================================================

export const MFA_REQUIRED_KEY = 'mfa_required';
export const MFA_ADMIN_ONLY_KEY = 'mfa_admin_only';

/**
 * Decorator to require MFA for specific endpoints
 */
export const RequireMFA = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(MFA_REQUIRED_KEY, true, descriptor?.value ?? target);
    return descriptor ?? target;
  };
};

/**
 * Decorator to require MFA only for admin users
 */
export const RequireMFAForAdmin = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(MFA_ADMIN_ONLY_KEY, true, descriptor?.value ?? target);
    return descriptor ?? target;
  };
};

interface MFAAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

@Injectable()
export class MfaGuard implements CanActivate {
  private readonly logger = new Logger(MfaGuard.name);
  private readonly mfaAttempts = new Map<string, MFAAttempt>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if MFA is required for this endpoint
    const requiresMFA = this.reflector.getAllAndOverride<boolean>(MFA_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const adminOnlyMFA = this.reflector.getAllAndOverride<boolean>(
      MFA_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if MFA is required based on decorators
    if (!requiresMFA && !adminOnlyMFA) {
      return true; // MFA not required for this endpoint
    }

    // If admin-only MFA, check if user is admin
    if (adminOnlyMFA && !user.isAdmin) {
      return true; // Non-admin users don't need MFA for this endpoint
    }

    // Get user from database to check MFA status
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        mfaEnabled: true,
        totpSecretEnc: true,
        backupCodesHash: true,
        isAdmin: true,
      },
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    // BANK-GRADE: Force MFA for admin users on sensitive operations
    if (requiresMFA && dbUser.isAdmin && !dbUser.mfaEnabled) {
      throw new BadRequestException({
        code: 'MFA_REQUIRED',
        message: 'MFA must be enabled for admin users to perform this action',
      });
    }

    // If user has MFA enabled, verify the token
    if (dbUser.mfaEnabled) {
      const mfaToken = request.headers['x-mfa-token'];

      if (!mfaToken) {
        throw new UnauthorizedException({
          code: 'MFA_TOKEN_REQUIRED',
          message: 'MFA token required for this operation',
        });
      }

      // Check rate limiting
      const lockStatus = this.checkMfaRateLimit(user.id);
      if (lockStatus.isLocked) {
        throw new UnauthorizedException({
          code: 'MFA_LOCKED',
          message: `Too many failed MFA attempts. Try again in ${lockStatus.remainingMinutes} minutes.`,
        });
      }

      // Verify the token
      const isValid = await this.verifyMfaToken(dbUser, mfaToken);

      if (!isValid) {
        this.recordFailedMfaAttempt(user.id);
        throw new UnauthorizedException({
          code: 'MFA_INVALID',
          message: 'Invalid MFA token',
        });
      }

      // Clear failed attempts on success
      this.mfaAttempts.delete(user.id);
    }

    return true;
  }

  /**
   * Verify MFA token (TOTP or backup code)
   */
  private async verifyMfaToken(
    user: { id: string; totpSecretEnc: string | null; backupCodesHash: any },
    token: string,
  ): Promise<boolean> {
    // Try TOTP verification first
    if (user.totpSecretEnc) {
      const isValidTotp = this.verifyTotp(user.totpSecretEnc, token);
      if (isValidTotp) {
        return true;
      }
    }

    // Try backup code
    if (user.backupCodesHash) {
      const isValidBackup = await this.verifyBackupCode(user.id, user.backupCodesHash, token);
      if (isValidBackup) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verify TOTP token
   */
  private verifyTotp(encryptedSecret: string, token: string): boolean {
    try {
      // Decrypt the secret
      const secret = this.decryptSecret(encryptedSecret);
      
      // Generate expected tokens for current and adjacent time windows
      const currentTime = Math.floor(Date.now() / 1000 / 30);
      
      for (let i = -1; i <= 1; i++) {
        const expectedToken = this.generateTotp(secret, currentTime + i);
        if (this.timingSafeEqual(expectedToken, token)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      this.logger.error(`TOTP verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate TOTP token
   */
  private generateTotp(secret: string, counter: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));
    
    // Decode base32 secret manually
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const secretUpper = secret.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (const char of secretUpper) {
      const val = base32Chars.indexOf(char);
      if (val >= 0) {
        bits += val.toString(2).padStart(5, '0');
      }
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    const secretBuffer = Buffer.from(bytes);
    
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(
    userId: string,
    backupCodesHash: any,
    code: string,
  ): Promise<boolean> {
    try {
      const codes = backupCodesHash as { hash: string; used: boolean }[];
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      
      const matchingCode = codes.find(c => c.hash === codeHash && !c.used);
      
      if (matchingCode) {
        // Mark code as used
        matchingCode.used = true;
        
        await this.prisma.user.update({
          where: { id: userId },
          data: { backupCodesHash: codes },
        });
        
        this.logger.log(`Backup code used for user ${userId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Backup code verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Decrypt TOTP secret
   */
  private decryptSecret(encryptedSecret: string): string {
    const encryptionKey = this.configService.get<string>('MFA_ENCRYPTION_KEY');
    
    if (!encryptionKey) {
      throw new Error('MFA encryption key not configured');
    }
    
    try {
      const [ivHex, encrypted] = encryptedSecret.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = crypto.scryptSync(encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Secret decryption error: ${error.message}`);
      throw new Error('Failed to decrypt MFA secret');
    }
  }

  /**
   * Timing-safe string comparison
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Check MFA rate limiting
   */
  private checkMfaRateLimit(userId: string): { isLocked: boolean; remainingMinutes?: number } {
    const attempts = this.mfaAttempts.get(userId);
    
    if (!attempts) {
      return { isLocked: false };
    }
    
    if (attempts.lockedUntil) {
      if (new Date() < attempts.lockedUntil) {
        const remainingMs = attempts.lockedUntil.getTime() - Date.now();
        return {
          isLocked: true,
          remainingMinutes: Math.ceil(remainingMs / 60000),
        };
      } else {
        // Lockout expired
        this.mfaAttempts.delete(userId);
        return { isLocked: false };
      }
    }
    
    return { isLocked: false };
  }

  /**
   * Record failed MFA attempt
   */
  private recordFailedMfaAttempt(userId: string): void {
    const now = new Date();
    const attempts = this.mfaAttempts.get(userId);
    
    if (!attempts) {
      this.mfaAttempts.set(userId, { count: 1, lastAttempt: now });
      return;
    }
    
    // Reset if outside window
    if (now.getTime() - attempts.lastAttempt.getTime() > this.ATTEMPT_WINDOW_MS) {
      this.mfaAttempts.set(userId, { count: 1, lastAttempt: now });
      return;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    
    if (attempts.count >= this.MAX_ATTEMPTS) {
      attempts.lockedUntil = new Date(now.getTime() + this.LOCKOUT_DURATION_MS);
      this.logger.warn(`MFA locked for user ${userId} due to ${attempts.count} failed attempts`);
    }
    
    this.mfaAttempts.set(userId, attempts);
  }
}

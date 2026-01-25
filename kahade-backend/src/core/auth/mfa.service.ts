import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { CryptoUtil, HashUtil } from '@common/utils/crypto.util';

export interface IMFASetup {
  secret: string;           // Encrypted secret to store in DB
  qrCodeDataURL: string;    // QR code for user to scan
  backupCodes: string[];    // Hashed backup codes
  backupCodesPlain: string[]; // Plain backup codes (show once)
}

@Injectable()
export class MFAService {
  private readonly logger = new Logger(MFAService.name);
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('MFA_ENCRYPTION_KEY', 'default-key-change-in-production');
  }

  /**
   * Generate MFA secret and QR code for user setup
   */
  async setupMFA(userId: string, userEmail: string): Promise<IMFASetup> {
    const appName = this.configService.get<string>('app.name', 'Kahade');

    // Generate TOTP secret (base32 encoded)
    const secret = CryptoUtil.generateTotpSecret();

    // Generate otpauth URL
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(appName)}&algorithm=SHA1&digits=6&period=30`;

    // Generate QR code data URL
    const qrCodeDataURL = await this.generateQRCodeDataURL(otpauthUrl);

    // Generate 10 backup codes
    const backupCodesPlain = Array.from({ length: 10 }, () =>
      this.generateBackupCode(),
    );

    // Hash backup codes for storage
    const backupCodesHashed = await Promise.all(
      backupCodesPlain.map((code) => HashUtil.hash(code)),
    );

    // Encrypt secret for storage
    const encryptedSecret = CryptoUtil.encrypt(secret, this.encryptionKey);

    return {
      secret: encryptedSecret,
      qrCodeDataURL,
      backupCodes: backupCodesHashed,
      backupCodesPlain,
    };
  }

  /**
   * Verify TOTP token
   */
  async verifyTOTP(
    encryptedSecret: string,
    token: string,
    window = 1,
  ): Promise<boolean> {
    try {
      // Decrypt secret
      const secret = CryptoUtil.decrypt(encryptedSecret, this.encryptionKey);

      // Verify token using TOTP algorithm
      const currentTime = Math.floor(Date.now() / 1000 / 30);
      
      for (let i = -window; i <= window; i++) {
        const expectedToken = this.generateTOTP(secret, currentTime + i);
        if (CryptoUtil.timingSafeEqual(expectedToken, token)) {
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
   * Generate TOTP token for a given time counter
   */
  private generateTOTP(secret: string, counter: number): string {
    // Decode base32 secret
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

    // Create counter buffer
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    // Generate HMAC-SHA1
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    // Dynamic truncation
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
  async verifyBackupCode(
    backupCodesHashed: string[],
    providedCode: string,
  ): Promise<{ valid: boolean; codeIndex?: number }> {
    for (let i = 0; i < backupCodesHashed.length; i++) {
      const isValid = await HashUtil.verify(providedCode, backupCodesHashed[i]);
      if (isValid) {
        return { valid: true, codeIndex: i };
      }
    }

    return { valid: false };
  }

  /**
   * Generate secure backup code (8 chars: XXXX-XXXX)
   */
  private generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      const randomIndex = crypto.randomInt(chars.length);
      code += chars[randomIndex];
    }

    return code;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<{
    backupCodes: string[];
    backupCodesPlain: string[];
  }> {
    const backupCodesPlain = Array.from({ length: 10 }, () =>
      this.generateBackupCode(),
    );

    const backupCodesHashed = await Promise.all(
      backupCodesPlain.map((code) => HashUtil.hash(code)),
    );

    return {
      backupCodes: backupCodesHashed,
      backupCodesPlain,
    };
  }

  /**
   * Generate QR code data URL using qrcode library
   */
  private async generateQRCodeDataURL(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 2,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataURL;
    } catch (error) {
      this.logger.error(`QR code generation error: ${error.message}`);
      // Fallback: return otpauth URL as base64 encoded text
      const encoded = Buffer.from(data).toString('base64');
      return `data:text/plain;base64,${encoded}`;
    }
  }
}

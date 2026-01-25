import * as crypto from 'crypto';

// ============================================================================
// CRYPTO UTILITIES - Production Ready
// ============================================================================

export class CryptoUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly KEY_LENGTH = 32;
  private static readonly ITERATIONS = 100000;

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(plaintext: string, key: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const derivedKey = crypto.pbkdf2Sync(key, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha256');
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: salt:iv:authTag:encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(ciphertext: string, key: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid ciphertext format');
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const derivedKey = crypto.pbkdf2Sync(key, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha256');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate a random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure random string (URL-safe)
   */
  static generateSecureString(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Generate TOTP secret
   */
  static generateTotpSecret(): string {
    const bytes = crypto.randomBytes(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    
    for (let i = 0; i < bytes.length; i++) {
      const index = bytes[i] % 32;
      result += base32Chars[index];
    }
    
    return result;
  }

  /**
   * Hash data using SHA-256
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash data using SHA-512
   */
  static sha512(data: string): string {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * Create HMAC-SHA256
   */
  static hmacSha256(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Timing-safe string comparison
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

export class HashUtil {
  private static readonly BCRYPT_ROUNDS = 12;

  /**
   * Hash password using bcrypt-like algorithm (using pbkdf2 for compatibility)
   */
  static async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verify password against hash
   */
  static async verify(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) {
      return false;
    }
    
    const salt = Buffer.from(saltHex, 'hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    
    return crypto.timingSafeEqual(Buffer.from(hashHex, 'hex'), hash);
  }

  /**
   * Generate random salt
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

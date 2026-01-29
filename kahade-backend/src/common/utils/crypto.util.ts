import * as crypto from "crypto";

// ============================================================================
// CRYPTO UTILITIES - Production Ready
// Implements: AES-256-GCM Encryption, Secure Token Generation, TOTP Support
// ============================================================================

export class CryptoUtil {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly KEY_LENGTH = 32;
  private static readonly ITERATIONS = 100000;

  /**
   * Encrypt data using AES-256-GCM
   * @param plaintext - Data to encrypt
   * @param key - Encryption key
   * @returns Encrypted string in format: salt:iv:authTag:encrypted
   */
  static encrypt(plaintext: string, key: string): string {
    if (!plaintext || !key) {
      throw new Error("Plaintext and key are required");
    }

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      "sha256",
    );

    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Format: salt:iv:authTag:encrypted
    return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param ciphertext - Encrypted string in format: salt:iv:authTag:encrypted
   * @param key - Decryption key
   * @returns Decrypted plaintext
   */
  static decrypt(ciphertext: string, key: string): string {
    if (!ciphertext || !key) {
      throw new Error("Ciphertext and key are required");
    }

    const parts = ciphertext.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid ciphertext format");
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      "sha256",
    );

    const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Generate a random token (hex encoded)
   * @param length - Number of random bytes (default 32 = 64 hex chars)
   */
  static generateToken(length = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate a secure random string (URL-safe base64)
   * @param length - Number of random bytes
   */
  static generateSecureString(length = 32): string {
    return crypto.randomBytes(length).toString("base64url");
  }

  /**
   * Generate TOTP secret (base32 encoded)
   */
  static generateTotpSecret(): string {
    const bytes = crypto.randomBytes(20);
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let result = "";

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
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Hash data using SHA-512
   */
  static sha512(data: string): string {
    return crypto.createHash("sha512").update(data).digest("hex");
  }

  /**
   * Create HMAC-SHA256
   */
  static hmacSha256(data: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  /**
   * Timing-safe string comparison
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      // Use constant-time comparison even for length mismatch
      const dummy = crypto.randomBytes(32).toString("hex");
      crypto.timingSafeEqual(Buffer.from(dummy), Buffer.from(dummy));
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

// ============================================================================
// SECURE HASH UTILITY - For MFA Backup Codes and Non-Password Hashing
// Uses PBKDF2 with SHA-512 for backup codes (different from bcrypt for passwords)
// ============================================================================

export class SecureHashUtil {
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 64;
  private static readonly SALT_LENGTH = 16;

  /**
   * Hash a value using PBKDF2-SHA512
   * Used for MFA backup codes and other non-password sensitive data
   * @param value - Value to hash
   * @returns Hashed value in format: salt:hash
   */
  static async hash(value: string): Promise<string> {
    if (!value) {
      throw new Error("Value cannot be empty");
    }

    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(
      value,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      "sha512",
    );
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
  }

  /**
   * Verify a value against a hash using timing-safe comparison
   * @param value - Value to verify
   * @param storedHash - Stored hash in format: salt:hash
   * @returns True if value matches
   */
  static async verify(value: string, storedHash: string): Promise<boolean> {
    if (!value || !storedHash) {
      return false;
    }

    const parts = storedHash.split(":");
    if (parts.length !== 2) {
      return false;
    }

    const [saltHex, hashHex] = parts;

    try {
      const salt = Buffer.from(saltHex, "hex");
      const expectedHash = Buffer.from(hashHex, "hex");
      const actualHash = crypto.pbkdf2Sync(
        value,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        "sha512",
      );

      return crypto.timingSafeEqual(expectedHash, actualHash);
    } catch {
      return false;
    }
  }

  /**
   * Generate random salt
   * @param length - Salt length in bytes
   */
  static generateSalt(length = 16): string {
    return crypto.randomBytes(length).toString("hex");
  }
}

// Re-export SecureHashUtil as HashUtil for backward compatibility with MFA service
// Note: For password hashing, use the bcrypt-based HashUtil from hash.util.ts
export { SecureHashUtil as HashUtil };

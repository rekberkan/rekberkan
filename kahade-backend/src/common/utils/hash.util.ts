import * as bcrypt from 'bcrypt';

// ============================================================================
// BANK-GRADE PASSWORD HASHING UTILITY
// Uses bcrypt with OWASP-recommended salt rounds
// ============================================================================

export class HashUtil {
  // SECURITY FIX [M001]: Increased from 10 to 12 rounds per OWASP recommendations
  // 12 rounds provides ~300ms hashing time on modern hardware
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password to hash
   * @returns Hashed password string
   */
  static async hash(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }
    
    // Bcrypt has a max length of 72 bytes
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new Error('Password exceeds maximum length');
    }
    
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a password against a hash using timing-safe comparison
   * @param password - Plain text password to verify
   * @param hash - Stored bcrypt hash
   * @returns True if password matches
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }
    
    try {
      // bcrypt.compare is already timing-safe
      return await bcrypt.compare(password, hash);
    } catch {
      // Return false on any error to prevent timing attacks
      return false;
    }
  }

  /**
   * Check if a hash needs to be rehashed (e.g., if salt rounds changed)
   * @param hash - Existing bcrypt hash
   * @returns True if hash should be regenerated
   */
  static needsRehash(hash: string): boolean {
    try {
      const rounds = bcrypt.getRounds(hash);
      return rounds < this.SALT_ROUNDS;
    } catch {
      return true;
    }
  }
}

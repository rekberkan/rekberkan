import { Injectable, BadRequestException } from '@nestjs/common';
import { HashUtil } from '@common/utils/crypto.util';
import * as crypto from 'crypto';

export interface IPasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minStrengthScore: number; // 0-4 (strength score)
  rotationDays: number;      // Days until password must be changed
  preventReuse: number;      // Number of previous passwords to check
}

const DEFAULT_POLICY: IPasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minStrengthScore: 3,
  rotationDays: 90,
  preventReuse: 5,
};

@Injectable()
export class PasswordService {
  private readonly policy: IPasswordPolicy = DEFAULT_POLICY;

  /**
   * Validate password against policy
   */
  validatePassword(password: string, userInputs: string[] = []): {
    valid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];

    // Length check
    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters`);
    }

    // Uppercase check
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Numbers check
    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special characters check
    if (this.policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Simple strength calculation
    const score = this.calculatePasswordStrength(password, userInputs);

    if (score < this.policy.minStrengthScore) {
      errors.push('Password is too weak. Use a stronger password with more variety.');
    }

    return {
      valid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * Calculate password strength (0-4)
   */
  private calculatePasswordStrength(password: string, userInputs: string[] = []): number {
    let score = 0;

    // Length bonus
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Character variety
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (varietyCount >= 3) score++;
    if (varietyCount === 4) score++;

    // Check for common patterns (reduce score)
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111'];
    if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
      score = Math.max(0, score - 2);
    }

    // Check if password contains user inputs
    for (const input of userInputs) {
      if (input && password.toLowerCase().includes(input.toLowerCase())) {
        score = Math.max(0, score - 1);
      }
    }

    return Math.min(4, score);
  }

  /**
   * Check if password needs rotation
   */
  needsRotation(passwordUpdatedAt: Date | null): boolean {
    if (!passwordUpdatedAt) return true;

    const daysSinceUpdate =
      (Date.now() - passwordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceUpdate >= this.policy.rotationDays;
  }

  /**
   * Check if password was used recently
   */
  async checkPasswordReuse(
    newPassword: string,
    previousPasswordHashes: string[],
  ): Promise<boolean> {
    const recentHashes = previousPasswordHashes.slice(
      -this.policy.preventReuse,
    );

    for (const hash of recentHashes) {
      const isReused = await HashUtil.verify(newPassword, hash);
      if (isReused) {
        return true; // Password was recently used
      }
    }

    return false; // Password not recently used
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one of each required type
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += all[crypto.randomInt(all.length)];
    }

    // Shuffle password using Fisher-Yates
    const chars = password.split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }
}

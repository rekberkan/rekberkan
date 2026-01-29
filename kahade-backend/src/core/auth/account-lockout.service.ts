import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

// ============================================================================
// ACCOUNT LOCKOUT SERVICE
// ============================================================================
// Fix #33: Distributed account lockout using Redis for multi-instance support
// ============================================================================

export interface LockoutStatus {
  isLocked: boolean;
  lockedUntil?: Date;
  remainingMinutes?: number;
  failedAttempts?: number;
}

interface FailedAttemptRecord {
  count: number;
  lastAttempt: number; // timestamp
  lockedUntil?: number; // timestamp
}

@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);
  private readonly CACHE_PREFIX = "lockout:";

  private readonly maxFailedAttempts: number;
  private readonly lockoutDurationMs: number;
  private readonly attemptWindowMs: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.maxFailedAttempts = this.configService.get<number>(
      "security.bruteForce.maxAttempts",
      5,
    );
    this.lockoutDurationMs =
      this.configService.get<number>(
        "security.bruteForce.lockoutDuration",
        900,
      ) * 1000; // 15 min
    this.attemptWindowMs =
      this.configService.get<number>("security.bruteForce.attemptWindow", 300) *
      1000; // 5 min
  }

  /**
   * Check if an account is locked
   */
  async checkLockout(identifier: string): Promise<LockoutStatus> {
    const key = this.buildKey(identifier);
    const record = await this.cacheManager.get<FailedAttemptRecord>(key);

    if (!record) {
      return { isLocked: false };
    }

    if (record.lockedUntil) {
      const now = Date.now();
      if (now < record.lockedUntil) {
        const remainingMs = record.lockedUntil - now;
        return {
          isLocked: true,
          lockedUntil: new Date(record.lockedUntil),
          remainingMinutes: Math.ceil(remainingMs / 60000),
          failedAttempts: record.count,
        };
      } else {
        // Lockout expired, clear record
        await this.cacheManager.del(key);
        return { isLocked: false };
      }
    }

    return {
      isLocked: false,
      failedAttempts: record.count,
    };
  }

  /**
   * Record a failed login attempt
   * Returns true if account is now locked
   */
  async recordFailedAttempt(identifier: string): Promise<boolean> {
    const key = this.buildKey(identifier);
    const now = Date.now();

    let record = await this.cacheManager.get<FailedAttemptRecord>(key);

    if (!record) {
      // First failed attempt
      record = { count: 1, lastAttempt: now };
      await this.cacheManager.set(key, record, this.attemptWindowMs);
      return false;
    }

    // Check if we're outside the attempt window
    if (now - record.lastAttempt > this.attemptWindowMs) {
      // Reset count
      record = { count: 1, lastAttempt: now };
      await this.cacheManager.set(key, record, this.attemptWindowMs);
      return false;
    }

    // Increment count
    record.count++;
    record.lastAttempt = now;

    // Check if we should lock the account
    if (record.count >= this.maxFailedAttempts) {
      record.lockedUntil = now + this.lockoutDurationMs;

      // Store with lockout duration TTL
      await this.cacheManager.set(key, record, this.lockoutDurationMs);

      this.logger.warn(
        `Account ${this.maskIdentifier(identifier)} locked after ${record.count} failed attempts`,
      );
      return true;
    }

    // Store with attempt window TTL
    await this.cacheManager.set(key, record, this.attemptWindowMs);
    return false;
  }

  /**
   * Clear failed attempts after successful login
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    const key = this.buildKey(identifier);
    await this.cacheManager.del(key);
  }

  /**
   * Manually lock an account (admin action)
   */
  async lockAccount(identifier: string, durationMs?: number): Promise<void> {
    const key = this.buildKey(identifier);
    const duration = durationMs || this.lockoutDurationMs;
    const now = Date.now();

    const record: FailedAttemptRecord = {
      count: this.maxFailedAttempts,
      lastAttempt: now,
      lockedUntil: now + duration,
    };

    await this.cacheManager.set(key, record, duration);
    this.logger.log(
      `Account ${this.maskIdentifier(identifier)} manually locked for ${duration / 60000} minutes`,
    );
  }

  /**
   * Manually unlock an account (admin action)
   */
  async unlockAccount(identifier: string): Promise<void> {
    const key = this.buildKey(identifier);
    await this.cacheManager.del(key);
    this.logger.log(
      `Account ${this.maskIdentifier(identifier)} manually unlocked`,
    );
  }

  /**
   * Get remaining attempts before lockout
   */
  async getRemainingAttempts(identifier: string): Promise<number> {
    const key = this.buildKey(identifier);
    const record = await this.cacheManager.get<FailedAttemptRecord>(key);

    if (!record) {
      return this.maxFailedAttempts;
    }

    return Math.max(0, this.maxFailedAttempts - record.count);
  }

  /**
   * Build cache key for identifier
   */
  private buildKey(identifier: string): string {
    // Normalize identifier (lowercase for emails)
    const normalized = identifier.toLowerCase().trim();
    return `${this.CACHE_PREFIX}${normalized}`;
  }

  /**
   * Mask identifier for logging
   */
  private maskIdentifier(identifier: string): string {
    if (identifier.includes("@")) {
      // Email - mask middle part
      const [local, domain] = identifier.split("@");
      const maskedLocal =
        local.length > 2
          ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
          : local;
      return `${maskedLocal}@${domain}`;
    }
    // Other identifiers - mask all but first 2 chars
    return (
      identifier.substring(0, 2) +
      "*".repeat(Math.max(0, identifier.length - 2))
    );
  }
}

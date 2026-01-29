import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

/**
 * Redis-based Brute Force Protection Service
 *
 * SECURITY FIX [C-02]: Implements distributed brute force protection
 * - Uses Redis for centralized state management
 * - Works across multiple application instances
 * - Prevents distributed brute force attacks
 */

interface LockStatus {
  isLocked: boolean;
  lockedUntil?: Date;
  remainingMinutes?: number;
  attemptCount?: number;
}

@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);
  private redis: Redis | null = null;

  // Fallback in-memory storage (for development/single instance)
  private readonly failedAttempts = new Map<
    string,
    { count: number; lastAttempt: Date; lockedUntil?: Date }
  >();

  // Configuration
  private readonly MAX_FAILED_ATTEMPTS: number;
  private readonly LOCKOUT_DURATION_MS: number;
  private readonly ATTEMPT_WINDOW_MS: number;
  private readonly KEY_PREFIX = "brute_force:";

  constructor(private readonly configService: ConfigService) {
    this.MAX_FAILED_ATTEMPTS = this.configService.get<number>(
      "BRUTE_FORCE_MAX_ATTEMPTS",
      5,
    );
    this.LOCKOUT_DURATION_MS = this.configService.get<number>(
      "BRUTE_FORCE_LOCKOUT_MS",
      15 * 60 * 1000,
    );
    this.ATTEMPT_WINDOW_MS = this.configService.get<number>(
      "BRUTE_FORCE_WINDOW_MS",
      5 * 60 * 1000,
    );

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>("REDIS_URL");

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
        });

        this.redis.on("connect", () => {
          this.logger.log("Redis connected for brute force protection");
        });

        this.redis.on("error", (error) => {
          this.logger.error(`Redis error: ${error.message}`);
        });

        this.redis.connect().catch((error) => {
          this.logger.warn(
            `Redis connection failed, using in-memory fallback: ${error.message}`,
          );
          this.redis = null;
        });
      } catch (error) {
        this.logger.warn(
          `Redis initialization failed, using in-memory fallback: ${error.message}`,
        );
        this.redis = null;
      }
    } else {
      this.logger.warn(
        "REDIS_URL not configured, using in-memory brute force protection (not suitable for distributed deployments)",
      );
    }
  }

  /**
   * Check if an account is locked
   */
  async checkAccountLock(identifier: string): Promise<LockStatus> {
    const key = `${this.KEY_PREFIX}${identifier}`;

    if (this.redis) {
      try {
        const data = await this.redis.hgetall(key);

        if (!data || Object.keys(data).length === 0) {
          return { isLocked: false };
        }

        const lockedUntil = data.lockedUntil
          ? new Date(parseInt(data.lockedUntil, 10))
          : null;
        const count = parseInt(data.count || "0", 10);

        if (lockedUntil && new Date() < lockedUntil) {
          const remainingMs = lockedUntil.getTime() - Date.now();
          return {
            isLocked: true,
            lockedUntil,
            remainingMinutes: Math.ceil(remainingMs / 60000),
            attemptCount: count,
          };
        }

        // Lockout expired, clear the record
        if (lockedUntil && new Date() >= lockedUntil) {
          await this.redis.del(key);
          return { isLocked: false };
        }

        return { isLocked: false, attemptCount: count };
      } catch (error) {
        this.logger.error(`Redis error checking lock: ${error.message}`);
        // Fall back to memory
      }
    }

    // Memory fallback
    const attempts = this.failedAttempts.get(identifier);
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
          attemptCount: attempts.count,
        };
      } else {
        this.failedAttempts.delete(identifier);
        return { isLocked: false };
      }
    }

    return { isLocked: false, attemptCount: attempts.count };
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(
    identifier: string,
  ): Promise<{ locked: boolean; attemptCount: number }> {
    const key = `${this.KEY_PREFIX}${identifier}`;
    const now = Date.now();

    if (this.redis) {
      try {
        // Use Redis transaction for atomicity
        const pipeline = this.redis.pipeline();

        // Get current data
        const data = await this.redis.hgetall(key);
        let count = parseInt(data?.count || "0", 10);
        const lastAttempt = parseInt(data?.lastAttempt || "0", 10);

        // Reset count if outside attempt window
        if (lastAttempt && now - lastAttempt > this.ATTEMPT_WINDOW_MS) {
          count = 0;
        }

        count++;

        // Update the record
        pipeline.hset(key, "count", count.toString());
        pipeline.hset(key, "lastAttempt", now.toString());

        // Lock account if max attempts reached
        if (count >= this.MAX_FAILED_ATTEMPTS) {
          const lockedUntil = now + this.LOCKOUT_DURATION_MS;
          pipeline.hset(key, "lockedUntil", lockedUntil.toString());
          this.logger.warn(
            `Account ${identifier} locked due to ${count} failed attempts`,
          );
        }

        // Set expiry on the key (cleanup after lockout period + buffer)
        pipeline.expire(
          key,
          Math.ceil((this.LOCKOUT_DURATION_MS + this.ATTEMPT_WINDOW_MS) / 1000),
        );

        await pipeline.exec();

        return {
          locked: count >= this.MAX_FAILED_ATTEMPTS,
          attemptCount: count,
        };
      } catch (error) {
        this.logger.error(`Redis error recording attempt: ${error.message}`);
        // Fall back to memory
      }
    }

    // Memory fallback
    const attempts = this.failedAttempts.get(identifier);

    if (!attempts) {
      this.failedAttempts.set(identifier, {
        count: 1,
        lastAttempt: new Date(),
      });
      return { locked: false, attemptCount: 1 };
    }

    // Reset count if outside attempt window
    if (now - attempts.lastAttempt.getTime() > this.ATTEMPT_WINDOW_MS) {
      this.failedAttempts.set(identifier, {
        count: 1,
        lastAttempt: new Date(),
      });
      return { locked: false, attemptCount: 1 };
    }

    attempts.count++;
    attempts.lastAttempt = new Date();

    if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
      attempts.lockedUntil = new Date(now + this.LOCKOUT_DURATION_MS);
      this.logger.warn(
        `Account ${identifier} locked due to ${attempts.count} failed attempts`,
      );
    }

    this.failedAttempts.set(identifier, attempts);
    return {
      locked: attempts.count >= this.MAX_FAILED_ATTEMPTS,
      attemptCount: attempts.count,
    };
  }

  /**
   * Clear failed attempts (on successful login)
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    const key = `${this.KEY_PREFIX}${identifier}`;

    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (error) {
        this.logger.error(`Redis error clearing attempts: ${error.message}`);
      }
    }

    // Memory fallback
    this.failedAttempts.delete(identifier);
  }

  /**
   * Get remaining attempts before lockout
   */
  async getRemainingAttempts(identifier: string): Promise<number> {
    const status = await this.checkAccountLock(identifier);
    if (status.isLocked) {
      return 0;
    }
    return Math.max(0, this.MAX_FAILED_ATTEMPTS - (status.attemptCount || 0));
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto';

// ============================================================================
// BANK-GRADE TOKEN BLACKLIST SERVICE
// Implements: Token Revocation, Secure Storage, Memory Fallback
// ============================================================================

interface TokenMetadata {
  userId: string;
  expiresAt: number;
  revokedAt?: number;
  revokeReason?: string;
}

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private redis: Redis | null = null;
  
  // In-memory fallback storage
  private blacklistSet = new Map<string, { reason: string; expiresAt: number }>();
  private refreshTokens = new Map<string, TokenMetadata>();
  
  // Cleanup interval for memory storage
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly configService: ConfigService) {
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<number>('redis.port');
    
    if (redisHost && redisPort) {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: this.configService.get<string>('redis.password'),
        db: this.configService.get<number>('redis.db', 0),
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 retries. Using memory fallback.');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}. Falling back to memory storage.`);
        this.redis = null;
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });
    } else {
      this.logger.warn('Redis not configured. Using in-memory token storage.');
    }

    // Start cleanup interval for memory storage
    this.startCleanupInterval();
  }

  // ============================================================================
  // TOKEN BLACKLISTING
  // ============================================================================

  /**
   * BANK-GRADE: Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    if (this.redis) {
      try {
        const result = await this.redis.get(`blacklist:${tokenHash}`);
        return result !== null;
      } catch (error) {
        this.logger.error(`Redis error checking blacklist: ${error.message}`);
        // Fall back to memory
      }
    }

    const entry = this.blacklistSet.get(tokenHash);
    if (entry && entry.expiresAt > Date.now()) {
      return true;
    }
    
    // Clean up expired entry
    if (entry) {
      this.blacklistSet.delete(tokenHash);
    }
    
    return false;
  }

  /**
   * BANK-GRADE: Blacklist a token
   */
  async blacklistToken(token: string, expiresInSeconds: number, reason: string = 'logout'): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = Date.now() + (expiresInSeconds * 1000);

    if (this.redis) {
      try {
        await this.redis.set(
          `blacklist:${tokenHash}`,
          JSON.stringify({ reason, blacklistedAt: Date.now() }),
          'EX',
          expiresInSeconds,
        );
        this.logger.debug(`Token blacklisted in Redis: ${tokenHash.substring(0, 8)}...`);
        return;
      } catch (error) {
        this.logger.error(`Redis error blacklisting token: ${error.message}`);
        // Fall back to memory
      }
    }

    this.blacklistSet.set(tokenHash, { reason, expiresAt });
    this.logger.debug(`Token blacklisted in memory: ${tokenHash.substring(0, 8)}...`);
  }

  // ============================================================================
  // REFRESH TOKEN MANAGEMENT
  // ============================================================================

  /**
   * BANK-GRADE: Store refresh token
   */
  async storeRefreshToken(userId: string, token: string, expiresInSeconds: number): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = Date.now() + (expiresInSeconds * 1000);

    if (this.redis) {
      try {
        const data = JSON.stringify({
          userId,
          expiresAt,
          createdAt: Date.now(),
        });
        await this.redis.set(`refresh:${tokenHash}`, data, 'EX', expiresInSeconds);
        
        // Also add to user's token set for bulk revocation
        await this.redis.sadd(`user_tokens:${userId}`, tokenHash);
        await this.redis.expire(`user_tokens:${userId}`, expiresInSeconds);
        
        return;
      } catch (error) {
        this.logger.error(`Redis error storing refresh token: ${error.message}`);
      }
    }

    this.refreshTokens.set(tokenHash, {
      userId,
      expiresAt,
    });
  }

  /**
   * BANK-GRADE: Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<string | null> {
    const tokenHash = this.hashToken(token);

    if (this.redis) {
      try {
        const data = await this.redis.get(`refresh:${tokenHash}`);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.expiresAt > Date.now() && !parsed.revokedAt) {
            return parsed.userId;
          }
        }
        return null;
      } catch (error) {
        this.logger.error(`Redis error validating refresh token: ${error.message}`);
      }
    }

    const entry = this.refreshTokens.get(tokenHash);
    if (entry && entry.expiresAt > Date.now() && !entry.revokedAt) {
      return entry.userId;
    }

    return null;
  }

  /**
   * BANK-GRADE: Revoke refresh token
   */
  async revokeRefreshToken(token: string, reason: string = 'revoked'): Promise<void> {
    const tokenHash = this.hashToken(token);

    if (this.redis) {
      try {
        // Get token data to find userId
        const data = await this.redis.get(`refresh:${tokenHash}`);
        if (data) {
          const parsed = JSON.parse(data);
          // Remove from user's token set
          await this.redis.srem(`user_tokens:${parsed.userId}`, tokenHash);
        }
        
        // Delete the token
        await this.redis.del(`refresh:${tokenHash}`);
        return;
      } catch (error) {
        this.logger.error(`Redis error revoking refresh token: ${error.message}`);
      }
    }

    const entry = this.refreshTokens.get(tokenHash);
    if (entry) {
      entry.revokedAt = Date.now();
      entry.revokeReason = reason;
    }
  }

  /**
   * BANK-GRADE: Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string, reason: string = 'logout_all'): Promise<number> {
    let revokedCount = 0;

    if (this.redis) {
      try {
        // Get all tokens for user
        const tokenHashes = await this.redis.smembers(`user_tokens:${userId}`);
        
        if (tokenHashes.length > 0) {
          // Delete all tokens
          const pipeline = this.redis.pipeline();
          for (const hash of tokenHashes) {
            pipeline.del(`refresh:${hash}`);
          }
          pipeline.del(`user_tokens:${userId}`);
          await pipeline.exec();
          
          revokedCount = tokenHashes.length;
        }
        
        return revokedCount;
      } catch (error) {
        this.logger.error(`Redis error revoking all user tokens: ${error.message}`);
      }
    }

    // Memory fallback
    for (const [hash, entry] of this.refreshTokens.entries()) {
      if (entry.userId === userId && !entry.revokedAt) {
        entry.revokedAt = Date.now();
        entry.revokeReason = reason;
        revokedCount++;
      }
    }

    return revokedCount;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Hash token for storage (don't store raw tokens)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Start cleanup interval for memory storage
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired entries from memory storage
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedBlacklist = 0;
    let cleanedRefresh = 0;

    // Clean blacklist
    for (const [hash, entry] of this.blacklistSet.entries()) {
      if (entry.expiresAt <= now) {
        this.blacklistSet.delete(hash);
        cleanedBlacklist++;
      }
    }

    // Clean refresh tokens
    for (const [hash, entry] of this.refreshTokens.entries()) {
      if (entry.expiresAt <= now) {
        this.refreshTokens.delete(hash);
        cleanedRefresh++;
      }
    }

    if (cleanedBlacklist > 0 || cleanedRefresh > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedBlacklist} blacklist entries and ${cleanedRefresh} refresh tokens`,
      );
    }
  }

  /**
   * Get statistics (for monitoring)
   */
  async getStats(): Promise<{
    blacklistSize: number;
    refreshTokenCount: number;
    usingRedis: boolean;
  }> {
    if (this.redis) {
      try {
        const blacklistKeys = await this.redis.keys('blacklist:*');
        const refreshKeys = await this.redis.keys('refresh:*');
        return {
          blacklistSize: blacklistKeys.length,
          refreshTokenCount: refreshKeys.length,
          usingRedis: true,
        };
      } catch {
        // Fall through to memory stats
      }
    }

    return {
      blacklistSize: this.blacklistSet.size,
      refreshTokenCount: this.refreshTokens.size,
      usingRedis: false,
    };
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}

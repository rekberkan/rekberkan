import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Redis } from 'ioredis';

// ============================================================================
// BANK-GRADE CACHE SERVICE
// Implements: Redis with Memory Fallback, TTL Management, Atomic Operations
// ============================================================================

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private memoryFallback = new Map<string, { value: any; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Access the underlying Redis client
    const store = (this.cacheManager as any).store;
    if (store && store.getClient) {
      this.redisClient = store.getClient();
    }
    
    // Start cleanup interval for memory fallback
    this.startCleanupInterval();
  }

  // ============================================================================
  // BASIC OPERATIONS
  // ============================================================================

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.warn(`Cache get error, using fallback: ${error.message}`);
      return this.getFromMemory<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.warn(`Cache set error, using fallback: ${error.message}`);
      this.setToMemory(key, value, ttl);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(`Cache del error: ${error.message}`);
    }
    this.memoryFallback.delete(key);
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      this.logger.warn(`Cache reset error: ${error.message}`);
    }
    this.memoryFallback.clear();
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    return await this.cacheManager.wrap(key, fn, ttl);
  }

  // ============================================================================
  // ATOMIC OPERATIONS (For Rate Limiting & Idempotency)
  // ============================================================================

  /**
   * BANK-GRADE: Increment counter with TTL
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (this.redisClient) {
      try {
        const value = await this.redisClient.incr(key);
        if (ttlSeconds && value === 1) {
          await this.redisClient.expire(key, ttlSeconds);
        }
        return value;
      } catch (error) {
        this.logger.warn(`Redis incr error: ${error.message}`);
      }
    }

    // Memory fallback
    const entry = this.memoryFallback.get(key);
    let newValue = 1;

    if (entry && entry.expiresAt > Date.now()) {
      newValue = (entry.value as number) + 1;
      entry.value = newValue;
    } else {
      this.memoryFallback.set(key, {
        value: newValue,
        expiresAt: Date.now() + (ttlSeconds ?? 60) * 1000,
      });
    }

    return newValue;
  }

  /**
   * BANK-GRADE: Set value only if not exists (for locks)
   */
  async setnx(key: string, value: any, ttlSeconds: number): Promise<boolean> {
    if (this.redisClient) {
      try {
        const result = await this.redisClient.set(
          key,
          JSON.stringify(value),
          'EX',
          ttlSeconds,
          'NX',
        );
        return result === 'OK';
      } catch (error) {
        this.logger.warn(`Redis setnx error: ${error.message}`);
      }
    }

    // Memory fallback
    const entry = this.memoryFallback.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return false;
    }

    this.memoryFallback.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return true;
  }

  /**
   * BANK-GRADE: Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.redisClient) {
      try {
        const result = await this.redisClient.exists(key);
        return result === 1;
      } catch (error) {
        this.logger.warn(`Redis exists error: ${error.message}`);
      }
    }

    const entry = this.memoryFallback.get(key);
    return entry !== undefined && entry.expiresAt > Date.now();
  }

  /**
   * BANK-GRADE: Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (this.redisClient) {
      try {
        return await this.redisClient.ttl(key);
      } catch (error) {
        this.logger.warn(`Redis ttl error: ${error.message}`);
      }
    }

    const entry = this.memoryFallback.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return Math.ceil((entry.expiresAt - Date.now()) / 1000);
    }

    return -2; // Key doesn't exist
  }

  // ============================================================================
  // HASH OPERATIONS
  // ============================================================================

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.hset(key, field, JSON.stringify(value));
        return;
      } catch (error) {
        this.logger.warn(`Redis hset error: ${error.message}`);
      }
    }

    // Memory fallback
    let entry = this.memoryFallback.get(key);
    if (!entry) {
      entry = { value: {}, expiresAt: Infinity };
      this.memoryFallback.set(key, entry);
    }
    entry.value[field] = value;
  }

  /**
   * Get hash field
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    if (this.redisClient) {
      try {
        const value = await this.redisClient.hget(key, field);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        this.logger.warn(`Redis hget error: ${error.message}`);
      }
    }

    const entry = this.memoryFallback.get(key);
    return entry?.value?.[field] ?? null;
  }

  // ============================================================================
  // HEALTH & MONITORING
  // ============================================================================

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<string> {
    try {
      if (this.redisClient && this.redisClient.ping) {
        return await this.redisClient.ping();
      }
      // Fallback: try to get/set a test key
      await this.set('health-check', 'ok', 5);
      const result = await this.get('health-check');
      await this.del('health-check');
      return result === 'ok' ? 'PONG' : 'ERROR';
    } catch (error) {
      throw new Error(`Redis ping failed: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    const stats: any = {
      usingRedis: this.redisClient !== null,
      memoryFallbackSize: this.memoryFallback.size,
    };

    try {
      if (this.redisClient && this.redisClient.info) {
        const info = await this.redisClient.info('stats');
        stats.redisInfo = info;
      }
    } catch (error) {
      stats.redisError = error.message;
    }

    return stats;
  }

  // ============================================================================
  // MEMORY FALLBACK HELPERS
  // ============================================================================

  private getFromMemory<T>(key: string): T | undefined {
    const entry = this.memoryFallback.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value as T;
    }
    if (entry) {
      this.memoryFallback.delete(key);
    }
    return undefined;
  }

  private setToMemory(key: string, value: any, ttlSeconds?: number): void {
    this.memoryFallback.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds ?? 3600) * 1000,
    });
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.memoryFallback.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryFallback.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.debug(`Cleaned ${cleaned} expired memory cache entries`);
      }
    }, 60000); // Every minute
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

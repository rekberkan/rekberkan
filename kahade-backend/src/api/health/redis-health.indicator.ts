import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// ============================================================================
// REDIS HEALTH INDICATOR
// ============================================================================
// Checks Redis connectivity for health checks
// ============================================================================

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    
    try {
      // Try to set and get a test value
      const testKey = '__health_check__';
      const testValue = Date.now().toString();
      
      await this.cacheManager.set(testKey, testValue, 10000); // 10 seconds TTL
      const retrieved = await this.cacheManager.get(testKey);
      
      const responseTime = Date.now() - startTime;
      
      if (retrieved !== testValue) {
        throw new Error('Redis read/write mismatch');
      }
      
      // Clean up
      await this.cacheManager.del(testKey);
      
      return this.getStatus(key, true, {
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          message: error.message,
          responseTime: `${responseTime}ms`,
        }),
      );
    }
  }
}

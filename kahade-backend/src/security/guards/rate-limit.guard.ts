import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ============================================================================
// RATE LIMIT GUARD - Production Ready
// Implements: In-memory rate limiting with configurable limits per endpoint
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Decorator key for custom rate limits
export const RATE_LIMIT_KEY = 'rateLimit';

// Decorator for custom rate limits
export const RateLimit = (ttl: number, limit: number) =>
  SetMetadata(RATE_LIMIT_KEY, { ttl, limit });

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly storage = new Map<string, RateLimitRecord>();

  // Default limits
  private readonly defaultTtl = 60000; // 1 minute
  private readonly defaultLimit = 100; // 100 requests per minute

  constructor(private readonly reflector: Reflector) {
    // Cleanup expired records every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get custom rate limit from decorator or use default
    const customLimit = this.reflector.getAllAndOverride<{ ttl: number; limit: number }>(
      RATE_LIMIT_KEY,
      [handler, controller],
    );

    const ttl = customLimit?.ttl || this.defaultTtl;
    const limit = customLimit?.limit || this.defaultLimit;

    // Generate unique key based on user ID or IP
    const key = this.getKey(request, handler.name);
    const now = Date.now();

    const record = this.storage.get(key);

    // If no record or expired, create new one
    if (!record || record.resetAt < now) {
      this.storage.set(key, { count: 1, resetAt: now + ttl });
      this.setRateLimitHeaders(request, limit, limit - 1, now + ttl);
      return true;
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      this.logger.warn(`Rate limit exceeded for ${key}`);

      this.setRateLimitHeaders(request, limit, 0, record.resetAt);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.setRateLimitHeaders(request, limit, limit - record.count, record.resetAt);
    return true;
  }

  private getKey(request: any, handlerName: string): string {
    const userId = request.user?.id;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';

    if (userId) {
      return `user:${userId}:${handlerName}`;
    }
    return `ip:${ip}:${handlerName}`;
  }

  private setRateLimitHeaders(
    request: any,
    limit: number,
    remaining: number,
    resetAt: number,
  ): void {
    const response = request.res;
    if (response) {
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      response.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.storage.entries()) {
      if (record.resetAt < now) {
        this.storage.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit records`);
    }
  }
}

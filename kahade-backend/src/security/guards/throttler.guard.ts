import { Injectable, ExecutionContext, CanActivate, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// Simple in-memory rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(ThrottlerGuard.name);
  private readonly storage = new Map<string, RateLimitRecord>();
  private readonly ttl = 60000; // 1 minute
  private readonly limit = 100; // 100 requests per minute

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const now = Date.now();

    // Clean up expired records periodically
    if (Math.random() < 0.01) {
      this.cleanup(now);
    }

    const record = this.storage.get(key);

    if (!record || record.resetAt < now) {
      this.storage.set(key, { count: 1, resetAt: now + this.ttl });
      return true;
    }

    record.count++;

    if (record.count > this.limit) {
      this.logger.warn(`Rate limit exceeded for ${key}`);
      return false;
    }

    return true;
  }

  private getKey(request: any): string {
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }
    return `ip:${request.ip || request.connection?.remoteAddress || 'unknown'}`;
  }

  private cleanup(now: number): void {
    for (const [key, record] of this.storage.entries()) {
      if (record.resetAt < now) {
        this.storage.delete(key);
      }
    }
  }
}

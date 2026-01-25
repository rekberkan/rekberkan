import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IDEMPOTENCY_KEY } from '../decorators/idempotency.decorator';
import { CacheService } from '@infrastructure/cache/cache.service';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresIdempotency = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresIdempotency) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException(
        'X-Idempotency-Key header is required for this operation',
      );
    }

    // Check if request with this key was already processed
    const cacheKey = `idempotency:${idempotencyKey}`;
    const existingResult = await this.cacheService.get(cacheKey);

    if (existingResult) {
      // Request already processed, return cached result
      throw new ConflictException({
        message: 'Request already processed',
        result: existingResult,
        idempotencyKey,
      });
    }

    // Store idempotency key (will be filled with result after processing)
    request.idempotencyKey = idempotencyKey;

    return true;
  }
}
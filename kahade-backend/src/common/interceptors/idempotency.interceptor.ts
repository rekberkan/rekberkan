import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '@infrastructure/cache/cache.service';
import { IDEMPOTENCY_KEY } from '../decorators/idempotency.decorator';
import * as crypto from 'crypto';

// ============================================================================
// BANK-GRADE IDEMPOTENCY INTERCEPTOR
// Implements: Request Deduplication, Response Caching, Concurrent Request Handling
// ============================================================================

interface IdempotencyRecord {
  status: 'processing' | 'completed' | 'failed';
  response?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
  requestHash?: string;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly DEFAULT_TTL_SECONDS = 86400; // 24 hours
  private readonly PROCESSING_TIMEOUT_MS = 30000; // 30 seconds

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Check if idempotency is required for this endpoint
    const requiresIdempotency = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresIdempotency) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['x-idempotency-key'];

    // Validate idempotency key
    if (!idempotencyKey) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'X-Idempotency-Key header is required for this operation',
        hint: 'Provide a unique UUID or string to ensure request idempotency',
      });
    }

    // Validate key format (should be UUID or similar)
    if (!this.isValidIdempotencyKey(idempotencyKey)) {
      throw new BadRequestException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Invalid idempotency key format',
        hint: 'Use a valid UUID v4 or a unique string (8-64 characters)',
      });
    }

    // Generate request hash for payload comparison
    const requestHash = this.generateRequestHash(request);
    const cacheKey = this.getCacheKey(idempotencyKey, request.user?.id);

    // Check for existing record
    const existingRecord = await this.getIdempotencyRecord(cacheKey);

    if (existingRecord) {
      return this.handleExistingRecord(existingRecord, requestHash, idempotencyKey);
    }

    // Mark request as processing
    await this.setIdempotencyRecord(cacheKey, {
      status: 'processing',
      createdAt: Date.now(),
      requestHash,
    });

    // Store key in request for later use
    request.idempotencyKey = idempotencyKey;
    request.idempotencyCacheKey = cacheKey;

    // Execute request and cache result
    return next.handle().pipe(
      tap(async (response) => {
        // Cache successful response
        await this.setIdempotencyRecord(cacheKey, {
          status: 'completed',
          response,
          createdAt: (existingRecord as IdempotencyRecord | null)?.createdAt ?? Date.now(),
          completedAt: Date.now(),
          requestHash,
        });

        this.logger.debug(`Idempotency record created: ${idempotencyKey}`);
      }),
      catchError(async (error) => {
        // Cache error for idempotent errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          await this.setIdempotencyRecord(cacheKey, {
            status: 'failed',
            error: error.message,
            createdAt: (existingRecord as IdempotencyRecord | null)?.createdAt ?? Date.now(),
            completedAt: Date.now(),
            requestHash,
          });
        } else {
          // For server errors, clear the processing state
          await this.cacheService.del(cacheKey);
        }

        throw error;
      }),
    );
  }

  /**
   * Handle existing idempotency record
   */
  private handleExistingRecord(
    record: IdempotencyRecord,
    currentRequestHash: string,
    idempotencyKey: string,
  ): Observable<any> {
    // Check if request payload matches
    if (record.requestHash && record.requestHash !== currentRequestHash) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'Idempotency key already used with different request payload',
        hint: 'Use a new idempotency key for different requests',
      });
    }

    switch (record.status) {
      case 'completed':
        this.logger.debug(`Returning cached response for: ${idempotencyKey}`);
        return of(record.response);

      case 'failed':
        throw new BadRequestException({
          code: 'PREVIOUS_REQUEST_FAILED',
          message: 'Previous request with this idempotency key failed',
          error: record.error,
        });

      case 'processing':
        // Check if processing has timed out
        const processingTime = Date.now() - record.createdAt;
        if (processingTime > this.PROCESSING_TIMEOUT_MS) {
          // Allow retry after timeout
          this.logger.warn(
            `Processing timeout for idempotency key: ${idempotencyKey}`,
          );
          throw new BadRequestException({
            code: 'REQUEST_TIMEOUT',
            message: 'Previous request timed out. Please retry.',
          });
        }

        // Request is still being processed
        throw new BadRequestException({
          code: 'REQUEST_IN_PROGRESS',
          message: 'A request with this idempotency key is currently being processed',
          hint: 'Wait for the current request to complete or use a different key',
        });

      default:
        throw new BadRequestException({
          code: 'UNKNOWN_IDEMPOTENCY_STATE',
          message: 'Unknown idempotency record state',
        });
    }
  }

  /**
   * Validate idempotency key format
   */
  private isValidIdempotencyKey(key: string): boolean {
    // Accept UUID v4 format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(key)) {
      return true;
    }

    // Accept alphanumeric strings 8-64 characters
    if (/^[a-zA-Z0-9_-]{8,64}$/.test(key)) {
      return true;
    }

    return false;
  }

  /**
   * Generate hash of request payload for comparison
   */
  private generateRequestHash(request: any): string {
    const payload = {
      method: request.method,
      path: request.path,
      body: request.body,
      userId: request.user?.id,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate cache key for idempotency record
   */
  private getCacheKey(idempotencyKey: string, userId?: string): string {
    // Include user ID to prevent cross-user idempotency key collisions
    const userPrefix = userId ? `user:${userId}:` : '';
    return `idempotency:${userPrefix}${idempotencyKey}`;
  }

  /**
   * Get idempotency record from cache
   */
  private async getIdempotencyRecord(
    cacheKey: string,
  ): Promise<IdempotencyRecord | null> {
    const record = await this.cacheService.get<IdempotencyRecord>(cacheKey);
    return record ?? null;
  }

  /**
   * Set idempotency record in cache
   */
  private async setIdempotencyRecord(
    cacheKey: string,
    record: IdempotencyRecord,
  ): Promise<void> {
    await this.cacheService.set(cacheKey, record, this.DEFAULT_TTL_SECONDS);
  }
}

// ============================================================================
// IDEMPOTENCY RESPONSE INTERCEPTOR
// Stores response after successful completion
// ============================================================================

@Injectable()
export class IdempotencyResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyResponseInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = request.idempotencyCacheKey;

    if (!cacheKey) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Update record with response
        const existingRecord = await this.cacheService.get<IdempotencyRecord>(cacheKey);
        if (existingRecord && existingRecord.status === 'processing') {
          await this.cacheService.set(
            cacheKey,
            {
              ...existingRecord,
              status: 'completed',
              response,
              completedAt: Date.now(),
            },
            86400, // 24 hours
          );
        }
      }),
    );
  }
}

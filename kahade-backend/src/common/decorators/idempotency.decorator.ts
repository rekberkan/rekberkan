import { SetMetadata, applyDecorators, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ============================================================================
// BANK-GRADE IDEMPOTENCY DECORATOR
// Ensures financial operations are executed exactly once
// ============================================================================

export const IDEMPOTENCY_KEY = 'idempotency_required';
export const IDEMPOTENCY_TTL_KEY = 'idempotency_ttl';
export const FINANCIAL_OPERATION_KEY = 'financial_operation';
export const AUDIT_REQUIRED_KEY = 'audit_required';

/**
 * BANK-GRADE: Mark endpoint as idempotent
 * Requires X-Idempotency-Key header
 * 
 * Usage:
 * @Idempotent()
 * @Post('withdrawal')
 * async createWithdrawal(@Body() dto: CreateWithdrawalDto) { ... }
 */
export const Idempotent = () => SetMetadata(IDEMPOTENCY_KEY, true);

/**
 * BANK-GRADE: Decorator to require idempotency key for endpoint with custom TTL
 * 
 * Usage:
 * @RequireIdempotency(3600) // 1 hour TTL
 * @Post('withdrawal')
 * async createWithdrawal(@Body() dto: CreateWithdrawalDto) { ... }
 * 
 * Client must provide X-Idempotency-Key header with a unique UUID
 * 
 * @param ttlSeconds - How long to cache the response (default: 24 hours)
 */
export function RequireIdempotency(ttlSeconds: number = 86400) {
  return applyDecorators(
    SetMetadata(IDEMPOTENCY_KEY, true),
    SetMetadata(IDEMPOTENCY_TTL_KEY, ttlSeconds),
  );
}

/**
 * BANK-GRADE: Decorator for financial operations
 * Combines idempotency with additional metadata for audit
 * 
 * Usage:
 * @FinancialOperation('withdrawal')
 * @Post('withdrawal')
 * async createWithdrawal(@Body() dto: CreateWithdrawalDto) { ... }
 */
export function FinancialOperation(operationType: string) {
  return applyDecorators(
    SetMetadata(IDEMPOTENCY_KEY, true),
    SetMetadata(IDEMPOTENCY_TTL_KEY, 86400), // 24 hours
    SetMetadata(FINANCIAL_OPERATION_KEY, operationType),
    SetMetadata(AUDIT_REQUIRED_KEY, true),
  );
}

/**
 * Parameter decorator to extract idempotency key from request
 * 
 * Usage:
 * @Post('withdrawal')
 * async createWithdrawal(
 *   @IdempotencyKey() idempotencyKey: string,
 *   @Body() dto: CreateWithdrawalDto
 * ) { ... }
 */
export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-idempotency-key'] || request.idempotencyKey;
  },
);

/**
 * Check if idempotency is required for a handler
 */
export function isIdempotencyRequired(reflector: any, handler: any, classRef: any): boolean {
  return reflector.getAllAndOverride(IDEMPOTENCY_KEY, [handler, classRef]) ?? false;
}

/**
 * Get idempotency TTL for a handler
 */
export function getIdempotencyTTL(reflector: any, handler: any, classRef: any): number {
  return reflector.getAllAndOverride(IDEMPOTENCY_TTL_KEY, [handler, classRef]) ?? 86400;
}

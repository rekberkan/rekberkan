import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// ============================================================================
// BANK-GRADE EXCEPTION FILTER
// Implements: Error Sanitization, Audit Logging, PII Protection
// ============================================================================

interface SanitizedErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  code?: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction: boolean;

  // Patterns to detect and mask sensitive data
  private readonly sensitivePatterns = [
    // Email addresses
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
    // Phone numbers (various formats)
    { pattern: /\b(?:\+62|62|0)[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g, replacement: '[PHONE]' },
    // Credit card numbers (16 digits)
    { pattern: /\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}\b/g, replacement: '[CARD]' },
    // Bank account numbers (10-16 digits)
    { pattern: /\b\d{10,16}\b/g, replacement: '[ACCOUNT]' },
    // NIK (16 digits Indonesian ID)
    { pattern: /\b\d{16}\b/g, replacement: '[NIK]' },
    // JWT tokens
    { pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, replacement: '[TOKEN]' },
    // API keys (common patterns)
    { pattern: /\b(sk_|pk_|api_|key_)[A-Za-z0-9]{20,}\b/g, replacement: '[API_KEY]' },
    // Passwords in URLs
    { pattern: /password=[^&\s]*/gi, replacement: 'password=[REDACTED]' },
    // Secret in URLs
    { pattern: /secret=[^&\s]*/gi, replacement: 'secret=[REDACTED]' },
    // Private keys
    { pattern: /-----BEGIN[^-]+PRIVATE KEY-----[\s\S]*?-----END[^-]+PRIVATE KEY-----/g, replacement: '[PRIVATE_KEY]' },
  ];

  // Error messages that should never be exposed
  private readonly internalErrorPatterns = [
    /database/i,
    /prisma/i,
    /sql/i,
    /connection/i,
    /timeout/i,
    /redis/i,
    /internal/i,
    /stack/i,
    /trace/i,
    /undefined/i,
    /null pointer/i,
    /memory/i,
    /heap/i,
  ];

  constructor(private readonly configService: ConfigService) {
    this.isProduction = configService.get('NODE_ENV') === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, code } = this.extractErrorInfo(exception);
    const requestId = (request as any).id || this.generateRequestId();

    // Log full error internally (with sanitization for logs)
    this.logError(exception, request, requestId);

    // Build sanitized response
    const errorResponse: SanitizedErrorResponse = {
      statusCode: status,
      message: this.sanitizeErrorMessage(message, status),
      error: this.getErrorName(status),
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // Add debug info in non-production
    if (!this.isProduction && exception instanceof Error) {
      (errorResponse as any).debug = {
        name: exception.name,
        originalMessage: this.sanitizeForLog(exception.message),
      };
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Extract error information from various exception types
   */
  private extractErrorInfo(exception: unknown): {
    status: number;
    message: string;
    code?: string;
  } {
    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();

      if (typeof response === 'object' && response !== null) {
        const responseObj = response as any;
        return {
          status,
          message: responseObj.message || exception.message,
          code: responseObj.code,
        };
      }

      return {
        status,
        message: typeof response === 'string' ? response : exception.message,
      };
    }

    // Handle Prisma errors
    if (exception instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception);
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        code: 'INTERNAL_ERROR',
      };
    }

    // Handle unknown errors
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Handle Prisma-specific errors
   */
  private handlePrismaError(error: PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with this value already exists',
          code: 'DUPLICATE_ENTRY',
        };

      case 'P2025':
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The requested resource was not found',
          code: 'NOT_FOUND',
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference to related resource',
          code: 'INVALID_REFERENCE',
        };

      case 'P2014':
        // Required relation violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Required related data is missing',
          code: 'MISSING_RELATION',
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred',
          code: 'DATABASE_ERROR',
        };
    }
  }

  /**
   * BANK-GRADE: Sanitize error message for client response
   */
  private sanitizeErrorMessage(message: string, status: number): string {
    // For 5xx errors, always return generic message
    if (status >= 500) {
      return 'An unexpected error occurred. Please try again later.';
    }

    // Check for internal error patterns
    for (const pattern of this.internalErrorPatterns) {
      if (pattern.test(message)) {
        return 'An error occurred while processing your request.';
      }
    }

    // Remove sensitive data from message
    let sanitized = message;
    for (const { pattern, replacement } of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    // Truncate very long messages
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200) + '...';
    }

    return sanitized;
  }

  /**
   * Sanitize data for internal logging
   */
  private sanitizeForLog(data: string): string {
    let sanitized = data;
    for (const { pattern, replacement } of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized;
  }

  /**
   * Get human-readable error name from status code
   */
  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return errorNames[status] || 'Error';
  }

  /**
   * Log error with full details (sanitized)
   */
  private logError(
    exception: unknown,
    request: Request,
    requestId: string,
  ): void {
    const errorLog = {
      requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      userId: (request as any).user?.id,
      ip: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
    };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      // Log 4xx as warnings, 5xx as errors
      if (status >= 500) {
        this.logger.error({
          ...errorLog,
          status,
          message: this.sanitizeForLog(exception.message),
          stack: exception.stack,
        });
      } else if (status >= 400) {
        this.logger.warn({
          ...errorLog,
          status,
          message: this.sanitizeForLog(exception.message),
        });
      }
    } else if (exception instanceof Error) {
      this.logger.error({
        ...errorLog,
        name: exception.name,
        message: this.sanitizeForLog(exception.message),
        stack: exception.stack,
      });
    } else {
      this.logger.error({
        ...errorLog,
        exception: String(exception),
      });
    }
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

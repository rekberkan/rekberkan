import { Injectable, NestMiddleware, PayloadTooLargeException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

// ============================================================================
// BODY SIZE LIMIT MIDDLEWARE
// ============================================================================
// Fix #80: Prevents memory exhaustion from large request bodies
// ============================================================================

@Injectable()
export class BodySizeLimitMiddleware implements NestMiddleware {
  private readonly maxBodySize: number;

  constructor(private readonly configService: ConfigService) {
    // Default 10MB, configurable via environment
    this.maxBodySize = this.configService.get<number>('MAX_BODY_SIZE', 10 * 1024 * 1024);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > this.maxBodySize) {
      throw new PayloadTooLargeException(
        `Request body too large. Maximum allowed size is ${this.formatBytes(this.maxBodySize)}`,
      );
    }

    // Track actual body size during streaming
    let bodySize = 0;
    // Note: originalWrite preserved for potential future response size tracking
    const _originalWrite = req.socket.write.bind(req.socket);

    req.on('data', (chunk: Buffer) => {
      bodySize += chunk.length;
      if (bodySize > this.maxBodySize) {
        req.destroy();
        throw new PayloadTooLargeException(
          `Request body too large. Maximum allowed size is ${this.formatBytes(this.maxBodySize)}`,
        );
      }
    });

    next();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ============================================================================
// ROUTE-SPECIFIC BODY SIZE LIMITS
// ============================================================================
// Different endpoints may need different limits
// ============================================================================

export const BODY_SIZE_LIMITS = {
  // Standard API endpoints
  default: 1 * 1024 * 1024, // 1 MB

  // File upload endpoints
  upload: 50 * 1024 * 1024, // 50 MB

  // Webhook endpoints (payment providers may send large payloads)
  webhook: 5 * 1024 * 1024, // 5 MB

  // Admin endpoints
  admin: 10 * 1024 * 1024, // 10 MB
};

/**
 * Create body parser options for specific route
 */
export function createBodyParserOptions(routeType: keyof typeof BODY_SIZE_LIMITS) {
  return {
    limit: BODY_SIZE_LIMITS[routeType] || BODY_SIZE_LIMITS.default,
  };
}

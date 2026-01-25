import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * 
 * Implements Double Submit Cookie pattern for CSRF protection.
 * More modern and secure than deprecated csurf package.
 * 
 * How it works:
 * 1. Server generates CSRF token and sends it in both:
 *    - httpOnly cookie (secure, not accessible by JS)
 *    - Response header (accessible by frontend)
 * 2. Frontend includes token in request header
 * 3. Server validates that cookie token matches header token
 * 
 * This protects against CSRF because:
 * - Attacker cannot read the token from cookie (httpOnly)
 * - Attacker cannot set custom headers in cross-origin requests
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly CSRF_COOKIE_NAME = 'XSRF-TOKEN';
  private readonly CSRF_HEADER_NAME = 'x-xsrf-token';
  private readonly TOKEN_LENGTH = 32;
  
  // Methods that require CSRF protection (state-changing operations)
  private readonly PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Paths that don't need CSRF protection (e.g., webhooks with signature verification)
  private readonly EXCLUDED_PATHS = [
    '/webhooks/midtrans',
    '/webhooks/xendit',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/health',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for excluded paths
    if (this.isExcludedPath(req.path)) {
      return next();
    }

    // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if (!this.PROTECTED_METHODS.includes(req.method)) {
      // For safe methods, generate and set token if not exists
      this.ensureCsrfToken(req, res);
      return next();
    }

    // For state-changing methods, validate CSRF token
    const cookieToken = req.cookies[this.CSRF_COOKIE_NAME];
    const headerToken = req.headers[this.CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is missing',
      });
    }

    // Use constant-time comparison to prevent timing attacks
    if (!this.constantTimeCompare(cookieToken, headerToken)) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_INVALID',
        message: 'CSRF token validation failed',
      });
    }

    next();
  }

  /**
   * Ensure CSRF token exists in cookie
   */
  private ensureCsrfToken(req: Request, res: Response): void {
    if (!req.cookies[this.CSRF_COOKIE_NAME]) {
      const token = this.generateToken();
      
      // Set token in cookie (httpOnly for security)
      res.cookie(this.CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Also send token in header for frontend to read
      res.setHeader('X-CSRF-Token', token);
    }
  }

  /**
   * Check if path is excluded from CSRF protection
   */
  private isExcludedPath(path: string): boolean {
    return this.EXCLUDED_PATHS.some(excluded => path.startsWith(excluded));
  }

  /**
   * Generate cryptographically secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(a, 'utf8'),
        Buffer.from(b, 'utf8'),
      );
    } catch {
      return false;
    }
  }
}

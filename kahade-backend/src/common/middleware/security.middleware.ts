import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

// ============================================================================
// SECURITY MIDDLEWARE
// Implements: Request Logging, Security Headers, IP Tracking
// ============================================================================

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Get client IP
    const clientIp = this.getClientIp(req);

    // Log request (for audit trail)
    this.logger.log(
      `${req.method} ${req.originalUrl} - IP: ${clientIp} - UA: ${req.get("user-agent")?.substring(0, 50)}`,
    );

    // Set security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    );

    // Remove server header
    res.removeHeader("X-Powered-By");

    // Attach client IP to request for logging
    (req as any).clientIp = clientIp;

    next();
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      const ips =
        typeof forwarded === "string" ? forwarded.split(",") : forwarded;
      // Safe array access with fallback
      const firstIp = ips.length > 0 ? ips[0].trim() : null;
      if (firstIp) {
        return firstIp;
      }
    }
    return req.socket.remoteAddress || "unknown";
  }
}

// ============================================================================
// SENSITIVE DATA SANITIZER
// ============================================================================

export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = [
    "password",
    "currentPassword",
    "newPassword",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "cardNumber",
    "cvv",
    "pin",
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
}

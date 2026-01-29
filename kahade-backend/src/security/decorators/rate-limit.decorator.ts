import { SetMetadata } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

// ============================================================================
// RATE LIMIT DECORATORS
// ============================================================================
// Fix #31: Custom rate limiting per endpoint type
// ============================================================================

export const RATE_LIMIT_KEY = "rate_limit";

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  ttl: number; // Time window in seconds
  limit: number; // Maximum requests in window
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Authentication endpoints - strict limits
  AUTH: { ttl: 60, limit: 5 },

  // Registration - very strict
  REGISTER: { ttl: 3600, limit: 3 },

  // Password reset - strict
  PASSWORD_RESET: { ttl: 3600, limit: 3 },

  // Standard API endpoints
  API: { ttl: 60, limit: 100 },

  // Read-heavy endpoints
  READ: { ttl: 60, limit: 200 },

  // Write endpoints
  WRITE: { ttl: 60, limit: 50 },

  // Webhook endpoints - high limit
  WEBHOOK: { ttl: 60, limit: 1000 },

  // Admin endpoints
  ADMIN: { ttl: 60, limit: 100 },

  // File upload
  UPLOAD: { ttl: 60, limit: 10 },

  // OTP/MFA verification
  OTP: { ttl: 60, limit: 5 },

  // Search endpoints
  SEARCH: { ttl: 60, limit: 30 },
} as const;

/**
 * Apply authentication rate limit (5 requests per minute)
 */
export const AuthRateLimit = () => Throttle({ default: RateLimits.AUTH });

/**
 * Apply registration rate limit (3 requests per hour)
 */
export const RegisterRateLimit = () =>
  Throttle({ default: RateLimits.REGISTER });

/**
 * Apply password reset rate limit (3 requests per hour)
 */
export const PasswordResetRateLimit = () =>
  Throttle({ default: RateLimits.PASSWORD_RESET });

/**
 * Apply standard API rate limit (100 requests per minute)
 */
export const ApiRateLimit = () => Throttle({ default: RateLimits.API });

/**
 * Apply read-heavy rate limit (200 requests per minute)
 */
export const ReadRateLimit = () => Throttle({ default: RateLimits.READ });

/**
 * Apply write rate limit (50 requests per minute)
 */
export const WriteRateLimit = () => Throttle({ default: RateLimits.WRITE });

/**
 * Apply webhook rate limit (1000 requests per minute)
 */
export const WebhookRateLimit = () => Throttle({ default: RateLimits.WEBHOOK });

/**
 * Apply admin rate limit (100 requests per minute)
 */
export const AdminRateLimit = () => Throttle({ default: RateLimits.ADMIN });

/**
 * Apply upload rate limit (10 requests per minute)
 */
export const UploadRateLimit = () => Throttle({ default: RateLimits.UPLOAD });

/**
 * Apply OTP rate limit (5 requests per minute)
 */
export const OtpRateLimit = () => Throttle({ default: RateLimits.OTP });

/**
 * Apply search rate limit (30 requests per minute)
 */
export const SearchRateLimit = () => Throttle({ default: RateLimits.SEARCH });

/**
 * Apply custom rate limit
 * @param ttl Time window in seconds
 * @param limit Maximum requests in window
 */
export const CustomRateLimit = (ttl: number, limit: number) =>
  Throttle({ default: { ttl, limit } });

/**
 * Skip rate limiting for this endpoint
 */
export const SkipRateLimit = () => SetMetadata("skipThrottle", true);

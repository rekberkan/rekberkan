import { ThrottlerModuleOptions } from '@nestjs/throttler';

// ============================================================================
// BANK-GRADE RATE LIMITING CONFIGURATION
// Implements: Tiered Limits, Financial Endpoint Protection, DDoS Prevention
// ============================================================================

/**
 * Global throttler configuration
 * Multiple tiers for different protection levels
 */
export const rateLimitConfig: ThrottlerModuleOptions = [
  {
    name: 'short',
    ttl: 1000, // 1 second
    limit: 3, // Max 3 requests per second
  },
  {
    name: 'medium',
    ttl: 10000, // 10 seconds
    limit: 20, // Max 20 requests per 10 seconds
  },
  {
    name: 'long',
    ttl: 60000, // 1 minute
    limit: 100, // Max 100 requests per minute
  },
];

/**
 * BANK-GRADE: Endpoint-specific rate limits
 * Use with @Throttle decorator on controllers/methods
 */
export const RATE_LIMITS = {
  // ============================================================================
  // AUTHENTICATION ENDPOINTS (Strict limits to prevent brute force)
  // ============================================================================
  AUTH: {
    LOGIN: { ttl: 300000, limit: 5 }, // 5 attempts per 5 minutes
    REGISTER: { ttl: 3600000, limit: 3 }, // 3 registrations per hour
    FORGOT_PASSWORD: { ttl: 3600000, limit: 3 }, // 3 requests per hour
    RESET_PASSWORD: { ttl: 3600000, limit: 3 }, // 3 attempts per hour
    VERIFY_EMAIL: { ttl: 300000, limit: 5 }, // 5 attempts per 5 minutes
    REFRESH_TOKEN: { ttl: 60000, limit: 10 }, // 10 refreshes per minute
    MFA_VERIFY: { ttl: 300000, limit: 5 }, // 5 MFA attempts per 5 minutes
  },

  // ============================================================================
  // FINANCIAL ENDPOINTS (Very strict limits)
  // ============================================================================
  FINANCIAL: {
    // Wallet operations
    WALLET_BALANCE: { ttl: 60000, limit: 30 }, // 30 per minute
    WALLET_HISTORY: { ttl: 60000, limit: 20 }, // 20 per minute
    
    // Withdrawal (CRITICAL)
    WITHDRAWAL_CREATE: { ttl: 3600000, limit: 5 }, // 5 per hour
    WITHDRAWAL_LIST: { ttl: 60000, limit: 20 }, // 20 per minute
    
    // Deposit
    DEPOSIT_CREATE: { ttl: 3600000, limit: 10 }, // 10 per hour
    DEPOSIT_LIST: { ttl: 60000, limit: 20 }, // 20 per minute
    
    // Payment
    PAYMENT_CREATE: { ttl: 60000, limit: 3 }, // 3 per minute
    PAYMENT_STATUS: { ttl: 60000, limit: 30 }, // 30 per minute
    
    // Escrow
    ESCROW_CREATE: { ttl: 300000, limit: 10 }, // 10 per 5 minutes
    ESCROW_RELEASE: { ttl: 300000, limit: 5 }, // 5 per 5 minutes
    ESCROW_REFUND: { ttl: 300000, limit: 5 }, // 5 per 5 minutes
  },

  // ============================================================================
  // ORDER ENDPOINTS
  // ============================================================================
  ORDER: {
    CREATE: { ttl: 300000, limit: 10 }, // 10 orders per 5 minutes
    UPDATE: { ttl: 60000, limit: 20 }, // 20 updates per minute
    LIST: { ttl: 60000, limit: 30 }, // 30 list requests per minute
    DETAIL: { ttl: 60000, limit: 60 }, // 60 detail requests per minute
    CANCEL: { ttl: 300000, limit: 5 }, // 5 cancellations per 5 minutes
  },

  // ============================================================================
  // ADMIN ENDPOINTS (Moderate limits with MFA)
  // ============================================================================
  ADMIN: {
    DASHBOARD: { ttl: 60000, limit: 30 }, // 30 per minute
    USER_LIST: { ttl: 60000, limit: 20 }, // 20 per minute
    USER_ACTION: { ttl: 300000, limit: 10 }, // 10 actions per 5 minutes
    WALLET_ADJUSTMENT: { ttl: 3600000, limit: 10 }, // 10 per hour
    WITHDRAWAL_APPROVE: { ttl: 300000, limit: 20 }, // 20 per 5 minutes
    AUDIT_LOG: { ttl: 60000, limit: 20 }, // 20 per minute
  },

  // ============================================================================
  // KYC ENDPOINTS
  // ============================================================================
  KYC: {
    SUBMIT: { ttl: 86400000, limit: 3 }, // 3 submissions per day
    STATUS: { ttl: 60000, limit: 20 }, // 20 status checks per minute
    UPLOAD: { ttl: 3600000, limit: 10 }, // 10 uploads per hour
  },

  // ============================================================================
  // DISPUTE ENDPOINTS
  // ============================================================================
  DISPUTE: {
    CREATE: { ttl: 86400000, limit: 5 }, // 5 disputes per day
    UPDATE: { ttl: 300000, limit: 10 }, // 10 updates per 5 minutes
    LIST: { ttl: 60000, limit: 30 }, // 30 list requests per minute
    EVIDENCE_UPLOAD: { ttl: 3600000, limit: 20 }, // 20 uploads per hour
  },

  // ============================================================================
  // NOTIFICATION ENDPOINTS
  // ============================================================================
  NOTIFICATION: {
    LIST: { ttl: 60000, limit: 30 }, // 30 per minute
    MARK_READ: { ttl: 60000, limit: 50 }, // 50 per minute
    SETTINGS: { ttl: 60000, limit: 10 }, // 10 per minute
  },

  // ============================================================================
  // WEBHOOK ENDPOINTS (Higher limits for payment providers)
  // ============================================================================
  WEBHOOK: {
    PAYMENT: { ttl: 60000, limit: 100 }, // 100 per minute
    DISBURSEMENT: { ttl: 60000, limit: 50 }, // 50 per minute
  },

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================
  PUBLIC: {
    HEALTH: { ttl: 60000, limit: 60 }, // 60 per minute
    BANKS: { ttl: 60000, limit: 30 }, // 30 per minute
    CONFIG: { ttl: 60000, limit: 30 }, // 30 per minute
  },
};

/**
 * Helper function to get rate limit config for decorators
 */
export function getRateLimit(
  category: keyof typeof RATE_LIMITS,
  endpoint: string,
): { ttl: number; limit: number } {
  const categoryLimits = RATE_LIMITS[category] as Record<string, { ttl: number; limit: number }>;
  return categoryLimits[endpoint] || { ttl: 60000, limit: 100 };
}

/**
 * IP-based rate limiting for additional protection
 */
export const IP_RATE_LIMITS = {
  // Global IP limit
  GLOBAL: { ttl: 60000, limit: 300 }, // 300 requests per minute per IP
  
  // Suspicious IP limit (after failed attempts)
  SUSPICIOUS: { ttl: 3600000, limit: 50 }, // 50 requests per hour
  
  // Blocked IP (after repeated violations)
  BLOCKED: { ttl: 86400000, limit: 0 }, // Blocked for 24 hours
};

/**
 * User-based rate limiting tiers
 */
export const USER_RATE_LIMIT_TIERS = {
  // Unverified users (no KYC)
  UNVERIFIED: {
    multiplier: 0.5, // 50% of normal limits
  },
  
  // Basic verified users
  BASIC: {
    multiplier: 1.0, // 100% of normal limits
  },
  
  // Premium verified users
  PREMIUM: {
    multiplier: 2.0, // 200% of normal limits
  },
  
  // Admin users
  ADMIN: {
    multiplier: 3.0, // 300% of normal limits
  },
};

/**
 * Burst protection configuration
 * Prevents sudden spikes in requests
 */
export const BURST_PROTECTION = {
  // Maximum requests in a very short window
  WINDOW_MS: 100, // 100ms window
  MAX_REQUESTS: 5, // Max 5 requests per 100ms
  
  // Penalty for burst violations
  PENALTY_DURATION_MS: 60000, // 1 minute cooldown
};

/**
 * Sliding window configuration for more accurate limiting
 */
export const SLIDING_WINDOW_CONFIG = {
  // Use sliding window instead of fixed window
  ENABLED: true,
  
  // Number of segments for sliding window
  SEGMENTS: 10,
  
  // Precision of rate limiting
  PRECISION_MS: 1000, // 1 second precision
};

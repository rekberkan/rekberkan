import { registerAs } from '@nestjs/config';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================
// Fix #99: Comprehensive security headers and settings
// ============================================================================

export default registerAs('security', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Helmet configuration for security headers
    helmet: {
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      
      // Cross-Origin-Embedder-Policy
      crossOriginEmbedderPolicy: false, // Disable for API
      
      // Cross-Origin-Opener-Policy
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      
      // Cross-Origin-Resource-Policy
      crossOriginResourcePolicy: { policy: 'same-origin' },
      
      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },
      
      // Frameguard (X-Frame-Options)
      frameguard: { action: 'deny' },
      
      // Hide Powered By
      hidePoweredBy: true,
      
      // HSTS
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      
      // IE No Open
      ieNoOpen: true,
      
      // No Sniff (X-Content-Type-Options)
      noSniff: true,
      
      // Origin Agent Cluster
      originAgentCluster: true,
      
      // Permitted Cross-Domain Policies
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      
      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      
      // XSS Filter
      xssFilter: true,
    },
    
    // CORS configuration
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || (isProduction ? [] : '*'),
      credentials: process.env.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-ID',
        'X-CSRF-Token',
      ],
      exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
      maxAge: 86400, // 24 hours
    },
    
    // Rate limiting
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
      limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
      
      // Endpoint-specific limits
      endpoints: {
        auth: {
          ttl: 60,
          limit: 5, // 5 login attempts per minute
        },
        register: {
          ttl: 3600,
          limit: 3, // 3 registrations per hour per IP
        },
        passwordReset: {
          ttl: 3600,
          limit: 3, // 3 password reset requests per hour
        },
        api: {
          ttl: 60,
          limit: 100, // 100 API requests per minute
        },
        webhook: {
          ttl: 60,
          limit: 1000, // 1000 webhook calls per minute
        },
      },
    },
    
    // CSRF protection
    csrf: {
      enabled: process.env.CSRF_ENABLED !== 'false',
      cookie: {
        key: '_csrf',
        secure: isProduction,
        httpOnly: true,
        sameSite: 'strict' as const,
      },
    },
    
    // Cookie settings
    cookie: {
      secret: process.env.COOKIE_SECRET,
      secure: isProduction,
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    
    // Trust proxy configuration
    trustProxy: parseInt(process.env.TRUST_PROXY_HOPS || '1', 10),
    
    // IP whitelist for admin endpoints
    adminIpWhitelist: process.env.ADMIN_IP_WHITELIST?.split(',') || [],
    
    // Brute force protection
    bruteForce: {
      maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900', 10), // 15 minutes
      attemptWindow: parseInt(process.env.ATTEMPT_WINDOW || '300', 10), // 5 minutes
    },
    
    // Password policy
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
    },
    
    // Session settings
    session: {
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5', 10),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800', 10), // 30 minutes
    },
  };
});

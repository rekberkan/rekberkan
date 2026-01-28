import { registerAs } from '@nestjs/config';

// Validate NODE_ENV to prevent typos
const VALID_ENVIRONMENTS = ['development', 'staging', 'production', 'test'];

const validateNodeEnv = (env: string): string => {
  if (!VALID_ENVIRONMENTS.includes(env)) {
    console.warn(
      `⚠️  WARNING: Invalid NODE_ENV "${env}". Valid values: ${VALID_ENVIRONMENTS.join(', ')}. Defaulting to "development".`,
    );
    return 'development';
  }
  return env;
};

export default registerAs('app', () => {
  const nodeEnv = validateNodeEnv(process.env.NODE_ENV || 'development');
  const isProduction = nodeEnv === 'production';

  // Validate required production configurations
  if (isProduction) {
    const requiredEnvVars = [
      'CORS_ORIGIN',
      'COOKIE_SECRET',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL',
    ];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(
        `CRITICAL: Missing required environment variables for production: ${missingVars.join(', ')}`,
      );
    }

    // Validate CORS is not wildcard in production
    if (process.env.CORS_ORIGIN === '*') {
      throw new Error('CRITICAL: CORS_ORIGIN cannot be "*" in production');
    }
  }

  return {
    nodeEnv,
    isProduction,
    port: parseInt(process.env.PORT, 10) || 3000, // Fixed: Standardized to 3000
    apiPrefix: process.env.API_PREFIX || 'api',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',

    // CORS configuration - supports multiple origins
    corsOrigin:
      process.env.CORS_ORIGIN ||
      'http://localhost:5000,http://localhost:5001,http://localhost:5002',
    corsCredentials: process.env.CORS_CREDENTIALS === 'true',

    // Rate limiting - Fixed: Increased default from 10 to 100
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
      limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
    },

    // Trust proxy configuration - Fixed: Made configurable
    trustProxy: parseInt(process.env.TRUST_PROXY_HOPS, 10) || 1,

    // Feature flags
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableGraphql: process.env.ENABLE_GRAPHQL === 'true',
    enableWebsocket: process.env.ENABLE_WEBSOCKET === 'true',
  };
});

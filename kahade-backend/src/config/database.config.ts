import { registerAs } from '@nestjs/config';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
// Fix #46: Proper connection pool configuration
// ============================================================================

export default registerAs('database', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  // SECURITY FIX: Enforce DATABASE_URL in production
  if (isProduction && !databaseUrl) {
    throw new Error('CRITICAL SECURITY ERROR: DATABASE_URL must be set in production');
  }

  // SECURITY FIX: Warn about default credentials
  if (
    databaseUrl &&
    (databaseUrl.includes('postgres:postgres') || databaseUrl.includes(':password@'))
  ) {
    console.warn(
      '⚠️  WARNING: Database appears to use default credentials. ' +
        'Use strong credentials in production!',
    );
  }

  return {
    url: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/kahade_dev?schema=public',

    // SECURITY FIX: Never auto-sync in production
    synchronize: nodeEnv === 'development',
    logging: nodeEnv === 'development',

    // Fix #46: Connection pool settings
    pool: {
      // Minimum number of connections to maintain
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),

      // Maximum number of connections
      // Production: Higher for better concurrency
      // Development: Lower to avoid resource exhaustion
      max: parseInt(process.env.DB_POOL_MAX || (isProduction ? '20' : '10'), 10),

      // Connection acquire timeout (ms)
      acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '30000', 10),

      // Idle connection timeout (ms)
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),

      // Connection creation timeout (ms)
      createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT || '30000', 10),

      // Destroy stale connections after this time (ms)
      destroyTimeoutMillis: parseInt(process.env.DB_POOL_DESTROY_TIMEOUT || '5000', 10),

      // Reap interval for idle connections (ms)
      reapIntervalMillis: parseInt(process.env.DB_POOL_REAP_INTERVAL || '1000', 10),

      // Create retry interval (ms)
      createRetryIntervalMillis: parseInt(process.env.DB_POOL_RETRY_INTERVAL || '200', 10),
    },

    // Query settings
    query: {
      // Statement timeout (ms) - prevent long-running queries
      statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),

      // Lock timeout (ms) - prevent deadlocks
      lockTimeout: parseInt(process.env.DB_LOCK_TIMEOUT || '10000', 10),

      // Idle in transaction timeout (ms)
      idleInTransactionTimeout: parseInt(process.env.DB_IDLE_IN_TRANSACTION_TIMEOUT || '60000', 10),
    },

    // SSL configuration
    ssl: {
      enabled: process.env.DB_SSL === 'true' || isProduction,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ca: process.env.DB_SSL_CA,
    },

    // Logging
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000', 10),
    logQueries: process.env.DB_LOG_QUERIES === 'true' && !isProduction,

    // Health check
    healthCheck: {
      enabled: true,
      interval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000', 10),
    },
  };
});

// ============================================================================
// PRISMA CONNECTION URL BUILDER
// ============================================================================
// Builds a connection URL with proper pool settings
// ============================================================================

export function buildDatabaseUrl(
  baseUrl: string,
  poolMax: number,
  poolTimeout: number,
  sslEnabled: boolean,
): string {
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const url = new URL(baseUrl);

  // Add connection pool parameters
  url.searchParams.set('connection_limit', poolMax.toString());
  url.searchParams.set('pool_timeout', Math.floor(poolTimeout / 1000).toString());

  // Add SSL if enabled
  if (sslEnabled) {
    url.searchParams.set('sslmode', 'require');
  }

  return url.toString();
}

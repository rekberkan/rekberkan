import { NestFactory } from '@nestjs/core';

// Fix BigInt serialization for JSON responses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
import {
  ValidationPipe,
  VersioningType,
  Logger,
  LogLevel,
  BadRequestException,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';

// ============================================================================
// BANK-GRADE APPLICATION BOOTSTRAP
// Implements: Security Headers, CORS, Rate Limiting, Request Validation
// ============================================================================

// Constants for magic numbers
const COMPRESSION_THRESHOLD_BYTES = 1024; // 1KB minimum for compression
const COMPRESSION_LEVEL = 6; // Balanced compression (0-9 scale)
const CORS_MAX_AGE_SECONDS = 86400; // 24 hours
const HSTS_MAX_AGE_SECONDS = 31536000; // 1 year

/**
 * Validate critical environment variables at startup
 * SECURITY FIX [H003]: Ensure encryption keys are configured in production
 */
function validateCriticalConfig(isProduction: boolean, logger: Logger): void {
  const criticalKeys = [
    { key: 'JWT_SECRET', description: 'JWT signing secret' },
    { key: 'JWT_REFRESH_SECRET', description: 'JWT refresh token secret' },
    { key: 'DATABASE_URL', description: 'Database connection string' },
  ];

  const encryptionKeys = [
    { key: 'MFA_ENCRYPTION_KEY', description: 'MFA secret encryption key' },
    { key: 'BANK_ENCRYPTION_KEY', description: 'Bank account encryption key' },
  ];

  const missingCritical: string[] = [];
  const missingEncryption: string[] = [];

  // Check critical keys (always required)
  for (const { key, description } of criticalKeys) {
    if (!process.env[key]) {
      missingCritical.push(`${key} (${description})`);
    }
  }

  // Check encryption keys (required in production, warned in development)
  for (const { key, description } of encryptionKeys) {
    if (!process.env[key]) {
      missingEncryption.push(`${key} (${description})`);
    }
  }

  if (missingCritical.length > 0) {
    const message = `CRITICAL: Missing required environment variables:\n${missingCritical.map(k => `  - ${k}`).join('\n')}`;
    logger.error(message);
    throw new Error(message);
  }

  if (missingEncryption.length > 0) {
    if (isProduction) {
      const message = `CRITICAL: Missing encryption keys in production:\n${missingEncryption.map(k => `  - ${k}`).join('\n')}`;
      logger.error(message);
      throw new Error(message);
    } else {
      logger.warn(
        `Missing encryption keys (using development defaults):\n${missingEncryption.map(k => `  - ${k}`).join('\n')}\n` +
        'DO NOT deploy to production without configuring these keys!'
      );
    }
  }

  // Validate key lengths
  const keyLengthChecks = [
    { key: 'JWT_SECRET', minLength: 32 },
    { key: 'JWT_REFRESH_SECRET', minLength: 32 },
    { key: 'MFA_ENCRYPTION_KEY', minLength: 32 },
    { key: 'BANK_ENCRYPTION_KEY', minLength: 32 },
  ];

  for (const { key, minLength } of keyLengthChecks) {
    const value = process.env[key];
    if (value && value.length < minLength) {
      const message = `${key} should be at least ${minLength} characters for adequate security`;
      if (isProduction) {
        throw new Error(`CRITICAL: ${message}`);
      }
      logger.warn(message);
    }
  }

  logger.log('Environment configuration validated successfully');
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // SECURITY FIX [H003]: Validate critical configuration at startup
  validateCriticalConfig(isProduction, logger);

  // BANK-GRADE: Conditional logging based on environment
  const logLevels: LogLevel[] = isProduction
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
    // Enable raw body for webhook signature verification
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const trustProxyHops = configService.get<number>('app.trustProxy', 1);

  // ============================================================================
  // REQUEST ID MIDDLEWARE - Fix #18
  // ============================================================================
  app.use((req: Request & { id?: string }, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'];
    req.id = (typeof requestId === 'string' ? requestId : undefined) || uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================

  // BANK-GRADE: Helmet for security headers
  app.use(
    helmet({
      // Content Security Policy - Fix #7: Removed unsafe-inline, use nonce instead
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'"], // Removed 'unsafe-inline' for security
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'], // Removed 'https:' - too permissive
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          // Fix #17: Proper upgradeInsecureRequests syntax
          ...(isProduction && { upgradeInsecureRequests: [] }),
        },
      },
      // Strict Transport Security
      hsts: {
        maxAge: HSTS_MAX_AGE_SECONDS,
        includeSubDomains: true,
        preload: true,
      },
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Hide X-Powered-By header
      hidePoweredBy: true,
      // Prevent MIME type sniffing
      noSniff: true,
      // XSS Protection
      xssFilter: true,
      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // BANK-GRADE: CORS configuration
  const corsOrigin = configService.get<string>('app.corsOrigin');
  const corsCredentials = configService.get<boolean>('app.corsCredentials', true);

  // Fix #4: Enforce strict CORS in all environments
  if (isProduction && (!corsOrigin || corsOrigin === '*')) {
    throw new Error(
      'CRITICAL SECURITY ERROR: CORS_ORIGIN must be set to specific domain(s) in production. ' +
        'Never use "*" with credentials enabled!',
    );
  }

  // Parse allowed origins from config
  const allowedOrigins = (
    corsOrigin || 'http://localhost:5000,http://localhost:5001,http://localhost:5002'
  )
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Fix #6: Better handling of requests without origin
      if (!origin) {
        if (isProduction) {
          logger.warn(
            `Blocked request with no origin in production from IP: ${process.env.REMOTE_ADDR || 'unknown'}`,
          );
          callback(new Error('Origin required in production'), false);
          return;
        }
        // Allow requests without origin in development (Postman, mobile apps, etc.)
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-HTTP-Method-Override',
      'Accept',
      'Observe',
      'X-Idempotency-Key',
      'X-MFA-Token',
      'X-Request-ID',
      'X-XSRF-Token',
    ],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-CSRF-Token'],
    maxAge: CORS_MAX_AGE_SECONDS,
  });

  // Fix #8 & #10: Cookie parser with security options
  const cookieSecret = configService.get<string>('COOKIE_SECRET');
  if (isProduction && !cookieSecret) {
    throw new Error('CRITICAL: COOKIE_SECRET must be set in production');
  }

  // Cookie parser initialization
  app.use(cookieParser(cookieSecret));

  // Compression with configurable threshold
  app.use(
    compression({
      threshold: COMPRESSION_THRESHOLD_BYTES,
      level: COMPRESSION_LEVEL,
    }),
  );

  // Fix #16: Trust proxy configuration - made configurable
  app.set('trust proxy', trustProxyHops);

  // ============================================================================
  // REQUEST VALIDATION
  // ============================================================================

  // Fix #15: Global validation pipe with sanitized error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Explicit type conversion only for security
      },
      // Fix #15: Return sanitized error messages instead of disabling completely
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        // Sanitize error messages for production
        const sanitizedErrors = errors.map((error) => ({
          field: error.property,
          message: isProduction
            ? 'Validation failed for this field'
            : Object.values(error.constraints || {}).join(', '),
        }));

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: sanitizedErrors,
        });
      },
      validationError: {
        target: false, // Don't include target object in error
        value: false, // Don't include value in error
      },
    }),
  );

  // ============================================================================
  // GLOBAL FILTERS
  // ============================================================================

  // BANK-GRADE: Global exception filter for sanitized error responses
  app.useGlobalFilters(new AllExceptionsFilter(configService));

  // ============================================================================
  // API CONFIGURATION
  // ============================================================================

  // Fix #13: Health check route with detailed status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (app.getHttpAdapter() as any).get('/health', async (_req: any, res: any) => {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
    };
    res.status(200).json(healthStatus);
  });

  // API Prefix (exclude webhooks for payment providers)
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'webhooks/xendit/(.*)', 'webhooks/midtrans/(.*)'],
  });

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ============================================================================
  // SWAGGER DOCUMENTATION (Non-production only)
  // ============================================================================

  const enableSwagger = configService.get<boolean>('app.enableSwagger', false);

  // Fix #14: Hard block Swagger in production
  if (isProduction && enableSwagger) {
    throw new Error(
      'CRITICAL SECURITY ERROR: Swagger MUST be disabled in production. ' +
        'Set ENABLE_SWAGGER=false in production environment.',
    );
  }

  if (enableSwagger && !isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Kahade API')
      .setDescription('Bank-Grade P2P Escrow Platform API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-MFA-Token',
          in: 'header',
          description: 'MFA TOTP token for sensitive operations',
        },
        'MFA-token',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Idempotency-Key',
          in: 'header',
          description: 'Idempotency key for financial operations',
        },
        'Idempotency-key',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('wallet', 'Wallet & balance endpoints')
      .addTag('withdrawal', 'Withdrawal endpoints')
      .addTag('orders', 'Order management endpoints')
      .addTag('escrow', 'Escrow management endpoints')
      .addTag('disputes', 'Dispute resolution endpoints')
      .addTag('admin', 'Admin management endpoints')
      .addTag('webhooks', 'Payment provider webhooks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
  }

  // ============================================================================
  // GRACEFUL SHUTDOWN - Fix #19
  // ============================================================================

  app.enableShutdownHooks();

  // Graceful shutdown handlers with timeout
  const SHUTDOWN_TIMEOUT_MS = 30000; // 30 seconds

  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Starting graceful shutdown...`);

    // Set a timeout for graceful shutdown
    const shutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      // Close the application
      await app.close();
      clearTimeout(shutdownTimer);
      logger.log('Application closed successfully');
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimer);
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions with cleanup
  process.on('uncaughtException', async (error) => {
    logger.error(`Uncaught Exception: ${error.message}`, error.stack);
    try {
      await app.close();
    } catch (closeError) {
      logger.error('Error closing app after uncaught exception:', closeError);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  });

  // ============================================================================
  // START SERVER
  // ============================================================================

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application running on port ${port}`);
  logger.log(`📍 Environment: ${nodeEnv}`);
  logger.log(`🔒 Security mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  if (!isProduction) {
    logger.log(`🌐 API: http://localhost:${port}/${apiPrefix}`);
  }
}

bootstrap().catch((error) => {
  const bootstrapLogger = new Logger('Bootstrap');
  bootstrapLogger.error(
    'Failed to start application:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});

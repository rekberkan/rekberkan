import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';

// ============================================================================
// BANK-GRADE APPLICATION BOOTSTRAP
// Implements: Security Headers, CORS, Rate Limiting, Request Validation
// ============================================================================

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  
  // BANK-GRADE: Conditional logging based on environment
  const logLevels: any[] = isProduction 
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

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================

  // BANK-GRADE: Helmet for security headers
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      // Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
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
  
  // Validate CORS in production
  if (isProduction && (!corsOrigin || corsOrigin === '*')) {
    throw new Error(
      'CRITICAL SECURITY ERROR: CORS_ORIGIN must be set to specific domain(s) in production. ' +
      'Never use "*" with credentials enabled!'
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = (corsOrigin || 'http://localhost:3001')
        .split(',')
        .map(o => o.trim());

      if (allowedOrigins.includes(origin) || !isProduction) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
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
    ],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  });

  // Cookie parser for session handling
  app.use(cookieParser(configService.get<string>('COOKIE_SECRET')));

  // Compression
  app.use(compression());

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // ============================================================================
  // REQUEST VALIDATION
  // ============================================================================

  // BANK-GRADE: Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Explicit type conversion only for security
      },
      disableErrorMessages: isProduction, // Hide validation details in production
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

  // Health check route outside global prefix
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Prefix (exclude webhooks for payment providers)
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      'health',
      'webhooks/xendit/(.*)',
      'webhooks/midtrans/(.*)',
    ],
  });

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ============================================================================
  // SWAGGER DOCUMENTATION (Non-production only)
  // ============================================================================

  const enableSwagger = configService.get<boolean>('app.enableSwagger', true);
  
  if (isProduction && enableSwagger) {
    logger.warn(
      '⚠️  WARNING: Swagger is enabled in production! ' +
      'Set ENABLE_SWAGGER=false in production for security.'
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
  // GRACEFUL SHUTDOWN
  // ============================================================================

  app.enableShutdownHooks();

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`, error.stack);
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
  console.error('Failed to start application:', error);
  process.exit(1);
});

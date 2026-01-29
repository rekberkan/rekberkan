import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  validateSync,
  IsBoolean,
  MinLength,
} from 'class-validator';

// ============================================================================
// ENVIRONMENT CONFIGURATION VALIDATION
// ============================================================================
// This module validates all environment variables at application startup
// to prevent runtime errors due to missing or invalid configuration.
// ============================================================================

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  // ============================================================================
  // ENVIRONMENT
  // ============================================================================
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;

  // ============================================================================
  // DATABASE
  // ============================================================================
  @IsString()
  @MinLength(10)
  DATABASE_URL: string;

  // ============================================================================
  // JWT
  // ============================================================================
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION?: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION?: string;

  // ============================================================================
  // REDIS
  // ============================================================================
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB?: number;

  // ============================================================================
  // CORS
  // ============================================================================
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @IsBoolean()
  @IsOptional()
  CORS_CREDENTIALS?: boolean;

  // ============================================================================
  // SECURITY
  // ============================================================================
  @IsString()
  @MinLength(16)
  @IsOptional()
  COOKIE_SECRET?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  RATE_LIMIT_TTL?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  RATE_LIMIT_LIMIT?: number;

  // ============================================================================
  // PAYMENT
  // ============================================================================
  @IsString()
  @IsOptional()
  PAYMENT_GATEWAY?: string;

  @IsString()
  @IsOptional()
  MIDTRANS_SERVER_KEY?: string;

  @IsString()
  @IsOptional()
  MIDTRANS_CLIENT_KEY?: string;

  @IsString()
  @IsOptional()
  XENDIT_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  XENDIT_CALLBACK_TOKEN?: string;

  // ============================================================================
  // EMAIL
  // ============================================================================
  @IsString()
  @IsOptional()
  MAIL_HOST?: string;

  @IsNumber()
  @IsOptional()
  MAIL_PORT?: number;

  @IsString()
  @IsOptional()
  MAIL_USER?: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD?: string;

  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================
  @IsBoolean()
  @IsOptional()
  ENABLE_SWAGGER?: boolean;

  @IsBoolean()
  @IsOptional()
  ENABLE_GRAPHQL?: boolean;

  @IsBoolean()
  @IsOptional()
  ENABLE_WEBSOCKET?: boolean;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = Object.values(error.constraints || {}).join(', ');
      return `${error.property}: ${constraints}`;
    });

    // In production, throw error for missing required configs
    if (config.NODE_ENV === 'production') {
      throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`);
    } else {
      // In development, just warn
      console.warn(`⚠️  Configuration validation warnings:\n${errorMessages.join('\n')}`);
    }
  }

  return validatedConfig;
}

// ============================================================================
// PRODUCTION VALIDATION
// ============================================================================
// Additional strict validation for production environment
// ============================================================================

export function validateProductionConfig(config: Record<string, unknown>): void {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  const requiredProductionVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'REDIS_HOST',
    'REDIS_PASSWORD',
    'CORS_ORIGIN',
    'COOKIE_SECRET',
  ];

  const missingVars = requiredProductionVars.filter((varName) => !config[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `CRITICAL: Missing required production environment variables: ${missingVars.join(', ')}`,
    );
  }

  // Validate CORS is not wildcard
  if (config.CORS_ORIGIN === '*') {
    throw new Error('CRITICAL: CORS_ORIGIN cannot be "*" in production');
  }

  // Validate JWT secrets are strong enough
  const jwtSecret = config.JWT_SECRET as string;
  const jwtRefreshSecret = config.JWT_REFRESH_SECRET as string;

  if (jwtSecret && jwtSecret.length < 64) {
    throw new Error('CRITICAL: JWT_SECRET must be at least 64 characters in production');
  }

  if (jwtRefreshSecret && jwtRefreshSecret.length < 64) {
    throw new Error('CRITICAL: JWT_REFRESH_SECRET must be at least 64 characters in production');
  }

  // Validate Swagger is disabled
  if (config.ENABLE_SWAGGER === true || config.ENABLE_SWAGGER === 'true') {
    throw new Error('CRITICAL: Swagger must be disabled in production (ENABLE_SWAGGER=false)');
  }

  // QUALITY FIX [M001]: Removed console.log - validation result is logged by main.ts
}

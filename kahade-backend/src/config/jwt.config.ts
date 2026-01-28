import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 *
 * SECURITY: No default secrets allowed. Application MUST fail if secrets are not properly configured.
 * This applies to ALL environments to prevent accidental deployment with weak secrets.
 */
export default registerAs('jwt', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  // CRITICAL: Enforce secrets in ALL environments
  // Even in development, we should not use hardcoded secrets to prevent bad habits
  const weakSecrets = [
    'your-super-secret-jwt-key-change-this',
    'dev-jwt-secret-change-this-immediately',
    'secret',
    'jwt-secret',
    'changeme',
  ];

  const weakRefreshSecrets = [
    'your-super-secret-refresh-key-change-this',
    'dev-refresh-secret-change-this-immediately',
    'secret',
    'refresh-secret',
    'changeme',
  ];

  if (!jwtSecret || weakSecrets.includes(jwtSecret.toLowerCase())) {
    throw new Error(
      `CRITICAL SECURITY ERROR: JWT_SECRET must be set to a strong random value. ` +
        `Current environment: ${nodeEnv}. ` +
        `Generate one using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );
  }

  if (!jwtRefreshSecret || weakRefreshSecrets.includes(jwtRefreshSecret.toLowerCase())) {
    throw new Error(
      `CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET must be set to a strong random value. ` +
        `Current environment: ${nodeEnv}. ` +
        `Generate one using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );
  }

  // Validate minimum secret length (at least 32 characters for security)
  const MIN_SECRET_LENGTH = 32;
  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `CRITICAL SECURITY ERROR: JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long. ` +
        `Current length: ${jwtSecret.length}`,
    );
  }

  if (jwtRefreshSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters long. ` +
        `Current length: ${jwtRefreshSecret.length}`,
    );
  }

  return {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: jwtRefreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  };
});

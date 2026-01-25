import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  // SECURITY FIX: Fail fast if secrets not set in production
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  // CRITICAL: Enforce secrets in production
  if (nodeEnv === 'production') {
    if (!jwtSecret || jwtSecret === 'your-super-secret-jwt-key-change-this') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET must be set to a strong random value in production. ' +
        'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }
    
    if (!jwtRefreshSecret || jwtRefreshSecret === 'your-super-secret-refresh-key-change-this') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET must be set to a strong random value in production. ' +
        'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }
  }

  // Development fallback with warning
  if (nodeEnv === 'development') {
    if (!jwtSecret) {
      console.warn('⚠️  WARNING: JWT_SECRET not set. Using development default. DO NOT USE IN PRODUCTION!');
    }
    if (!jwtRefreshSecret) {
      console.warn('⚠️  WARNING: JWT_REFRESH_SECRET not set. Using development default. DO NOT USE IN PRODUCTION!');
    }
  }

  return {
    secret: jwtSecret || 'dev-jwt-secret-change-this-immediately',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: jwtRefreshSecret || 'dev-refresh-secret-change-this-immediately',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  };
});

import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseUrl = process.env.DATABASE_URL;

  // SECURITY FIX: Enforce DATABASE_URL in production
  if (nodeEnv === 'production' && !databaseUrl) {
    throw new Error(
      'CRITICAL SECURITY ERROR: DATABASE_URL must be set in production'
    );
  }

  // SECURITY FIX: Warn about default credentials
  if (databaseUrl && (databaseUrl.includes('postgres:postgres') || databaseUrl.includes(':password@'))) {
    console.warn(
      '⚠️  WARNING: Database appears to use default credentials. ' +
      'Use strong credentials in production!'
    );
  }

  return {
    url: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/kahade_dev?schema=public',
    // SECURITY FIX: Never auto-sync in production
    synchronize: nodeEnv === 'development',
    logging: nodeEnv === 'development',
  };
});

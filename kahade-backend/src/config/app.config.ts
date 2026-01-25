import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    ttl: (parseInt(process.env.RATE_LIMIT_TTL, 10) || 60),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 10,
  },
}));

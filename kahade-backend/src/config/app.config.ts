import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  apiPrefix: process.env.API_PREFIX || 'api',
  appUrl: process.env.APP_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  
  // CORS configuration - supports multiple origins
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5000,http://localhost:5001,http://localhost:5002',
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  
  // Rate limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
  },
  
  // Feature flags
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  enableGraphql: process.env.ENABLE_GRAPHQL === 'true',
  enableWebsocket: process.env.ENABLE_WEBSOCKET === 'true',
}));

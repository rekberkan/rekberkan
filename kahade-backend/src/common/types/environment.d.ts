declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Application
      NODE_ENV: 'development' | 'production' | 'test' | 'staging';
      PORT: string;
      API_PREFIX: string;

      // Database
      DATABASE_URL: string;

      // JWT
      JWT_SECRET: string;
      JWT_EXPIRATION: string;
      JWT_REFRESH_SECRET: string;
      JWT_REFRESH_EXPIRATION: string;

      // Redis
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD?: string;
      REDIS_DB: string;

      // Blockchain
      BLOCKCHAIN_NETWORK: string;
      BLOCKCHAIN_RPC_URL: string;
      SMART_CONTRACT_ADDRESS: string;
      PRIVATE_KEY: string;

      // Payment
      PAYMENT_GATEWAY_API_KEY: string;
      PAYMENT_GATEWAY_SECRET: string;
      PAYMENT_CALLBACK_URL: string;
      PAYMENT_ENVIRONMENT: string;

      // Email
      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_USER: string;
      MAIL_PASSWORD: string;
      MAIL_FROM: string;

      // File Upload
      MAX_FILE_SIZE: string;
      UPLOAD_DEST: string;

      // Security
      RATE_LIMIT_TTL: string;
      RATE_LIMIT_LIMIT: string;
      CORS_ORIGIN: string;

      // Logging
      LOG_LEVEL: string;
    }
  }
}

export {};

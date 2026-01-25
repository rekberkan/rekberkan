import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('redis.host');
        const useRedis = redisHost && process.env.REDIS_ENABLED === 'true';
        
        if (useRedis) {
          const redisStore = await import('cache-manager-redis-store');
          Logger.log('Using Redis cache store', 'CacheModule');
          return {
            store: redisStore.default as any,
            host: redisHost,
            port: configService.get<number>('redis.port'),
            password: configService.get<string>('redis.password'),
            db: configService.get<number>('redis.db'),
            ttl: configService.get<number>('redis.ttl', 3600),
          };
        }
        
        Logger.log('Using in-memory cache store (Redis not available)', 'CacheModule');
        return {
          ttl: configService.get<number>('redis.ttl', 3600),
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}

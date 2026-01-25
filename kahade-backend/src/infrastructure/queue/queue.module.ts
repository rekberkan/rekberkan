import { Module, Global, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

const useRedis = process.env.REDIS_ENABLED === 'true';

@Global()
@Module({
  imports: useRedis ? [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        Logger.log('Using Redis for Bull queues', 'QueueModule');
        return {
          redis: {
            host: configService.get<string>('redis.host', 'localhost'),
            port: configService.get<number>('redis.port', 6379),
            password: configService.get<string>('redis.password'),
          },
          prefix: configService.get<string>('queue.prefix', 'kahade'),
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        };
      },
    }),
  ] : [],
  exports: useRedis ? [BullModule] : [],
})
export class QueueModule {
  constructor() {
    if (!useRedis) {
      Logger.warn('Bull queues disabled (Redis not available)', 'QueueModule');
    }
  }
}

import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailProcessor } from './email.processor';
import { NotificationProcessor } from './notification.processor';
import { AutoReleaseEscrowCron } from './cron/auto-release-escrow.cron';
import { EmailModule } from '@integrations/email/email.module';
import { NotificationModule } from '@core/notification/notification.module';
import { EscrowModule } from '@core/escrow/escrow.module';
import { QUEUE_NAMES } from '@common/constants';

const useRedis = process.env.REDIS_ENABLED === 'true';

@Module({
  imports: [
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    // Bull queues (only if Redis is enabled)
    ...(useRedis
      ? [BullModule.registerQueue({ name: QUEUE_NAMES.EMAIL }, { name: QUEUE_NAMES.NOTIFICATION })]
      : []),
    EmailModule,
    NotificationModule,
    EscrowModule,
  ],
  providers: [
    // Cron jobs (always enabled)
    AutoReleaseEscrowCron,
    // Queue processors (only if Redis is enabled)
    ...(useRedis ? [EmailProcessor, NotificationProcessor] : []),
  ],
  exports: [AutoReleaseEscrowCron, ...(useRedis ? [BullModule] : [])],
})
export class JobsModule {
  constructor() {
    Logger.log('Scheduler module initialized', 'JobsModule');
    if (!useRedis) {
      Logger.warn('Queue processors disabled (Redis not available)', 'JobsModule');
    }
  }
}

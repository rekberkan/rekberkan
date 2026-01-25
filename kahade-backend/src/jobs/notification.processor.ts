import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationService } from '@core/notification/notification.service';

@Processor('notification')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Process('create-notification')
  async handleCreateNotification(job: Job) {
    this.logger.debug(`Processing notification job: ${job.id}`);
    const { userId, type, title, message } = job.data;

    try {
      await this.notificationService.createForUser(userId, type, title, message);
      this.logger.log(`Notification created for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }
}

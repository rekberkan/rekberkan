import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BackupSchedulerCron {
  private readonly logger = new Logger(BackupSchedulerCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

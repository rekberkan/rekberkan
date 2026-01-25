import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SessionCleanupCron {
  private readonly logger = new Logger(SessionCleanupCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

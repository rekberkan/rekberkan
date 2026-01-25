import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DisputeDeadlineCheckCron {
  private readonly logger = new Logger(DisputeDeadlineCheckCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

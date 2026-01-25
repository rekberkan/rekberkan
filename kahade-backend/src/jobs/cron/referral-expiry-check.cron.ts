import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReferralExpiryCheckCron {
  private readonly logger = new Logger(ReferralExpiryCheckCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

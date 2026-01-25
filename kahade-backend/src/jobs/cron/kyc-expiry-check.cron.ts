import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KycExpiryCheckCron {
  private readonly logger = new Logger(KycExpiryCheckCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

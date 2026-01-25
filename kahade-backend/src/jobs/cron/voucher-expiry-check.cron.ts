import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VoucherExpiryCheckCron {
  private readonly logger = new Logger(VoucherExpiryCheckCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

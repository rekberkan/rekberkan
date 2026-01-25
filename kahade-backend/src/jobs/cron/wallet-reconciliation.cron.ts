import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WalletReconciliationCron {
  private readonly logger = new Logger(WalletReconciliationCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

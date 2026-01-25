import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LedgerIntegrityCheckCron {
  private readonly logger = new Logger(LedgerIntegrityCheckCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

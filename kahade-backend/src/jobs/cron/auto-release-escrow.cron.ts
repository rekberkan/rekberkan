import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AutoReleaseEscrowCron {
  private readonly logger = new Logger(AutoReleaseEscrowCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

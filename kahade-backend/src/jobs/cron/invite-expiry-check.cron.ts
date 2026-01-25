import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InviteExpiryCheckCron {
  private readonly logger = new Logger(InviteExpiryCheckCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentReminderCron {
  private readonly logger = new Logger(PaymentReminderCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

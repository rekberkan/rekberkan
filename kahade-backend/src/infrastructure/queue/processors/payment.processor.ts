import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  async handle(payload: unknown) {
    this.logger.debug('Processor handled payload');
    return payload;
  }
}

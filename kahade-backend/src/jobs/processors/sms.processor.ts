import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  async handle(payload: unknown) {
    this.logger.debug('Processor handled payload');
    return payload;
  }
}

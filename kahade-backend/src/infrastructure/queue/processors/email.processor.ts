import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  async handle(payload: unknown) {
    this.logger.debug('Processor handled payload');
    return payload;
  }
}

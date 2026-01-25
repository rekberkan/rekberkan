import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  async handle(payload: unknown) {
    this.logger.debug('Processor handled payload');
    return payload;
  }
}

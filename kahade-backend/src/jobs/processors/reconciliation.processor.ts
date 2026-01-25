import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReconciliationProcessor {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  async handle(payload: unknown) {
    this.logger.debug('Processor handled payload');
    return payload;
  }
}

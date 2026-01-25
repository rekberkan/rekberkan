import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EscrowProcessor {
  private readonly logger = new Logger(EscrowProcessor.name);

  async handle(payload: unknown) {
    this.logger.debug('Processor handled payload');
    return payload;
  }
}

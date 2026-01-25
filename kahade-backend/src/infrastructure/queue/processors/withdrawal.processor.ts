import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WithdrawalProcessor {
  private readonly logger = new Logger(WithdrawalProcessor.name);

  async handle(payload: unknown) {
    this.logger.debug('Processor handled payload');
    return payload;
  }
}

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetricsAggregationCron {
  private readonly logger = new Logger(MetricsAggregationCron.name);

  async run() {
    this.logger.debug('Cron executed');
  }
}

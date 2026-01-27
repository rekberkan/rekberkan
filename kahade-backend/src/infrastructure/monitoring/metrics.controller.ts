import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

// ============================================================================
// METRICS CONTROLLER
// ============================================================================
// Fix #89: Expose Prometheus-compatible metrics endpoint
// ============================================================================

@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics in text format' })
  getMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }
}

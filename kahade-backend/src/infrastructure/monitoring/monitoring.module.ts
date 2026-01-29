import { Module, Global } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { MetricsController } from "./metrics.controller";

// ============================================================================
// MONITORING MODULE
// ============================================================================
// Fix #89: Global monitoring and metrics module
// ============================================================================

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MonitoringModule {}

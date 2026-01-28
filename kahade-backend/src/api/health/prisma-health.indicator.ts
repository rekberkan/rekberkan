import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '@infrastructure/database/prisma.service';

// ============================================================================
// PRISMA HEALTH INDICATOR
// ============================================================================
// Checks database connectivity for health checks
// ============================================================================

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Execute a simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          message: error.message,
          responseTime: `${responseTime}ms`,
        }),
      );
    }
  }
}

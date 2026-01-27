import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';

// ============================================================================
// HEALTH CHECK CONTROLLER
// ============================================================================
// Fix #88: Comprehensive health check endpoint for monitoring
// ============================================================================

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  /**
   * Basic health check - for load balancers
   * Returns 200 if the application is running
   */
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detailed health check - for monitoring systems
   * Checks all dependencies
   */
  @Get('detailed')
  @HealthCheck()
  @ApiOperation({ summary: 'Detailed health check with all dependencies' })
  @ApiResponse({ status: 200, description: 'All services are healthy' })
  @ApiResponse({ status: 503, description: 'One or more services are unhealthy' })
  async checkDetailed() {
    return this.health.check([
      // Database health
      () => this.prisma.isHealthy('database'),
      
      // Redis health
      () => this.redis.isHealthy('redis'),
      
      // Memory health (warn if heap > 300MB, fail if > 500MB)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024), // 1GB RSS limit
      
      // Disk health (fail if disk usage > 90%)
      () => this.disk.checkStorage('disk', {
        path: '/',
        thresholdPercent: 0.9,
      }),
    ]);
  }

  /**
   * Liveness probe - for Kubernetes
   * Returns 200 if the application process is running
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  async liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - for Kubernetes
   * Returns 200 if the application is ready to accept traffic
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async readiness() {
    try {
      const result = await this.health.check([
        () => this.prisma.isHealthy('database'),
        () => this.redis.isHealthy('redis'),
      ]);
      
      return result;
    } catch (error) {
      throw new ServiceUnavailableException('Application not ready');
    }
  }

  /**
   * Startup probe - for Kubernetes
   * Returns 200 once the application has fully started
   */
  @Get('startup')
  @ApiOperation({ summary: 'Startup probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Application has started' })
  async startup() {
    // Check if critical services are initialized
    const checks = await Promise.allSettled([
      this.prisma.isHealthy('database'),
      this.redis.isHealthy('redis'),
    ]);
    
    const allHealthy = checks.every(c => c.status === 'fulfilled');
    
    if (!allHealthy) {
      throw new ServiceUnavailableException('Application still starting');
    }
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

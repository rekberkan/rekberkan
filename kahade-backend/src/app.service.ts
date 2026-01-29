import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

/**
 * Application Service
 * 
 * QUALITY FIX [M012]: Enhanced health check with detailed dependency status
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Basic health check
   */
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Detailed health check with dependency status
   * QUALITY FIX [M012]: Added comprehensive health checks
   */
  async getDetailedHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    dependencies: {
      database: { status: string; latency?: number; error?: string };
      memory: { status: string; used: number; total: number; percentage: number };
    };
  }> {
    const startTime = Date.now();
    const dependencies: any = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check database connection
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - dbStart;
      
      dependencies.database = {
        status: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'slow',
        latency: dbLatency,
      };
      
      if (dbLatency >= 500) {
        overallStatus = 'degraded';
      }
    } catch (error) {
      dependencies.database = {
        status: 'unhealthy',
        error: error.message,
      };
      overallStatus = 'unhealthy';
      this.logger.error(`Database health check failed: ${error.message}`);
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    dependencies.memory = {
      status: memPercentage < 80 ? 'healthy' : memPercentage < 95 ? 'degraded' : 'critical',
      used: memUsedMB,
      total: memTotalMB,
      percentage: memPercentage,
    };

    if (memPercentage >= 95) {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      dependencies,
    };
  }

  /**
   * Readiness check for Kubernetes/container orchestration
   */
  async getReadiness(): Promise<{ ready: boolean; checks: Record<string, boolean> }> {
    const checks: Record<string, boolean> = {};

    // Check database is ready
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      checks.database = false;
    }

    const ready = Object.values(checks).every(Boolean);

    return { ready, checks };
  }

  /**
   * Liveness check for Kubernetes/container orchestration
   */
  getLiveness(): { alive: boolean; timestamp: string } {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }

  getInfo() {
    return {
      name: 'Rekberkan API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'P2P Escrow Platform Backend API',
      documentation: '/api/v1/docs',
    };
  }
}

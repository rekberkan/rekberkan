import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              message: error.message,
            },
          };
        }
      },
    ]);
  }

  @Get('ready')
  async ready() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('live')
  async live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma.service';

// ============================================================================
// ACTIVITY CONTROLLER - Production Ready
// Implements: Activity Logging, History Retrieval, Filtering
// ============================================================================

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  private readonly logger = new Logger(ActivityController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by activity type' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Returns user activity log' })
  async getActivityLog(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (type) {
      where.activityType = type.toUpperCase();
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [activities, total] = await Promise.all([
      this.prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userActivity.count({ where }),
    ]);

    return {
      data: activities.map((a) => ({
        id: a.id,
        type: a.activityType,
        description: a.description,
        metadata: a.metadata,
        ipAddress: a.ipAddress ? this.maskIpAddress(a.ipAddress) : null,
        createdAt: a.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get activity summary' })
  @ApiResponse({ status: 200, description: 'Returns activity summary' })
  async getActivitySummary(@CurrentUser('id') userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalActivities, recentActivities, activityByType] = await Promise.all([
      this.prisma.userActivity.count({ where: { userId } }),
      this.prisma.userActivity.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.userActivity.groupBy({
        by: ['activityType'],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      totalActivities,
      recentActivities,
      activityByType: activityByType.map((a) => ({
        type: a.activityType,
        count: a._count,
      })),
    };
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Returns transaction history' })
  async getTransactionHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      OR: [{ initiatorId: userId }, { counterpartyId: userId }],
      deletedAt: null,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          title: true,
          status: true,
          amountMinor: true,
          platformFeeMinor: true,
          initiatorRole: true,
          initiatorId: true,
          counterpartyId: true,
          createdAt: true,
          paidAt: true,
          completedAt: true,
          initiator: { select: { id: true, username: true } },
          counterparty: { select: { id: true, username: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        title: o.title,
        status: o.status,
        amount: Number(o.amountMinor) / 100,
        fee: Number(o.platformFeeMinor) / 100,
        role:
          o.initiatorId === userId
            ? o.initiatorRole
            : o.initiatorRole === 'BUYER'
              ? 'SELLER'
              : 'BUYER',
        counterparty: o.initiatorId === userId ? o.counterparty?.username : o.initiator.username,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        completedAt: o.completedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get wallet activity history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, description: 'DEPOSIT, WITHDRAWAL, TRANSFER' })
  @ApiResponse({ status: 200, description: 'Returns wallet activity history' })
  async getWalletHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
  ) {
    const skip = (page - 1) * limit;

    // Get wallet
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Build query based on type
    let deposits: any[] = [];
    let withdrawals: any[] = [];
    let depositTotal = 0;
    let withdrawalTotal = 0;

    if (!type || type.toUpperCase() === 'DEPOSIT') {
      [deposits, depositTotal] = await Promise.all([
        this.prisma.deposit.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: 'desc' },
          skip: type ? skip : 0,
          take: type ? limit : Math.ceil(limit / 2),
        }),
        this.prisma.deposit.count({ where: { walletId: wallet.id } }),
      ]);
    }

    if (!type || type.toUpperCase() === 'WITHDRAWAL') {
      [withdrawals, withdrawalTotal] = await Promise.all([
        this.prisma.withdrawal.findMany({
          where: { walletId: wallet.id },
          orderBy: { requestedAt: 'desc' },
          skip: type ? skip : 0,
          take: type ? limit : Math.ceil(limit / 2),
        }),
        this.prisma.withdrawal.count({ where: { walletId: wallet.id } }),
      ]);
    }

    // Combine and sort
    const combined = [
      ...deposits.map((d) => ({
        id: d.id,
        type: 'DEPOSIT',
        amount: Number(d.amountMinor) / 100,
        status: d.status,
        reference: d.externalRef,
        createdAt: d.createdAt,
        completedAt: d.completedAt,
      })),
      ...withdrawals.map((w) => ({
        id: w.id,
        type: 'WITHDRAWAL',
        amount: Number(w.amountMinor) / 100,
        status: w.status,
        reference: w.externalRef,
        createdAt: w.requestedAt,
        completedAt: w.completedAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      data: combined.slice(0, limit),
      total: depositTotal + withdrawalTotal,
      page,
      limit,
      totalPages: Math.ceil((depositTotal + withdrawalTotal) / limit),
    };
  }

  @Get('security')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get security-related activity' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Returns security activity' })
  async getSecurityActivity(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Only filter by LOGIN and LOGOUT which are valid ActivityTypes
    const [activities, total] = await Promise.all([
      this.prisma.userActivity.findMany({
        where: {
          userId,
          activityType: {
            in: ['LOGIN', 'LOGOUT'],
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userActivity.count({
        where: {
          userId,
          activityType: {
            in: ['LOGIN', 'LOGOUT'],
          },
        },
      }),
    ]);

    return {
      data: activities.map((a) => ({
        id: a.id,
        type: a.activityType,
        description: a.description,
        ipAddress: a.ipAddress ? this.maskIpAddress(a.ipAddress) : null,
        userAgent: a.userAgent,
        createdAt: a.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private maskIpAddress(ip: string): string {
    // Mask last octet for privacy
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
    return ip.substring(0, ip.length - 3) + '***';
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

// ============================================================================
// ADMIN CONTROLLER - Production Ready
// ============================================================================

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      activeTransactions,
      pendingWithdrawals,
      pendingDisputes,
      todayVolume,
      totalVolume,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ 
        where: { 
          deletedAt: null,
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        } 
      }),
      (this.prisma as any).order.count({ where: { deletedAt: null } }),
      (this.prisma as any).order.count({
        where: { status: { in: ['PAID', 'DISPUTED'] }, deletedAt: null },
      }),
      (this.prisma as any).withdrawal.count({
        where: { status: 'PENDING' },
      }),
      (this.prisma as any).dispute.count({ where: { status: 'OPEN' } }),
      (this.prisma as any).order.aggregate({
        where: {
          status: { in: ['PAID', 'COMPLETED'] },
          paidAt: { gte: today },
        },
        _sum: { amountMinor: true },
      }),
      (this.prisma as any).order.aggregate({
        where: {
          status: { in: ['PAID', 'COMPLETED'] },
        },
        _sum: { amountMinor: true },
      }),
      (this.prisma as any).order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          initiator: { select: { id: true, name: true, email: true } },
          counterparty: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalUsers,
        activeUsers,
        totalTransactions,
        activeTransactions,
        pendingWithdrawals,
        pendingDisputes,
        todayVolume: Number(todayVolume._sum?.amountMinor || 0n) / 100,
        totalVolume: Number(totalVolume._sum?.amountMinor || 0n) / 100,
      },
      recentTransactions: recentTransactions.map((t: any) => ({
        id: t.id,
        orderNumber: t.orderNumber,
        title: t.title,
        amount: Number(t.amountMinor) / 100,
        status: t.status,
        initiator: t.initiator,
        counterparty: t.counterparty,
        createdAt: t.createdAt,
      })),
    };
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'kycStatus', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUsers(
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (status === 'active') {
      where.suspendedAt = null;
    } else if (status === 'suspended') {
      where.suspendedAt = { not: null };
    }

    if (kycStatus) {
      where.kycStatus = kycStatus.toUpperCase();
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          kycStatus: true,
          isAdmin: true,
          suspendedAt: true,
          suspendedUntil: true,
          suspendReason: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        kycSubmissions: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Post('users/:id/suspend')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: { reason: string },
  ) {
    if (!dto.reason) {
      throw new BadRequestException('Suspension reason required');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (id === adminId) {
      throw new ForbiddenException('Cannot suspend yourself');
    }

    if (user.isAdmin) {
      throw new ForbiddenException('Cannot suspend admin users');
    }

    const result = await this.prisma.user.update({
      where: { id },
      data: {
        suspendedAt: new Date(),
        suspendReason: dto.reason,
      },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'User', id, {
      action: 'SUSPENDED',
      reason: dto.reason,
    });

    this.logger.log(`User ${id} suspended by admin ${adminId}`);

    return { message: 'User suspended successfully' };
  }

  @Post('users/:id/activate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Activate suspended user' })
  async activateUser(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.user.update({
      where: { id },
      data: {
        suspendedAt: null,
        suspendedUntil: null,
        suspendReason: null,
      },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'User', id, {
      action: 'ACTIVATED',
    });

    this.logger.log(`User ${id} activated by admin ${adminId}`);

    return { message: 'User activated successfully' };
  }

  @Post('users/:id/kyc/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve user KYC' })
  async approveKYC(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { kycStatus: 'VERIFIED' },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'User', id, {
      action: 'KYC_APPROVED',
    });

    this.logger.log(`KYC approved for user ${id} by admin ${adminId}`);

    return { message: 'KYC approved successfully' };
  }

  @Post('users/:id/kyc/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject user KYC' })
  async rejectKYC(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: { reason: string },
  ) {
    if (!dto.reason) {
      throw new BadRequestException('Rejection reason required');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { 
        kycStatus: 'REJECTED',
      },
    });

    // Store rejection reason in the latest KYC submission
    await this.prisma.kYCSubmission.updateMany({
      where: { userId: id },
      data: { rejectionReason: dto.reason },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'User', id, {
      action: 'KYC_REJECTED',
      reason: dto.reason,
    });

    this.logger.log(`KYC rejected for user ${id} by admin ${adminId}`);

    return { message: 'KYC rejected' };
  }

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  @Get('transactions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTransactions(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (status) {
      where.status = status.toUpperCase();
    }

    const [transactions, total] = await Promise.all([
      (this.prisma as any).order.findMany({
        where,
        include: {
          initiator: { select: { id: true, name: true, email: true } },
          counterparty: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).order.count({ where }),
    ]);

    return {
      data: transactions.map((t: any) => ({
        id: t.id,
        orderNumber: t.orderNumber,
        title: t.title,
        description: t.description,
        amount: Number(t.amountMinor) / 100,
        status: t.status,
        initiator: t.initiator,
        counterparty: t.counterparty,
        createdAt: t.createdAt,
        paidAt: t.paidAt,
        completedAt: t.completedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('transactions/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get transaction details' })
  async getTransaction(@Param('id') id: string) {
    const transaction = await (this.prisma as any).order.findUnique({
      where: { id },
      include: {
        initiator: { select: { id: true, name: true, email: true, username: true } },
        counterparty: { select: { id: true, name: true, email: true, username: true } },
        escrowHold: true,
        dispute: true,
        ratings: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      ...transaction,
      amount: Number(transaction.amountMinor) / 100,
      platformFee: Number(transaction.platformFeeMinor) / 100,
    };
  }

  @Post('transactions/:id/force-complete')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Force complete transaction' })
  async forceCompleteTransaction(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: { reason: string },
  ) {
    if (!dto.reason) {
      throw new BadRequestException('Reason required');
    }

    const transaction = await (this.prisma as any).order.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await (this.prisma as any).order.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        adminNotes: dto.reason,
      },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'Order', id, {
      action: 'FORCE_COMPLETED',
      reason: dto.reason,
    });

    this.logger.log(`Transaction ${id} force completed by admin ${adminId}`);

    return { message: 'Transaction force completed' };
  }

  @Post('transactions/:id/force-cancel')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Force cancel transaction' })
  async forceCancelTransaction(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: { reason: string },
  ) {
    if (!dto.reason) {
      throw new BadRequestException('Reason required');
    }

    const transaction = await (this.prisma as any).order.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await (this.prisma as any).order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: dto.reason,
        adminNotes: `Force cancelled by admin: ${dto.reason}`,
      },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'Order', id, {
      action: 'FORCE_CANCELLED',
      reason: dto.reason,
    });

    this.logger.log(`Transaction ${id} force cancelled by admin ${adminId}`);

    return { message: 'Transaction force cancelled' };
  }

  // ============================================================================
  // DISPUTE MANAGEMENT
  // ============================================================================

  @Get('disputes')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all disputes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDisputes(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    const [disputes, total] = await Promise.all([
      (this.prisma as any).dispute.findMany({
        where,
        include: {
          order: {
            include: {
              initiator: { select: { id: true, name: true, email: true } },
              counterparty: { select: { id: true, name: true, email: true } },
            },
          },
          openedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).dispute.count({ where }),
    ]);

    return {
      data: disputes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('disputes/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get dispute details' })
  async getDispute(@Param('id') id: string) {
    const dispute = await (this.prisma as any).dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            initiator: { select: { id: true, name: true, email: true, username: true } },
            counterparty: { select: { id: true, name: true, email: true, username: true } },
          },
        },
        openedBy: { select: { id: true, name: true, email: true } },
        evidences: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  @Post('disputes/:id/review')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Start reviewing dispute' })
  async startReview(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const dispute = await (this.prisma as any).dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    await (this.prisma as any).dispute.update({
      where: { id },
      data: {
        status: 'UNDER_ARBITRATION',
        assignedTo: adminId,
      },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'Dispute', id, {
      action: 'REVIEW_STARTED',
    });

    return { message: 'Dispute review started' };
  }

  @Post('disputes/:id/resolve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resolve dispute' })
  async resolveDispute(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: { winner: 'buyer' | 'seller' | 'split'; resolution: string },
  ) {
    if (!dto.resolution) {
      throw new BadRequestException('Resolution details required');
    }

    const dispute = await (this.prisma as any).dispute.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    let decision = 'SPLIT_SETTLEMENT';
    if (dto.winner === 'buyer') {
      decision = 'REFUND_ALL_TO_BUYER';
    } else if (dto.winner === 'seller') {
      decision = 'RELEASE_ALL_TO_SELLER';
    }

    await (this.prisma as any).dispute.update({
      where: { id },
      data: {
        status: 'CLOSED',
        decision,
        resolution: dto.resolution,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    // Update order status
    const orderStatus = dto.winner === 'buyer' ? 'REFUNDED' : 'COMPLETED';
    await (this.prisma as any).order.update({
      where: { id: dispute.orderId },
      data: { status: orderStatus },
    });

    await this.createAuditLog(adminId, 'UPDATE', 'Dispute', id, {
      action: 'RESOLVED',
      winner: dto.winner,
      resolution: dto.resolution,
    });

    this.logger.log(`Dispute ${id} resolved by admin ${adminId}`);

    return { message: 'Dispute resolved successfully' };
  }

  // ============================================================================
  // WITHDRAWAL MANAGEMENT
  // ============================================================================

  @Get('withdrawals/pending')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get pending withdrawals' })
  async getPendingWithdrawals() {
    const withdrawals = await (this.prisma as any).withdrawal.findMany({
      where: { status: 'PENDING' },
      include: {
        wallet: {
          include: {
            user: { select: { id: true, name: true, email: true, kycStatus: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return withdrawals.map((w: any) => ({
      id: w.id,
      amount: Number(w.amountMinor) / 100,
      fee: Number(w.feeMinor) / 100,
      bankCode: w.bankCode,
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      status: w.status,
      user: w.wallet.user,
      createdAt: w.createdAt,
    }));
  }

  @Post('withdrawals/:id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve withdrawal' })
  async approveWithdrawal(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const withdrawal = await (this.prisma as any).withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal is not pending');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update withdrawal status
      await (tx as any).withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      });

      // Deduct from wallet (locked amount)
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balanceMinor: { decrement: withdrawal.amountMinor + withdrawal.feeMinor },
          lockedMinor: { decrement: withdrawal.amountMinor + withdrawal.feeMinor },
        },
      });
    });

    await this.createAuditLog(adminId, 'UPDATE', 'Withdrawal', id, {
      action: 'APPROVED',
      amount: withdrawal.amountMinor.toString(),
    });

    this.logger.log(`Withdrawal ${id} approved by admin ${adminId}`);

    return { message: 'Withdrawal approved' };
  }

  @Post('withdrawals/:id/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject withdrawal' })
  async rejectWithdrawal(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: { reason: string },
  ) {
    if (!dto.reason) {
      throw new BadRequestException('Rejection reason required');
    }

    const withdrawal = await (this.prisma as any).withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal is not pending');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update withdrawal status
      await (tx as any).withdrawal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.reason,
        },
      });

      // Unlock the amount
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          lockedMinor: { decrement: withdrawal.amountMinor + withdrawal.feeMinor },
        },
      });
    });

    await this.createAuditLog(adminId, 'UPDATE', 'Withdrawal', id, {
      action: 'REJECTED',
      reason: dto.reason,
    });

    this.logger.log(`Withdrawal ${id} rejected by admin ${adminId}`);

    return { message: 'Withdrawal rejected' };
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  @Get('audit-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'actorType', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('actorType') actorType?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      (this.prisma as any).auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  @Get('settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    const settings = await (this.prisma as any).systemConfig.findMany();
    
    return settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
  }

  @Patch('settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update system settings' })
  async updateSettings(
    @CurrentUser('id') adminId: string,
    @Body() dto: Record<string, any>,
  ) {
    for (const [key, value] of Object.entries(dto)) {
      await (this.prisma as any).systemConfig.upsert({
        where: { key },
        update: { value: JSON.stringify(value), updatedAt: new Date() },
        create: { key, value: JSON.stringify(value) },
      });
    }

    await this.createAuditLog(adminId, 'UPDATE', 'SystemConfig', 'settings', {
      updatedKeys: Object.keys(dto),
    });

    return { message: 'Settings updated successfully' };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async createAuditLog(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: any,
  ) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          performedBy: userId,
          action,
          entityType,
          entityId,
          details,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }
}

import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { Withdrawal, WithdrawalStatus, KYCStatus } from '@common/shims/prisma-types.shim';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../wallet/wallet.service';
import { LedgerService } from '../ledger/ledger.service';

// ============================================================================
// BANK-GRADE WITHDRAWAL SERVICE
// Implements: Velocity Controls, Daily/Monthly Limits, Cooling Period, Multi-Approval
// ============================================================================

export class WithdrawalLimitExceededError extends BadRequestException {
  constructor(message: string, details?: Record<string, any>) {
    super({
      code: 'WITHDRAWAL_LIMIT_EXCEEDED',
      message,
      ...details,
    });
  }
}

export class WithdrawalCoolingPeriodError extends BadRequestException {
  constructor(waitMinutes: number) {
    super({
      code: 'WITHDRAWAL_COOLING_PERIOD',
      message: `Please wait ${waitMinutes} minutes before next withdrawal`,
      waitMinutes,
    });
  }
}

export class WithdrawalFlaggedError extends ForbiddenException {
  constructor(reason: string) {
    super({
      code: 'WITHDRAWAL_FLAGGED',
      message: 'Withdrawal flagged for review',
      reason,
    });
  }
}

export interface CreateWithdrawalDto {
  userId: string;
  bankAccountId: string;
  amountMinor: bigint;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface WithdrawalLimits {
  dailyLimit: bigint;
  dailyUsed: bigint;
  dailyRemaining: bigint;
  dailyCount: number;
  maxDailyCount: number;
  monthlyLimit: bigint;
  monthlyUsed: bigint;
  monthlyRemaining: bigint;
  coolingPeriodMinutes: number;
  nextWithdrawalAllowedAt: Date | null;
}

// Bank-grade limits configuration
const WITHDRAWAL_LIMITS = {
  // KYC Basic limits
  BASIC: {
    dailyLimit: 10_000_000n * 100n, // Rp 10jt in minor units (sen)
    monthlyLimit: 50_000_000n * 100n, // Rp 50jt
    maxDailyCount: 3,
    coolingPeriodMinutes: 30,
    requiresApprovalThreshold: 5_000_000n * 100n, // Rp 5jt
  },
  // KYC Verified limits
  VERIFIED: {
    dailyLimit: 100_000_000n * 100n, // Rp 100jt
    monthlyLimit: 500_000_000n * 100n, // Rp 500jt
    maxDailyCount: 5,
    coolingPeriodMinutes: 15,
    requiresApprovalThreshold: 25_000_000n * 100n, // Rp 25jt
  },
  // KYC Premium limits
  PREMIUM: {
    dailyLimit: 500_000_000n * 100n, // Rp 500jt
    monthlyLimit: 2_000_000_000n * 100n, // Rp 2M
    maxDailyCount: 10,
    coolingPeriodMinutes: 5,
    requiresApprovalThreshold: 100_000_000n * 100n, // Rp 100jt
  },
  // Default (no KYC)
  NONE: {
    dailyLimit: 1_000_000n * 100n, // Rp 1jt
    monthlyLimit: 5_000_000n * 100n, // Rp 5jt
    maxDailyCount: 1,
    coolingPeriodMinutes: 60,
    requiresApprovalThreshold: 500_000n * 100n, // Rp 500k
  },
};

// Velocity scoring thresholds
const VELOCITY_THRESHOLDS = {
  hourlyCountWarning: 2,
  hourlyCountBlock: 3,
  hourlyAmountWarning: 5_000_000n * 100n,
  hourlyAmountBlock: 10_000_000n * 100n,
  velocityScoreWarning: 70,
  velocityScoreBlock: 90,
};

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
  ) {}

  // ============================================================================
  // WITHDRAWAL CREATION WITH BANK-GRADE VALIDATION
  // ============================================================================

  /**
   * BANK-GRADE: Create withdrawal with full validation
   */
  async createWithdrawal(dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const {
      userId,
      bankAccountId,
      amountMinor,
      idempotencyKey,
      ipAddress,
      userAgent,
      deviceFingerprint,
    } = dto;

    // Step 1: Idempotency check
    const existingWithdrawal = await this.prisma.withdrawal.findUnique({
      where: { idempotencyKey },
    });

    if (existingWithdrawal) {
      this.logger.warn(`Duplicate withdrawal request: ${idempotencyKey}`);
      return existingWithdrawal;
    }

    // Step 2: Validate user and KYC status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Step 3: Validate bank account ownership
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!bankAccount) {
      throw new BadRequestException('Invalid or inactive bank account');
    }

    // Step 4: Get wallet and validate balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const availableBalance = wallet.balanceMinor - wallet.lockedMinor;
    if (availableBalance < amountMinor) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient balance',
        available: availableBalance.toString(),
        requested: amountMinor.toString(),
      });
    }

    // Step 5: Validate withdrawal limits
    await this.validateWithdrawalLimits(userId, amountMinor, user.kycStatus);

    // Step 6: Calculate velocity score
    const velocityData = await this.calculateVelocityScore(
      userId,
      amountMinor,
      ipAddress,
      deviceFingerprint,
    );

    // Step 7: Determine if approval is required
    const kycLevel = this.getKYCLevel(user.kycStatus);
    const limits = WITHDRAWAL_LIMITS[kycLevel];
    const requiresApproval = amountMinor >= limits.requiresApprovalThreshold;
    const isFlagged = velocityData.score >= VELOCITY_THRESHOLDS.velocityScoreWarning;

    // Step 8: Create withdrawal in transaction
    const withdrawal = await this.prisma.$transaction(async (tx) => {
      // Lock balance
      await this.walletService.lockBalance({
        userId,
        amount: amountMinor,
        reason: 'Withdrawal request',
        tx,
      });

      // Create withdrawal record
      const newWithdrawal = await tx.withdrawal.create({
        data: {
          walletId: wallet.id,
          userId,
          bankAccountId,
          amountMinor,
          idempotencyKey,
          status: isFlagged || requiresApproval
            ? WithdrawalStatus.PENDING
            : WithdrawalStatus.PENDING,
          requiresMultipleApprovals: amountMinor >= limits.requiresApprovalThreshold * 2n,
          requiredApprovals: amountMinor >= limits.requiresApprovalThreshold * 2n ? 2 : 1,
          velocityScore: velocityData.score,
          isFlaggedBySystem: isFlagged,
          flagReason: isFlagged ? velocityData.flagReason : null,
          coolingPeriodEndsAt: new Date(
            Date.now() + limits.coolingPeriodMinutes * 60 * 1000,
          ),
          canProcessAfter: new Date(
            Date.now() + limits.coolingPeriodMinutes * 60 * 1000,
          ),
        },
      });

      return newWithdrawal;
    });

    this.logger.log(
      `Created withdrawal ${withdrawal.id} for user ${userId}, amount: ${amountMinor}, status: ${withdrawal.status}`,
    );

    return withdrawal;
  }

  // ============================================================================
  // WITHDRAWAL LIMITS VALIDATION
  // ============================================================================

  /**
   * BANK-GRADE: Validate all withdrawal limits
   */
  async validateWithdrawalLimits(
    userId: string,
    amountMinor: bigint,
    kycStatus?: KYCStatus | null,
  ): Promise<void> {
    const kycLevel = this.getKYCLevel(kycStatus);
    const limits = WITHDRAWAL_LIMITS[kycLevel];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get today's withdrawals
    const todayWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        requestedAt: { gte: startOfDay },
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED] },
      },
      _sum: { amountMinor: true },
      _count: true,
    });

    // Get this month's withdrawals
    const monthWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        requestedAt: { gte: startOfMonth },
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED] },
      },
      _sum: { amountMinor: true },
    });

    const dailyUsed = todayWithdrawals._sum?.amountMinor || 0n;
    const dailyCount = todayWithdrawals._count || 0;
    const monthlyUsed = monthWithdrawals._sum?.amountMinor || 0n;

    // Check daily count limit
    if (dailyCount >= limits.maxDailyCount) {
      throw new WithdrawalLimitExceededError(
        `Maximum ${limits.maxDailyCount} withdrawals per day`,
        {
          currentCount: dailyCount,
          maxCount: limits.maxDailyCount,
        },
      );
    }

    // Check daily amount limit
    const dailyRemaining = limits.dailyLimit - dailyUsed;
    if (amountMinor > dailyRemaining) {
      throw new WithdrawalLimitExceededError('Daily withdrawal limit exceeded', {
        dailyLimit: limits.dailyLimit.toString(),
        dailyUsed: dailyUsed.toString(),
        dailyRemaining: dailyRemaining.toString(),
        requested: amountMinor.toString(),
      });
    }

    // Check monthly amount limit
    const monthlyRemaining = limits.monthlyLimit - monthlyUsed;
    if (amountMinor > monthlyRemaining) {
      throw new WithdrawalLimitExceededError('Monthly withdrawal limit exceeded', {
        monthlyLimit: limits.monthlyLimit.toString(),
        monthlyUsed: monthlyUsed.toString(),
        monthlyRemaining: monthlyRemaining.toString(),
        requested: amountMinor.toString(),
      });
    }

    // Check cooling period
    const lastWithdrawal = await this.prisma.withdrawal.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      select: { requestedAt: true },
    });

    if (lastWithdrawal) {
      const minutesSinceLast = Math.floor(
        (now.getTime() - lastWithdrawal.requestedAt.getTime()) / 60000
      );
      if (minutesSinceLast < limits.coolingPeriodMinutes) {
        throw new WithdrawalCoolingPeriodError(
          limits.coolingPeriodMinutes - minutesSinceLast,
        );
      }
    }
  }

  /**
   * Get user's current withdrawal limits
   */
  async getWithdrawalLimits(userId: string): Promise<WithdrawalLimits> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const kycLevel = this.getKYCLevel(user.kycStatus);
    const limits = WITHDRAWAL_LIMITS[kycLevel];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get today's withdrawals
    const todayWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        requestedAt: { gte: startOfDay },
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED] },
      },
      _sum: { amountMinor: true },
      _count: true,
    });

    // Get this month's withdrawals
    const monthWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        requestedAt: { gte: startOfMonth },
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED] },
      },
      _sum: { amountMinor: true },
    });

    // Get last withdrawal
    const lastWithdrawal = await this.prisma.withdrawal.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      select: { requestedAt: true },
    });

    const dailyUsed = todayWithdrawals._sum?.amountMinor || 0n;
    const dailyCount = todayWithdrawals._count || 0;
    const monthlyUsed = monthWithdrawals._sum?.amountMinor || 0n;

    let nextWithdrawalAllowedAt: Date | null = null;
    if (lastWithdrawal) {
      const nextAllowed = new Date(
        lastWithdrawal.requestedAt.getTime() + limits.coolingPeriodMinutes * 60 * 1000
      );
      if (nextAllowed > now) {
        nextWithdrawalAllowedAt = nextAllowed;
      }
    }

    return {
      dailyLimit: limits.dailyLimit,
      dailyUsed,
      dailyRemaining: limits.dailyLimit - dailyUsed,
      dailyCount,
      maxDailyCount: limits.maxDailyCount,
      monthlyLimit: limits.monthlyLimit,
      monthlyUsed,
      monthlyRemaining: limits.monthlyLimit - monthlyUsed,
      coolingPeriodMinutes: limits.coolingPeriodMinutes,
      nextWithdrawalAllowedAt,
    };
  }

  // ============================================================================
  // VELOCITY SCORING
  // ============================================================================

  /**
   * Calculate velocity score based on recent withdrawal patterns
   */
  private async calculateVelocityScore(
    userId: string,
    amountMinor: bigint,
    ipAddress?: string,
    deviceFingerprint?: string,
  ): Promise<{
    score: number;
    flagReason: string | null;
    hourlyCount: number;
    dailyCount: number;
    weeklyCount: number;
    hourlyAmount: bigint;
    dailyAmount: bigint;
    weeklyAmount: bigint;
  }> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [hourlyData, dailyData, weeklyData] = await Promise.all([
      this.prisma.withdrawal.aggregate({
        where: { userId, requestedAt: { gte: hourAgo } },
        _count: true,
        _sum: { amountMinor: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { userId, requestedAt: { gte: dayAgo } },
        _count: true,
        _sum: { amountMinor: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { userId, requestedAt: { gte: weekAgo } },
        _count: true,
        _sum: { amountMinor: true },
      }),
    ]);

    const hourlyCount = hourlyData._count || 0;
    const dailyCount = dailyData._count || 0;
    const weeklyCount = weeklyData._count || 0;
    const hourlyAmount = hourlyData._sum?.amountMinor || 0n;
    const dailyAmount = dailyData._sum?.amountMinor || 0n;
    const weeklyAmount = weeklyData._sum?.amountMinor || 0n;

    // Calculate risk score (0-100)
    let score = 0;
    const flagReasons: string[] = [];

    // Hourly count velocity
    if (hourlyCount >= VELOCITY_THRESHOLDS.hourlyCountBlock) {
      score += 40;
      flagReasons.push('High hourly withdrawal count');
    } else if (hourlyCount >= VELOCITY_THRESHOLDS.hourlyCountWarning) {
      score += 20;
    }

    // Hourly amount velocity
    if (hourlyAmount >= VELOCITY_THRESHOLDS.hourlyAmountBlock) {
      score += 30;
      flagReasons.push('High hourly withdrawal amount');
    } else if (hourlyAmount >= VELOCITY_THRESHOLDS.hourlyAmountWarning) {
      score += 15;
    }

    // Daily velocity
    if (dailyCount >= 10) {
      score += 20;
      flagReasons.push('High daily withdrawal count');
    } else if (dailyCount >= 5) {
      score += 10;
    }

    // Weekly velocity
    if (weeklyCount >= 30) {
      score += 10;
      flagReasons.push('High weekly withdrawal count');
    }

    return {
      score: Math.min(score, 100),
      flagReason: flagReasons.length > 0 ? flagReasons.join('; ') : null,
      hourlyCount,
      dailyCount,
      weeklyCount,
      hourlyAmount,
      dailyAmount,
      weeklyAmount,
    };
  }

  // ============================================================================
  // WITHDRAWAL APPROVAL
  // ============================================================================

  /**
   * Approve withdrawal (admin action)
   */
  async approveWithdrawal(
    withdrawalId: string,
    approverId: string,
    notes?: string,
  ): Promise<Withdrawal> {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve withdrawal in ${withdrawal.status} status`,
      );
    }

    // Check if multiple approvals required
    const currentApprovals = await this.prisma.withdrawalApproval.count({
      where: { withdrawalId },
    });

    const needsMoreApprovals = 
      withdrawal.requiresMultipleApprovals &&
      currentApprovals + 1 < withdrawal.requiredApprovals;

    const result = await this.prisma.$transaction(async (tx) => {
      // Create approval record
      await tx.withdrawalApproval.create({
        data: {
          withdrawalId,
          approvedBy: approverId,
          notes,
        },
      });

      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: needsMoreApprovals
            ? WithdrawalStatus.PENDING
            : WithdrawalStatus.APPROVED,
          approvedBy: needsMoreApprovals ? undefined : approverId,
          approvedAt: needsMoreApprovals ? undefined : new Date(),
          adminNotes: notes,
        },
      });

      return updatedWithdrawal;
    });

    this.logger.log(
      `Withdrawal ${withdrawalId} approved by ${approverId}${
        needsMoreApprovals ? ' (needs more approvals)' : ''
      }`,
    );

    return result;
  }

  /**
   * Reject withdrawal (admin action)
   */
  async rejectWithdrawal(
    withdrawalId: string,
    rejectorId: string,
    reason: string,
  ): Promise<Withdrawal> {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject withdrawal in ${withdrawal.status} status`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Unlock balance
      await this.walletService.unlockBalance(
        withdrawal.userId,
        withdrawal.amountMinor,
        `Withdrawal rejected: ${reason}`,
        tx,
      );

      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.REJECTED,
          rejectionReason: reason,
        },
      });

      return updatedWithdrawal;
    });

    this.logger.log(`Withdrawal ${withdrawalId} rejected by ${rejectorId}: ${reason}`);

    return result;
  }

  /**
   * Complete withdrawal (after bank transfer)
   */
  async completeWithdrawal(
    withdrawalId: string,
    bankReference?: string,
  ): Promise<Withdrawal> {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== WithdrawalStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot complete withdrawal in ${withdrawal.status} status`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from wallet (locked balance)
      await tx.wallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balanceMinor: { decrement: withdrawal.amountMinor },
          lockedMinor: { decrement: withdrawal.amountMinor },
        },
      });

      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.COMPLETED,
          completedAt: new Date(),
          providerDisbursementId: bankReference,
        },
      });

      return updatedWithdrawal;
    });

    this.logger.log(`Withdrawal ${withdrawalId} completed`);

    return result;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getKYCLevel(kycStatus?: KYCStatus | null): keyof typeof WITHDRAWAL_LIMITS {
    switch (kycStatus) {
      case KYCStatus.PENDING:
        return 'BASIC';
      case KYCStatus.VERIFIED:
        return 'VERIFIED';
      default:
        return 'NONE';
    }
  }
}

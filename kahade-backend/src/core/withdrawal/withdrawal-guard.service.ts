import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { KYCStatus } from '@common/shims/prisma-types.shim';

// ============================================================================
// BANK-GRADE WITHDRAWAL GUARD SERVICE
// Implements: Velocity Controls, Daily/Monthly Limits, Cooling Period
// ============================================================================

export interface IWithdrawalLimitCheck {
  canWithdraw: boolean;
  reason?: string;
  dailyUsed: bigint;
  dailyLimit: bigint;
  dailyRemaining: bigint;
  monthlyUsed: bigint;
  monthlyLimit: bigint;
  monthlyRemaining: bigint;
  lastWithdrawalAt: Date | null;
  coolingPeriodMinutes: number;
  minutesSinceLastWithdrawal: number | null;
  velocityScore: number;
  isFlagged: boolean;
}

// Default limits based on KYC status
const DEFAULT_LIMITS: Record<KYCStatus, { dailyLimitMinor: bigint; perTxLimitMinor: bigint; monthlyLimitMinor: bigint }> = {
  [KYCStatus.NONE]: {
    dailyLimitMinor: BigInt(5_000_000 * 100),
    perTxLimitMinor: BigInt(1_000_000 * 100),
    monthlyLimitMinor: BigInt(20_000_000 * 100),
  },
  [KYCStatus.PENDING]: {
    dailyLimitMinor: BigInt(25_000_000 * 100),
    perTxLimitMinor: BigInt(10_000_000 * 100),
    monthlyLimitMinor: BigInt(100_000_000 * 100),
  },
  [KYCStatus.VERIFIED]: {
    dailyLimitMinor: BigInt(100_000_000 * 100),
    perTxLimitMinor: BigInt(50_000_000 * 100),
    monthlyLimitMinor: BigInt(500_000_000 * 100),
  },
  [KYCStatus.REJECTED]: {
    dailyLimitMinor: BigInt(1_000_000 * 100),
    perTxLimitMinor: BigInt(500_000 * 100),
    monthlyLimitMinor: BigInt(5_000_000 * 100),
  },
};

const DEFAULT_COOLING_PERIOD_MINUTES = 60;

@Injectable()
export class WithdrawalGuardService {
  private readonly logger = new Logger(WithdrawalGuardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can withdraw the requested amount
   */
  async checkWithdrawalLimits(
    userId: string,
    amountMinor: bigint,
  ): Promise<IWithdrawalLimitCheck> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });

    const kycStatus = (user?.kycStatus as KYCStatus) || KYCStatus.NONE;
    const defaultLimits = DEFAULT_LIMITS[kycStatus] || DEFAULT_LIMITS[KYCStatus.NONE];
    const dailyLimit = defaultLimits.dailyLimitMinor;
    const perTxLimit = defaultLimits.perTxLimitMinor;
    const monthlyLimit = defaultLimits.monthlyLimitMinor;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        requestedAt: { gte: today },
        status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] },
      },
      _sum: { amountMinor: true },
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        requestedAt: { gte: monthStart },
        status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] },
      },
      _sum: { amountMinor: true },
    });

    const lastWithdrawal = await this.prisma.withdrawal.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      select: { requestedAt: true },
    });

    const dailyUsed = todayWithdrawals._sum?.amountMinor || 0n;
    const monthlyUsed = monthWithdrawals._sum?.amountMinor || 0n;
    const dailyRemaining = dailyLimit - dailyUsed;
    const monthlyRemaining = monthlyLimit - monthlyUsed;
    const lastWithdrawalAt = lastWithdrawal?.requestedAt || null;
    const minutesSinceLastWithdrawal = this.getMinutesSince(lastWithdrawalAt);

    const velocityScore = await this.calculateVelocityScore(userId);
    const isFlagged = velocityScore >= 75;

    if (amountMinor > perTxLimit) {
      return {
        canWithdraw: false,
        reason: `Amount exceeds per-transaction limit of ${this.formatAmount(perTxLimit)}`,
        dailyUsed,
        dailyLimit,
        dailyRemaining,
        monthlyUsed,
        monthlyLimit,
        monthlyRemaining,
        lastWithdrawalAt,
        coolingPeriodMinutes: DEFAULT_COOLING_PERIOD_MINUTES,
        minutesSinceLastWithdrawal,
        velocityScore,
        isFlagged,
      };
    }

    if (dailyUsed + amountMinor > dailyLimit) {
      return {
        canWithdraw: false,
        reason: `Daily withdrawal limit exceeded. Remaining: ${this.formatAmount(dailyRemaining)}`,
        dailyUsed,
        dailyLimit,
        dailyRemaining,
        monthlyUsed,
        monthlyLimit,
        monthlyRemaining,
        lastWithdrawalAt,
        coolingPeriodMinutes: DEFAULT_COOLING_PERIOD_MINUTES,
        minutesSinceLastWithdrawal,
        velocityScore,
        isFlagged,
      };
    }

    if (monthlyUsed + amountMinor > monthlyLimit) {
      return {
        canWithdraw: false,
        reason: `Monthly withdrawal limit exceeded. Remaining: ${this.formatAmount(monthlyRemaining)}`,
        dailyUsed,
        dailyLimit,
        dailyRemaining,
        monthlyUsed,
        monthlyLimit,
        monthlyRemaining,
        lastWithdrawalAt,
        coolingPeriodMinutes: DEFAULT_COOLING_PERIOD_MINUTES,
        minutesSinceLastWithdrawal,
        velocityScore,
        isFlagged,
      };
    }

    if (minutesSinceLastWithdrawal !== null && minutesSinceLastWithdrawal < DEFAULT_COOLING_PERIOD_MINUTES) {
      const minutesRemaining = DEFAULT_COOLING_PERIOD_MINUTES - minutesSinceLastWithdrawal;
      return {
        canWithdraw: false,
        reason: `Cooling period active. Please wait ${minutesRemaining} minutes.`,
        dailyUsed,
        dailyLimit,
        dailyRemaining,
        monthlyUsed,
        monthlyLimit,
        monthlyRemaining,
        lastWithdrawalAt,
        coolingPeriodMinutes: DEFAULT_COOLING_PERIOD_MINUTES,
        minutesSinceLastWithdrawal,
        velocityScore,
        isFlagged,
      };
    }

    if (isFlagged) {
      this.logger.warn(
        `User ${userId} is flagged for suspicious activity (score: ${velocityScore})`,
      );
    }

    return {
      canWithdraw: true,
      dailyUsed,
      dailyLimit,
      dailyRemaining,
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining,
      lastWithdrawalAt,
      coolingPeriodMinutes: DEFAULT_COOLING_PERIOD_MINUTES,
      minutesSinceLastWithdrawal,
      velocityScore,
      isFlagged,
    };
  }

  private async calculateVelocityScore(userId: string): Promise<number> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [hourly, daily, weekly] = await Promise.all([
      this.prisma.withdrawal.count({
        where: { userId, requestedAt: { gte: hourAgo } },
      }),
      this.prisma.withdrawal.count({
        where: { userId, requestedAt: { gte: dayAgo } },
      }),
      this.prisma.withdrawal.count({
        where: { userId, requestedAt: { gte: weekAgo } },
      }),
    ]);

    let score = 0;

    if (hourly >= 3) score += 40;
    else if (hourly >= 2) score += 20;

    if (daily >= 10) score += 30;
    else if (daily >= 5) score += 15;

    if (weekly >= 30) score += 30;
    else if (weekly >= 20) score += 15;

    return score;
  }

  async flagWithdrawal(withdrawalId: string, reason: string): Promise<void> {
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        isFlaggedBySystem: true,
        flagReason: reason,
      },
    });

    this.logger.warn(`Withdrawal ${withdrawalId} flagged: ${reason}`);
  }

  private getMinutesSince(date: Date | null): number | null {
    if (!date) return null;
    return Math.floor((Date.now() - date.getTime()) / 60000);
  }

  private formatAmount(amountMinor: bigint): string {
    const amount = Number(amountMinor) / 100;
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
}

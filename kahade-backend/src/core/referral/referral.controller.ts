import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { PrismaService } from "@infrastructure/database/prisma.service";
import * as crypto from "crypto";

// ============================================================================
// REFERRAL CONTROLLER - Production Ready
// Implements: Referral Code Generation, Usage Tracking, Rewards
// ============================================================================

interface ApplyReferralDto {
  code: string;
}

@ApiTags("referral")
@Controller("referral")
export class ReferralController {
  private readonly logger = new Logger(ReferralController.name);
  private readonly REFERRAL_REWARD_AMOUNT = 25000n * 100n; // Rp 25,000 in minor units
  private readonly REFERRAL_CODE_EXPIRY_DAYS = 365;
  private readonly MAX_REFERRAL_USAGES = 100;

  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  health() {
    return { status: "ok" };
  }

  @Get("my-code")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get or generate user referral code" })
  @ApiResponse({ status: 200, description: "Returns user referral code" })
  async getMyReferralCode(@CurrentUser("id") userId: string) {
    // Check if user already has a referral code
    let referralCode = await this.prisma.referralCode.findUnique({
      where: { userId },
    });

    // Generate new code if not exists
    if (!referralCode) {
      const code = this.generateReferralCode();
      const expiresAt = new Date(
        Date.now() + this.REFERRAL_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      );

      referralCode = await this.prisma.referralCode.create({
        data: {
          userId,
          code,
          maxUsages: this.MAX_REFERRAL_USAGES,
          expiresAt,
        },
      });

      this.logger.log(`Generated referral code ${code} for user ${userId}`);
    }

    return {
      code: referralCode.code,
      usageCount: referralCode.usageCount,
      maxUsages: referralCode.maxUsages,
      isActive: referralCode.isActive,
      expiresAt: referralCode.expiresAt,
      shareLink: `${process.env.FRONTEND_URL || "https://kahade.com"}/register?ref=${referralCode.code}`,
    };
  }

  @Post("apply")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Apply a referral code" })
  @ApiResponse({
    status: 200,
    description: "Referral code applied successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid or expired referral code" })
  async applyReferralCode(
    @CurrentUser("id") userId: string,
    @Body() dto: ApplyReferralDto,
  ) {
    const code = dto.code.toUpperCase().trim();

    // Get referral code
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code },
      include: { user: { select: { id: true, username: true } } },
    });

    if (!referralCode) {
      throw new NotFoundException("Referral code not found");
    }

    // Validate referral code
    if (!referralCode.isActive) {
      throw new BadRequestException("Referral code is no longer active");
    }

    if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
      throw new BadRequestException("Referral code has expired");
    }

    if (
      referralCode.maxUsages &&
      referralCode.usageCount >= referralCode.maxUsages
    ) {
      throw new BadRequestException(
        "Referral code has reached maximum usage limit",
      );
    }

    // Cannot use own referral code
    if (referralCode.userId === userId) {
      throw new BadRequestException("You cannot use your own referral code");
    }

    // Check if user already used a referral code
    const existingUsage = await this.prisma.referralUsage.findFirst({
      where: { referredUserId: userId },
    });

    if (existingUsage) {
      throw new ConflictException("You have already used a referral code");
    }

    // Create referral usage in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create usage record
      const usage = await tx.referralUsage.create({
        data: {
          referralCodeId: referralCode.id,
          referrerId: referralCode.userId,
          referredUserId: userId,
          status: "PENDING",
          requiredAction: "COMPLETE_FIRST_TRANSACTION",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days to complete
        },
      });

      // Increment usage count
      await tx.referralCode.update({
        where: { id: referralCode.id },
        data: { usageCount: { increment: 1 } },
      });

      return usage;
    });

    this.logger.log(
      `User ${userId} applied referral code ${code} from user ${referralCode.userId}`,
    );

    return {
      message: "Referral code applied successfully",
      referrer: referralCode.user.username,
      status: "PENDING",
      requiredAction: "Complete your first transaction to activate rewards",
      expiresAt: result.expiresAt,
    };
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get referral statistics" })
  @ApiResponse({ status: 200, description: "Returns referral statistics" })
  async getReferralStats(@CurrentUser("id") userId: string) {
    const [referralCode, usages, rewards] = await Promise.all([
      this.prisma.referralCode.findUnique({
        where: { userId },
      }),
      this.prisma.referralUsage.findMany({
        where: { referrerId: userId },
        include: {
          referredUser: {
            select: { id: true, username: true, createdAt: true },
          },
        },
        orderBy: { usedAt: "desc" },
      }),
      this.prisma.referralReward.aggregate({
        where: { userId, status: "CLAIMED" },
        _sum: { amountMinor: true },
        _count: true,
      }),
    ]);

    const pendingCount = usages.filter((u) => u.status === "PENDING").length;
    const activeCount = usages.filter((u) => u.status === "ACTIVE").length;

    return {
      code: referralCode?.code || null,
      totalReferrals: usages.length,
      pendingReferrals: pendingCount,
      activeReferrals: activeCount,
      totalRewardsEarned: Number(rewards._sum.amountMinor || 0n) / 100,
      totalRewardsClaimed: rewards._count,
      referrals: usages.map((u) => ({
        id: u.id,
        user: u.referredUser.username,
        status: u.status,
        usedAt: u.usedAt,
        completedAt: u.completedAt,
      })),
    };
  }

  @Get("rewards")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get referral rewards" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({ status: 200, description: "Returns referral rewards" })
  async getReferralRewards(
    @CurrentUser("id") userId: string,
    @Query("status") status?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (status) {
      where.status = status.toUpperCase();
    }

    const [rewards, total] = await Promise.all([
      this.prisma.referralReward.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          referralUsage: {
            include: {
              referredUser: { select: { username: true } },
            },
          },
        },
      }),
      this.prisma.referralReward.count({ where }),
    ]);

    return {
      data: rewards.map((r) => ({
        id: r.id,
        amount: Number(r.amountMinor) / 100,
        rewardType: r.rewardType,
        status: r.status,
        referredUser: r.referralUsage.referredUser.username,
        createdAt: r.createdAt,
        processedAt: r.processedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Post("rewards/:id/claim")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Claim a referral reward" })
  @ApiResponse({ status: 200, description: "Reward claimed successfully" })
  async claimReward(
    @CurrentUser("id") userId: string,
    @Param("id") rewardId: string,
  ) {
    const reward = await this.prisma.referralReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException("Reward not found");
    }

    if (reward.userId !== userId) {
      throw new BadRequestException("This reward does not belong to you");
    }

    if (reward.status !== "PENDING") {
      throw new BadRequestException(
        "Reward has already been claimed or processed",
      );
    }

    if (reward.expiresAt && new Date() > reward.expiresAt) {
      throw new BadRequestException("Reward has expired");
    }

    // Claim reward in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update reward status
      await tx.referralReward.update({
        where: { id: rewardId },
        data: {
          status: "CLAIMED",
          processedAt: new Date(),
        },
      });

      // Credit user wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          balanceMinor: { increment: reward.amountMinor },
        },
      });
    });

    this.logger.log(`User ${userId} claimed referral reward ${rewardId}`);

    return {
      message: "Reward claimed successfully",
      amount: Number(reward.amountMinor) / 100,
    };
  }

  @Get("validate/:code")
  @ApiOperation({ summary: "Validate a referral code (public)" })
  @ApiResponse({ status: 200, description: "Returns referral code validity" })
  async validateCode(@Param("code") code: string) {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: { user: { select: { username: true, reputationScore: true } } },
    });

    if (!referralCode) {
      return { valid: false, message: "Referral code not found" };
    }

    if (!referralCode.isActive) {
      return { valid: false, message: "Referral code is no longer active" };
    }

    if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
      return { valid: false, message: "Referral code has expired" };
    }

    if (
      referralCode.maxUsages &&
      referralCode.usageCount >= referralCode.maxUsages
    ) {
      return {
        valid: false,
        message: "Referral code has reached maximum usage limit",
      };
    }

    return {
      valid: true,
      referrer: referralCode.user.username,
      referrerReputation: referralCode.user.reputationScore,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateReferralCode(): string {
    // Generate 8 character alphanumeric code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    const randomBytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    return code;
  }
}

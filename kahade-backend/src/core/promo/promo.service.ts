import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma, VoucherStatus, VoucherType, PromoTargetType } from '@prisma/client';

// ============================================================================
// PROMO & VOUCHER SERVICE - Production Ready
// Implements: Voucher validation, usage tracking, expiry management
// ============================================================================

export interface CreatePromoDto {
  code: string;
  name: string;
  description?: string;
  targetType: PromoTargetType;
  discountType: VoucherType;
  discountValue?: number;
  discountPercent?: number;
  maxDiscountMinor?: number;
  maxTotalUsages?: number;
  maxUsagePerUser?: number;
  minPurchaseMinor?: number;
  applicableCategories?: string[];
  validFrom: Date;
  validUntil: Date;
}

export interface CreateVoucherDto {
  promoId?: string;
  code: string;
  voucherType: VoucherType;
  discountMinor?: number;
  discountPercent?: number;
  maxDiscountMinor?: number;
  maxUsages?: number;
  minPurchaseMinor?: number;
  applicableCategories?: string[];
  validFrom: Date;
  validUntil: Date;
  assignedToUserId?: string;
}

export interface ApplyVoucherResult {
  voucherId: string;
  code: string;
  discountMinor: bigint;
  originalMinor: bigint;
  finalMinor: bigint;
}

@Injectable()
export class PromoService {
  private readonly logger = new Logger(PromoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // PROMO MANAGEMENT (Admin)
  // ============================================================================

  async createPromo(dto: CreatePromoDto) {
    // Check for duplicate code
    const existing = await this.prisma.promo.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException('Promo code already exists');
    }

    const promo = await this.prisma.promo.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        targetType: dto.targetType,
        discountType: dto.discountType,
        discountValue: dto.discountValue ? BigInt(dto.discountValue) : null,
        discountPercent: dto.discountPercent,
        maxDiscountMinor: dto.maxDiscountMinor ? BigInt(dto.maxDiscountMinor) : null,
        maxTotalUsages: dto.maxTotalUsages,
        maxUsagePerUser: dto.maxUsagePerUser || 1,
        minPurchaseMinor: dto.minPurchaseMinor ? BigInt(dto.minPurchaseMinor) : null,
        applicableCategories: dto.applicableCategories,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil,
        isActive: true,
      },
    });

    this.logger.log(`Created promo: ${promo.code}`);
    return promo;
  }

  async listPromos(options: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { isActive, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.PromoWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [promos, total] = await Promise.all([
      this.prisma.promo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.promo.count({ where }),
    ]);

    return {
      data: promos.map(p => ({
        ...p,
        discountValue: p.discountValue?.toString(),
        maxDiscountMinor: p.maxDiscountMinor?.toString(),
        minPurchaseMinor: p.minPurchaseMinor?.toString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getPromo(id: string) {
    const promo = await this.prisma.promo.findUnique({
      where: { id },
      include: {
        vouchers: true,
        assignments: {
          include: { user: { select: { id: true, username: true, email: true } } },
        },
      },
    });

    if (!promo) {
      throw new NotFoundException('Promo not found');
    }

    return promo;
  }

  async updatePromo(id: string, dto: Partial<CreatePromoDto>) {
    const promo = await this.prisma.promo.findUnique({ where: { id } });
    if (!promo) {
      throw new NotFoundException('Promo not found');
    }

    return this.prisma.promo.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        discountValue: dto.discountValue ? BigInt(dto.discountValue) : undefined,
        discountPercent: dto.discountPercent,
        maxDiscountMinor: dto.maxDiscountMinor ? BigInt(dto.maxDiscountMinor) : undefined,
        maxTotalUsages: dto.maxTotalUsages,
        maxUsagePerUser: dto.maxUsagePerUser,
        minPurchaseMinor: dto.minPurchaseMinor ? BigInt(dto.minPurchaseMinor) : undefined,
        applicableCategories: dto.applicableCategories,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil,
      },
    });
  }

  async deactivatePromo(id: string) {
    return this.prisma.promo.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignPromoToUser(promoId: string, userId: string) {
    const promo = await this.prisma.promo.findUnique({ where: { id: promoId } });
    if (!promo) {
      throw new NotFoundException('Promo not found');
    }

    // Check if already assigned
    const existing = await this.prisma.promoAssignment.findUnique({
      where: { promoId_userId: { promoId, userId } },
    });

    if (existing) {
      throw new ConflictException('Promo already assigned to user');
    }

    return this.prisma.promoAssignment.create({
      data: {
        promoId,
        userId,
        expiresAt: promo.validUntil,
      },
    });
  }

  // ============================================================================
  // VOUCHER MANAGEMENT
  // ============================================================================

  async createVoucher(dto: CreateVoucherDto) {
    // Check for duplicate code
    const existing = await this.prisma.voucher.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException('Voucher code already exists');
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        promoId: dto.promoId,
        code: dto.code.toUpperCase(),
        voucherType: dto.voucherType,
        discountMinor: dto.discountMinor ? BigInt(dto.discountMinor) : null,
        discountPercent: dto.discountPercent,
        maxDiscountMinor: dto.maxDiscountMinor ? BigInt(dto.maxDiscountMinor) : null,
        maxUsages: dto.maxUsages || 1,
        minPurchaseMinor: dto.minPurchaseMinor ? BigInt(dto.minPurchaseMinor) : null,
        applicableCategories: dto.applicableCategories,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil,
        assignedToUserId: dto.assignedToUserId,
        status: VoucherStatus.ACTIVE,
      },
    });

    this.logger.log(`Created voucher: ${voucher.code}`);
    return voucher;
  }

  async listVouchers(options: {
    status?: VoucherStatus;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, userId, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.VoucherWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.OR = [
        { assignedToUserId: userId },
        { assignedToUserId: null }, // Public vouchers
      ];
    }

    const [vouchers, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      data: vouchers.map(v => ({
        ...v,
        discountMinor: v.discountMinor?.toString(),
        maxDiscountMinor: v.maxDiscountMinor?.toString(),
        minPurchaseMinor: v.minPurchaseMinor?.toString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getVoucher(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: {
        promo: true,
        usages: {
          include: { user: { select: { id: true, username: true, email: true } } },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    return voucher;
  }

  async deactivateVoucher(id: string) {
    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.INACTIVE },
    });
  }

  // ============================================================================
  // VOUCHER VALIDATION & APPLICATION
  // ============================================================================

  async validateVoucher(
    code: string,
    userId: string,
    orderAmountMinor: bigint,
    orderCategory?: string,
  ): Promise<{ valid: boolean; voucher?: any; error?: string }> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return { valid: false, error: 'Voucher not found' };
    }

    // Check status
    if (voucher.status !== VoucherStatus.ACTIVE) {
      return { valid: false, error: 'Voucher is not active' };
    }

    // Check validity period
    const now = new Date();
    if (now < voucher.validFrom) {
      return { valid: false, error: 'Voucher is not yet valid' };
    }
    if (now > voucher.validUntil) {
      return { valid: false, error: 'Voucher has expired' };
    }

    // Check usage limit
    if (voucher.currentUsages >= voucher.maxUsages) {
      return { valid: false, error: 'Voucher usage limit reached' };
    }

    // Check if assigned to specific user
    if (voucher.assignedToUserId && voucher.assignedToUserId !== userId) {
      return { valid: false, error: 'Voucher is not available for this user' };
    }

    // Check minimum purchase
    if (voucher.minPurchaseMinor && orderAmountMinor < voucher.minPurchaseMinor) {
      return {
        valid: false,
        error: `Minimum purchase is ${Number(voucher.minPurchaseMinor) / 100}`,
      };
    }

    // Check applicable categories
    if (voucher.applicableCategories && orderCategory) {
      const categories = voucher.applicableCategories as string[];
      if (!categories.includes(orderCategory)) {
        return { valid: false, error: 'Voucher not applicable for this category' };
      }
    }

    // Check user usage count
    const userUsageCount = await this.prisma.voucherUsage.count({
      where: { voucherId: voucher.id, userId },
    });

    // Get max usage per user from promo if linked
    let maxUsagePerUser = 1;
    if (voucher.promoId) {
      const promo = await this.prisma.promo.findUnique({
        where: { id: voucher.promoId },
      });
      if (promo) {
        maxUsagePerUser = promo.maxUsagePerUser;
      }
    }

    if (userUsageCount >= maxUsagePerUser) {
      return { valid: false, error: 'You have already used this voucher' };
    }

    return { valid: true, voucher };
  }

  async applyVoucher(
    code: string,
    userId: string,
    orderAmountMinor: bigint,
    orderId?: string,
    idempotencyKey?: string,
  ): Promise<ApplyVoucherResult> {
    // Check idempotency
    if (idempotencyKey) {
      const existing = await this.prisma.voucherUsage.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return {
          voucherId: existing.voucherId,
          code,
          discountMinor: existing.discountMinor,
          originalMinor: existing.originalMinor,
          finalMinor: existing.finalMinor,
        };
      }
    }

    const validation = await this.validateVoucher(code, userId, orderAmountMinor);
    if (!validation.valid || !validation.voucher) {
      throw new BadRequestException(validation.error || 'Invalid voucher');
    }

    const voucher = validation.voucher;

    // Calculate discount
    let discountMinor: bigint;
    if (voucher.voucherType === VoucherType.PERCENTAGE) {
      const percent = voucher.discountPercent || 0;
      discountMinor = (orderAmountMinor * BigInt(Math.round(percent * 100))) / 10000n;

      // Apply max discount cap
      if (voucher.maxDiscountMinor && discountMinor > voucher.maxDiscountMinor) {
        discountMinor = voucher.maxDiscountMinor;
      }
    } else {
      discountMinor = voucher.discountMinor || 0n;
    }

    // Ensure discount doesn't exceed order amount
    if (discountMinor > orderAmountMinor) {
      discountMinor = orderAmountMinor;
    }

    const finalMinor = orderAmountMinor - discountMinor;

    // Record usage in transaction
    await this.prisma.$transaction(async (tx) => {
      // Create usage record
      await tx.voucherUsage.create({
        data: {
          voucherId: voucher.id,
          userId,
          orderId,
          originalMinor: orderAmountMinor,
          discountMinor,
          finalMinor,
          idempotencyKey,
        },
      });

      // Increment usage count
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { currentUsages: { increment: 1 } },
      });

      // Update promo usage if linked
      if (voucher.promoId) {
        await tx.promo.update({
          where: { id: voucher.promoId },
          data: { currentUsages: { increment: 1 } },
        });
      }
    });

    this.logger.log(
      `Applied voucher ${code} for user ${userId}, discount: ${discountMinor}`,
    );

    return {
      voucherId: voucher.id,
      code: voucher.code,
      discountMinor,
      originalMinor: orderAmountMinor,
      finalMinor,
    };
  }

  // ============================================================================
  // USER-FACING ENDPOINTS
  // ============================================================================

  async getAvailableVouchersForUser(userId: string) {
    const now = new Date();

    const vouchers = await this.prisma.voucher.findMany({
      where: {
        status: VoucherStatus.ACTIVE,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { assignedToUserId: userId },
          { assignedToUserId: null },
        ],
      },
      orderBy: { validUntil: 'asc' },
    });

    // Filter out vouchers user has already used to max
    const result = [];
    for (const voucher of vouchers) {
      const userUsageCount = await this.prisma.voucherUsage.count({
        where: { voucherId: voucher.id, userId },
      });

      let maxUsagePerUser = 1;
      if (voucher.promoId) {
        const promo = await this.prisma.promo.findUnique({
          where: { id: voucher.promoId },
        });
        if (promo) {
          maxUsagePerUser = promo.maxUsagePerUser;
        }
      }

      if (userUsageCount < maxUsagePerUser && voucher.currentUsages < voucher.maxUsages) {
        result.push({
          ...voucher,
          discountMinor: voucher.discountMinor?.toString(),
          maxDiscountMinor: voucher.maxDiscountMinor?.toString(),
          minPurchaseMinor: voucher.minPurchaseMinor?.toString(),
          remainingUsages: voucher.maxUsages - voucher.currentUsages,
          userRemainingUsages: maxUsagePerUser - userUsageCount,
        });
      }
    }

    return result;
  }

  async getUserVoucherHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      this.prisma.voucherUsage.findMany({
        where: { userId },
        include: { voucher: true },
        orderBy: { usedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voucherUsage.count({ where: { userId } }),
    ]);

    return {
      data: usages.map(u => ({
        ...u,
        originalMinor: u.originalMinor.toString(),
        discountMinor: u.discountMinor.toString(),
        finalMinor: u.finalMinor.toString(),
      })),
      total,
      page,
      limit,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { EscrowHold, EscrowStatus, Currency } from '@common/shims/prisma-types.shim';

export interface CreateEscrowData {
  orderId: string;
  buyerUserId: string;
  sellerUserId?: string;
  amountMinor: bigint;
  currency?: Currency;
  timeoutHours: number;
}

export interface EscrowFilterOptions {
  userId: string;
  status?: EscrowStatus;
  role?: 'as_buyer' | 'as_seller';
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedEscrows {
  data: EscrowHold[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class EscrowRepository {
  private readonly logger = new Logger(EscrowRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new escrow hold
   */
  async create(data: CreateEscrowData, tx?: Prisma.TransactionClient): Promise<EscrowHold> {
    const prisma = tx ?? this.prisma;
    const timeoutAt = new Date(Date.now() + data.timeoutHours * 60 * 60 * 1000);

    const escrow = await prisma.escrowHold.create({
      data: {
        orderId: data.orderId,
        buyerUserId: data.buyerUserId,
        sellerUserId: data.sellerUserId,
        amountMinor: data.amountMinor,
        currency: data.currency || Currency.IDR,
        status: EscrowStatus.ACTIVE,
        timeoutAt,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            title: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    this.logger.log(`Created escrow ${escrow.id} for order ${data.orderId}`);
    return escrow;
  }

  /**
   * Find escrow by ID
   */
  async findById(id: string, tx?: Prisma.TransactionClient): Promise<EscrowHold | null> {
    const prisma = tx ?? this.prisma;
    
    return prisma.escrowHold.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            title: true,
            status: true,
            initiatorId: true,
            counterpartyId: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find escrow by order ID
   */
  async findByOrderId(orderId: string): Promise<EscrowHold | null> {
    return this.prisma.escrowHold.findUnique({
      where: { orderId },
      include: {
        order: true,
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Find escrows with filters and pagination
   */
  async findMany(options: EscrowFilterOptions): Promise<PaginatedEscrows> {
    const { userId, status, role, dateFrom, dateTo, page, limit, sortBy, sortOrder } = options;

    const where: Prisma.EscrowHoldWhereInput = {
      OR: [
        { buyerUserId: userId },
        { sellerUserId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (role === 'as_buyer') {
      where.buyerUserId = userId;
      delete where.OR;
    } else if (role === 'as_seller') {
      where.sellerUserId = userId;
      delete where.OR;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const total = await this.prisma.escrowHold.count({ where });

    const data = await this.prisma.escrowHold.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            title: true,
            status: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update escrow status
   */
  async updateStatus(
    id: string,
    status: EscrowStatus,
    additionalData?: Partial<EscrowHold>,
    tx?: Prisma.TransactionClient,
  ): Promise<EscrowHold> {
    const prisma = tx ?? this.prisma;

    const updateData: Prisma.EscrowHoldUpdateInput = {
      status,
      ...additionalData,
    };

    // Set timestamp based on status
    switch (status) {
      case EscrowStatus.RELEASED:
        updateData.releasedAt = new Date();
        break;
      case EscrowStatus.REFUNDED:
        updateData.refundedAt = new Date();
        break;
      case EscrowStatus.DISPUTED:
        updateData.disputedAt = new Date();
        break;
    }

    return prisma.escrowHold.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            title: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Extend escrow timeout
   */
  async extendTimeout(id: string, additionalHours: number, tx?: Prisma.TransactionClient): Promise<EscrowHold> {
    const prisma = tx ?? this.prisma;

    const escrow = await prisma.escrowHold.findUnique({ where: { id } });
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    const currentTimeout = escrow.timeoutAt || new Date();
    const newTimeout = new Date(currentTimeout.getTime() + additionalHours * 60 * 60 * 1000);

    return prisma.escrowHold.update({
      where: { id },
      data: {
        timeoutAt: newTimeout,
        extensionCount: { increment: 1 },
      },
    });
  }

  /**
   * Find escrows pending timeout
   */
  async findPendingTimeout(): Promise<EscrowHold[]> {
    return this.prisma.escrowHold.findMany({
      where: {
        status: EscrowStatus.ACTIVE,
        timeoutAt: {
          lte: new Date(),
        },
      },
      include: {
        order: true,
        buyer: true,
        seller: true,
      },
    });
  }

  /**
   * Get escrow statistics for user
   */
  async getStats(userId: string): Promise<{
    totalActive: number;
    totalCompleted: number;
    totalDisputed: number;
    totalAmountHeld: bigint;
    totalAmountReleased: bigint;
  }> {
    const [activeCount, completedCount, disputedCount, activeSum, releasedSum] = await Promise.all([
      this.prisma.escrowHold.count({
        where: {
          OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
          status: EscrowStatus.ACTIVE,
        },
      }),
      this.prisma.escrowHold.count({
        where: {
          OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
          status: EscrowStatus.RELEASED,
        },
      }),
      this.prisma.escrowHold.count({
        where: {
          OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
          status: EscrowStatus.DISPUTED,
        },
      }),
      this.prisma.escrowHold.aggregate({
        where: {
          OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
          status: EscrowStatus.ACTIVE,
        },
        _sum: { amountMinor: true },
      }),
      this.prisma.escrowHold.aggregate({
        where: {
          OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
          status: EscrowStatus.RELEASED,
        },
        _sum: { amountMinor: true },
      }),
    ]);

    return {
      totalActive: activeCount,
      totalCompleted: completedCount,
      totalDisputed: disputedCount,
      totalAmountHeld: activeSum._sum.amountMinor || 0n,
      totalAmountReleased: releasedSum._sum.amountMinor || 0n,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  Order,
  OrderStatus,
  InitiatorRole,
  OrderCategory,
  FeePayer,
  Currency,
} from '@prisma/client';

export interface CreateOrderData {
  initiatorId: string;
  initiatorRole: InitiatorRole;
  title: string;
  description: string;
  category: OrderCategory;
  amountMinor: bigint;
  feePayer: FeePayer;
  platformFeeMinor: bigint;
  holdingPeriodDays: number;
  customTerms?: string;
  inviteToken: string;
  inviteExpiresAt: Date;
  counterpartyId?: string;
}

export interface OrderFilterOptions {
  userId: string;
  status?: OrderStatus;
  role?: 'as_buyer' | 'as_seller';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: bigint;
  maxAmount?: bigint;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${dateStr}-${random}`;
  }

  async create(data: CreateOrderData, tx?: Prisma.TransactionClient): Promise<Order> {
    const prisma = tx ?? this.prisma;
    const order = await prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        initiatorId: data.initiatorId,
        initiatorRole: data.initiatorRole,
        title: data.title,
        description: data.description,
        category: data.category,
        currency: Currency.IDR,
        amountMinor: data.amountMinor,
        feePayer: data.feePayer,
        platformFeeMinor: data.platformFeeMinor,
        holdingPeriodDays: data.holdingPeriodDays,
        customTerms: data.customTerms,
        status: OrderStatus.WAITING_COUNTERPARTY,
        inviteToken: data.inviteToken,
        inviteExpiresAt: data.inviteExpiresAt,
        counterpartyId: data.counterpartyId,
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
      },
    });
    this.logger.log(`Created order ${order.orderNumber} by user ${data.initiatorId}`);
    return order;
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Order | null> {
    const prisma = tx ?? this.prisma;
    return prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        escrowHold: true,
        dispute: true,
        ratings: true,
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { orderNumber, deletedAt: null },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        escrowHold: true,
      },
    });
  }

  async findByInviteToken(inviteToken: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { inviteToken, deletedAt: null },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
      },
    });
  }

  async findMany(options: OrderFilterOptions): Promise<PaginatedOrders> {
    const {
      userId,
      status,
      role,
      search,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page,
      limit,
      sortBy,
      sortOrder,
    } = options;
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      OR: [{ initiatorId: userId }, { counterpartyId: userId }],
    };
    if (status) where.status = status;
    if (search)
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { orderNumber: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }
    if (minAmount || maxAmount) {
      where.amountMinor = {};
      if (minAmount) where.amountMinor.gte = minAmount;
      if (maxAmount) where.amountMinor.lte = maxAmount;
    }
    const total = await this.prisma.order.count({ where });
    const data = await this.prisma.order.findMany({
      where,
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        escrowHold: { select: { id: true, status: true, amountMinor: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Partial<Order>, tx?: Prisma.TransactionClient): Promise<Order> {
    const prisma = tx ?? this.prisma;
    return prisma.order.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        escrowHold: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    additionalData?: Partial<Order>,
    tx?: Prisma.TransactionClient,
  ): Promise<Order> {
    const prisma = tx ?? this.prisma;
    const updateData: Prisma.OrderUpdateInput = { status, ...additionalData };
    switch (status) {
      case OrderStatus.ACCEPTED:
        updateData.acceptedAt = new Date();
        break;
      case OrderStatus.PAID:
        updateData.paidAt = new Date();
        break;
      case OrderStatus.COMPLETED:
        updateData.completedAt = new Date();
        break;
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        updateData.cancelledAt = new Date();
        break;
    }
    return prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            totalTransactions: true,
          },
        },
        escrowHold: true,
      },
    });
  }

  async softDelete(id: string, deletedByUserId: string): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date(), deletedByUserId },
    });
  }

  async findPendingAutoRelease(): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.PAID, autoReleaseAt: { lte: new Date() }, deletedAt: null },
      include: { escrowHold: true, initiator: true, counterparty: true },
    });
  }

  async findExpiredInvites(): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.WAITING_COUNTERPARTY,
        inviteExpiresAt: { lte: new Date() },
        deletedAt: null,
      },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.order.count({
      where: {
        OR: [{ initiatorId: userId }, { counterpartyId: userId }],
        status: OrderStatus.COMPLETED,
        deletedAt: null,
      },
    });
  }
}

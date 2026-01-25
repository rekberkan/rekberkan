import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Transaction } from '../../common/shims/prisma-types.shim';

interface CreateTransactionData {
  orderNumber: string;
  initiatorId: string;
  initiatorRole: string;
  counterpartyId?: string | null;
  title: string;
  description: string;
  category: string;
  amountMinor: bigint;
  feePayer: string;
  platformFeeMinor: bigint;
  holdingPeriodDays: number;
  status: string;
  inviteToken: string;
  inviteExpiresAt: Date;
  terms?: string | null;
}

interface UpdateTransactionData {
  status?: string;
  counterpartyId?: string;
  acceptedAt?: Date;
  paidAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  deliveredAt?: Date;
  autoReleaseAt?: Date;
  disputeReason?: string;
  disputeDescription?: string;
  disputedAt?: Date;
  disputedBy?: string;
}

interface FindByUserOptions {
  status?: string;
  role?: string;
}

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTransactionData): Promise<Transaction> {
    return (this.prisma as any).order.create({
      data: {
        orderNumber: data.orderNumber,
        initiatorId: data.initiatorId,
        initiatorRole: data.initiatorRole,
        counterpartyId: data.counterpartyId,
        title: data.title,
        description: data.description,
        category: data.category,
        amountMinor: data.amountMinor,
        feePayer: data.feePayer,
        platformFeeMinor: data.platformFeeMinor,
        holdingPeriodDays: data.holdingPeriodDays,
        status: data.status,
        inviteToken: data.inviteToken,
        inviteExpiresAt: data.inviteExpiresAt,
        customTerms: data.terms,
      },
      include: {
        initiator: { select: { id: true, name: true, email: true, username: true } },
        counterparty: { select: { id: true, name: true, email: true, username: true } },
      },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return (this.prisma as any).order.findUnique({
      where: { id },
      include: {
        initiator: { select: { id: true, name: true, email: true, username: true } },
        counterparty: { select: { id: true, name: true, email: true, username: true } },
        escrowHold: true,
        deliveryProof: true,
        dispute: true,
        ratings: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Transaction | null> {
    return (this.prisma as any).order.findUnique({
      where: { orderNumber },
      include: {
        initiator: { select: { id: true, name: true, email: true, username: true } },
        counterparty: { select: { id: true, name: true, email: true, username: true } },
      },
    });
  }

  async findByInviteToken(inviteToken: string): Promise<Transaction | null> {
    return (this.prisma as any).order.findFirst({
      where: { 
        inviteToken,
        inviteExpiresAt: { gt: new Date() },
      },
      include: {
        initiator: { select: { id: true, name: true, email: true, username: true } },
        counterparty: { select: { id: true, name: true, email: true, username: true } },
      },
    });
  }

  async findByUser(
    userId: string,
    skip: number,
    take: number,
    options?: FindByUserOptions,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const where: any = {
      OR: [{ initiatorId: userId }, { counterpartyId: userId }],
      deletedAt: null,
    };

    // Filter by status
    if (options?.status) {
      where.status = options.status.toUpperCase();
    }

    // Filter by role
    if (options?.role) {
      if (options.role === 'buyer') {
        where.OR = [
          { initiatorId: userId, initiatorRole: 'BUYER' },
          { counterpartyId: userId, initiatorRole: 'SELLER' },
        ];
      } else if (options.role === 'seller') {
        where.OR = [
          { initiatorId: userId, initiatorRole: 'SELLER' },
          { counterpartyId: userId, initiatorRole: 'BUYER' },
        ];
      }
    }

    const [transactions, total] = await Promise.all([
      (this.prisma as any).order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          initiator: { select: { id: true, name: true, email: true, username: true } },
          counterparty: { select: { id: true, name: true, email: true, username: true } },
        },
      }),
      (this.prisma as any).order.count({ where }),
    ]);

    return { transactions, total };
  }

  async update(id: string, data: UpdateTransactionData): Promise<Transaction> {
    return (this.prisma as any).order.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        initiator: { select: { id: true, name: true, email: true, username: true } },
        counterparty: { select: { id: true, name: true, email: true, username: true } },
      },
    });
  }

  async softDelete(id: string, deletedByUserId: string): Promise<Transaction> {
    return (this.prisma as any).order.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedByUserId,
      },
    });
  }

  async findAll(
    skip: number,
    take: number,
    options?: { status?: string },
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const where: any = { deletedAt: null };
    
    if (options?.status) {
      where.status = options.status.toUpperCase();
    }

    const [transactions, total] = await Promise.all([
      (this.prisma as any).order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          initiator: { select: { id: true, name: true, email: true, username: true } },
          counterparty: { select: { id: true, name: true, email: true, username: true } },
        },
      }),
      (this.prisma as any).order.count({ where }),
    ]);

    return { transactions, total };
  }

  async countByStatus(): Promise<Record<string, number>> {
    const results = await (this.prisma as any).order.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { deletedAt: null },
    });

    return results.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});
  }

  async findPendingAutoRelease(): Promise<Transaction[]> {
    return (this.prisma as any).order.findMany({
      where: {
        status: 'PAID',
        autoReleaseAt: { lte: new Date() },
        deletedAt: null,
      },
      include: {
        initiator: { select: { id: true, name: true, email: true } },
        counterparty: { select: { id: true, name: true, email: true } },
        escrowHold: true,
      },
    });
  }
}

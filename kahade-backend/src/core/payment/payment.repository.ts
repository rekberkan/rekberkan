import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { Payment, PaymentStatus, PaymentMethod, Currency } from '@common/shims/prisma-types.shim';

export interface CreatePaymentData {
  userId: string;
  amountMinor: bigint;
  feeMinor: bigint;
  method: PaymentMethod;
  currency?: Currency;
  externalId?: string;
  paymentUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentFilterOptions {
  userId: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate unique payment reference
   */
  private generatePaymentReference(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `PAY-${dateStr}-${random}`;
  }

  /**
   * Create a new payment
   */
  async create(data: CreatePaymentData, tx?: Prisma.TransactionClient): Promise<Payment> {
    const prisma = tx ?? this.prisma;

    const payment = await prisma.payment.create({
      data: {
        reference: this.generatePaymentReference(),
        userId: data.userId,
        amountMinor: data.amountMinor,
        feeMinor: data.feeMinor,
        totalMinor: data.amountMinor + data.feeMinor,
        currency: data.currency || Currency.IDR,
        method: data.method,
        status: PaymentStatus.PENDING,
        externalId: data.externalId,
        paymentUrl: data.paymentUrl,
        expiresAt: data.expiresAt,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Created payment ${payment.reference} for user ${data.userId}`);
    return payment;
  }

  /**
   * Find payment by ID
   */
  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Payment | null> {
    const prisma = tx ?? this.prisma;

    return prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
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
   * Find payment by reference
   */
  async findByReference(reference: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { reference },
      include: {
        user: {
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
   * Find payment by external ID
   */
  async findByExternalId(externalId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { externalId },
      include: {
        user: {
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
   * Find payments with filters and pagination
   */
  async findMany(options: PaymentFilterOptions): Promise<PaginatedPayments> {
    const { userId, status, method, dateFrom, dateTo, page, limit, sortBy, sortOrder } = options;

    const where: Prisma.PaymentWhereInput = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const total = await this.prisma.payment.count({ where });

    const data = await this.prisma.payment.findMany({
      where,
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
   * Update payment status
   */
  async updateStatus(
    id: string,
    status: PaymentStatus,
    additionalData?: Partial<Payment>,
    tx?: Prisma.TransactionClient,
  ): Promise<Payment> {
    const prisma = tx ?? this.prisma;

    const updateData: Prisma.PaymentUpdateInput = {
      status,
      ...additionalData,
    };

    // Set timestamp based on status
    switch (status) {
      case PaymentStatus.COMPLETED:
        updateData.paidAt = new Date();
        break;
      case PaymentStatus.FAILED:
        updateData.failedAt = new Date();
        break;
      case PaymentStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        break;
      case PaymentStatus.EXPIRED:
        updateData.expiredAt = new Date();
        break;
    }

    return prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
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
   * Find pending payments that have expired
   */
  async findExpiredPayments(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        expiresAt: {
          lte: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get payment statistics for user
   */
  async getStats(userId: string): Promise<{
    totalPayments: number;
    totalCompleted: number;
    totalPending: number;
    totalAmountPaid: bigint;
    totalFeesPaid: bigint;
  }> {
    const [totalPayments, totalCompleted, totalPending, completedSum] = await Promise.all([
      this.prisma.payment.count({ where: { userId } }),
      this.prisma.payment.count({ where: { userId, status: PaymentStatus.COMPLETED } }),
      this.prisma.payment.count({ where: { userId, status: PaymentStatus.PENDING } }),
      this.prisma.payment.aggregate({
        where: { userId, status: PaymentStatus.COMPLETED },
        _sum: {
          amountMinor: true,
          feeMinor: true,
        },
      }),
    ]);

    return {
      totalPayments,
      totalCompleted,
      totalPending,
      totalAmountPaid: completedSum._sum.amountMinor || 0n,
      totalFeesPaid: completedSum._sum.feeMinor || 0n,
    };
  }
}

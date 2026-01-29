import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@infrastructure/database/prisma.service";
import {
  Prisma,
  Payment,
  PaymentStatus,
  PaymentMethod,
  Currency,
  PaymentType,
  PaymentProvider,
} from "@prisma/client";

export interface CreatePaymentData {
  userId: string;
  amountMinor: bigint;
  paymentType: PaymentType;
  paymentMethod?: PaymentMethod;
  currency?: Currency;
  provider?: PaymentProvider;
  providerInvoiceId?: string;
  orderId?: string;
  expiresAt?: Date;
  paymentDetails?: Record<string, any>;
}

export interface PaymentFilterOptions {
  userId: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
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
   * Create a new payment
   */
  async create(
    data: CreatePaymentData,
    tx?: Prisma.TransactionClient,
  ): Promise<Payment> {
    const prisma = tx ?? this.prisma;

    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        amountMinor: data.amountMinor,
        currency: data.currency || Currency.IDR,
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        provider: data.provider || PaymentProvider.XENDIT,
        providerInvoiceId: data.providerInvoiceId,
        status: PaymentStatus.PENDING,
        orderId: data.orderId,
        expiresAt: data.expiresAt,
        paymentDetails: data.paymentDetails ?? undefined,
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

    this.logger.log(`Created payment ${payment.id} for user ${data.userId}`);
    return payment;
  }

  /**
   * Find payment by ID
   */
  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Payment | null> {
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
   * Find payment by provider invoice ID
   */
  async findByProviderInvoiceId(
    providerInvoiceId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { providerInvoiceId },
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
    const {
      userId,
      status,
      paymentMethod,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder,
    } = options;

    const where: Prisma.PaymentWhereInput = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
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
    };

    // Set timestamp based on status
    if (status === "SUCCESS") {
      updateData.paidAt = new Date();
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
  }> {
    const [totalPayments, totalCompleted, totalPending, completedSum] =
      await Promise.all([
        this.prisma.payment.count({ where: { userId } }),
        this.prisma.payment.count({
          where: { userId, status: PaymentStatus.SUCCESS },
        }),
        this.prisma.payment.count({
          where: { userId, status: PaymentStatus.PENDING },
        }),
        this.prisma.payment.aggregate({
          where: { userId, status: PaymentStatus.SUCCESS },
          _sum: {
            amountMinor: true,
          },
        }),
      ]);

    return {
      totalPayments,
      totalCompleted,
      totalPending,
      totalAmountPaid: completedSum._sum?.amountMinor || 0n,
    };
  }
}

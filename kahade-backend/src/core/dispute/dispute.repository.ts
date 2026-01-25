import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Dispute, DisputeStatus, DisputeDecision } from '@prisma/client';

// ============================================================================
// BANK-GRADE DISPUTE REPOSITORY
// Implements: Proper Relations, Status Tracking, Audit Trail
// ============================================================================

export interface ICreateDispute {
  orderId: string;
  openedBy: string;
  reason: string;
  responseDeadline?: Date;
}

export interface IUpdateDispute {
  status?: DisputeStatus;
  arbitratorId?: string;
  decision?: DisputeDecision;
  sellerAmountMinor?: bigint;
  buyerRefundMinor?: bigint;
  adminNotes?: string;
  resolutionNotes?: string;
  escalatedAt?: Date;
  escalatedTo?: string;
  decidedAt?: Date;
  canAppeal?: boolean;
  appealDeadline?: Date;
  appealCount?: number;
}

@Injectable()
export class DisputeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateDispute): Promise<Dispute> {
    return this.prisma.dispute.create({
      data: {
        orderId: data.orderId,
        openedBy: data.openedBy,
        reason: data.reason,
        responseDeadline: data.responseDeadline,
        status: DisputeStatus.OPEN,
      },
      include: {
        opener: { select: { id: true, username: true, email: true } },
        order: {
          include: {
            initiator: { select: { id: true, username: true, email: true } },
            counterparty: { select: { id: true, username: true, email: true } },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Dispute | null> {
    return this.prisma.dispute.findUnique({
      where: { id },
      include: {
        opener: { select: { id: true, username: true, email: true } },
        arbitrator: { select: { id: true, username: true, email: true } },
        order: {
          include: {
            initiator: { select: { id: true, username: true, email: true } },
            counterparty: { select: { id: true, username: true, email: true } },
          },
        },
        evidences: {
          include: {
            submitter: { select: { id: true, username: true } },
          },
          orderBy: { submittedAt: 'desc' },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Dispute | null> {
    return this.prisma.dispute.findUnique({
      where: { orderId },
      include: {
        opener: { select: { id: true, username: true, email: true } },
        arbitrator: { select: { id: true, username: true, email: true } },
        order: true,
        evidences: true,
      },
    });
  }

  async findAll(skip: number, take: number): Promise<{ disputes: Dispute[]; total: number }> {
    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        skip,
        take,
        orderBy: { openedAt: 'desc' },
        include: {
          opener: { select: { id: true, username: true, email: true } },
          order: {
            select: {
              id: true,
              amountMinor: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.dispute.count(),
    ]);

    return { disputes, total };
  }

  async findByStatus(status: DisputeStatus, skip: number, take: number): Promise<{ disputes: Dispute[]; total: number }> {
    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where: { status },
        skip,
        take,
        orderBy: { openedAt: 'desc' },
        include: {
          opener: { select: { id: true, username: true, email: true } },
          order: true,
        },
      }),
      this.prisma.dispute.count({ where: { status } }),
    ]);

    return { disputes, total };
  }

  async findByUser(userId: string, skip: number, take: number): Promise<{ disputes: Dispute[]; total: number }> {
    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where: { openedBy: userId },
        skip,
        take,
        orderBy: { openedAt: 'desc' },
        include: {
          opener: { select: { id: true, username: true, email: true } },
          order: true,
        },
      }),
      this.prisma.dispute.count({ where: { openedBy: userId } }),
    ]);

    return { disputes, total };
  }

  async findPendingResponse(): Promise<Dispute[]> {
    return this.prisma.dispute.findMany({
      where: {
        status: DisputeStatus.OPEN,
        responseDeadline: {
          lte: new Date(),
        },
      },
      include: {
        opener: { select: { id: true, username: true, email: true } },
        order: true,
      },
    });
  }

  async findExpiredAppeals(): Promise<Dispute[]> {
    return this.prisma.dispute.findMany({
      where: {
        status: DisputeStatus.DECIDED,
        canAppeal: true,
        appealDeadline: {
          lte: new Date(),
        },
      },
    });
  }

  async update(id: string, data: IUpdateDispute): Promise<Dispute> {
    return this.prisma.dispute.update({
      where: { id },
      data,
      include: {
        opener: { select: { id: true, username: true, email: true } },
        arbitrator: { select: { id: true, username: true, email: true } },
        order: true,
      },
    });
  }

  async assignArbitrator(id: string, arbitratorId: string): Promise<Dispute> {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        arbitratorId,
        status: DisputeStatus.UNDER_ARBITRATION,
      },
    });
  }

  async escalate(id: string, escalatedTo: string): Promise<Dispute> {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatus.ESCALATED,
        escalatedAt: new Date(),
        escalatedTo,
      },
    });
  }

  async closeAppealWindow(id: string): Promise<Dispute> {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        canAppeal: false,
        status: DisputeStatus.CLOSED,
      },
    });
  }

  async delete(id: string): Promise<Dispute> {
    return this.prisma.dispute.delete({
      where: { id },
    });
  }

  async count(where?: { status?: DisputeStatus }): Promise<number> {
    return this.prisma.dispute.count({ where });
  }
}

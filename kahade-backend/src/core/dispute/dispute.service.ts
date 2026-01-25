import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { DisputeRepository } from './dispute.repository';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PaginationUtil, PaginationParams } from '@common/utils/pagination.util';
import { Dispute, DisputeStatus, DisputeDecision, OrderStatus } from '@common/shims/prisma-types.shim';

// ============================================================================
// BANK-GRADE DISPUTE SERVICE
// Implements: Proper State Machine, Evidence Handling, Resolution Flow
// ============================================================================

export interface CreateDisputeDto {
  orderId: string;
  reason: string;
}

export interface ResolveDisputeDto {
  decision: DisputeDecision;
  sellerAmountMinor?: string;
  buyerRefundMinor?: string;
  resolutionNotes: string;
}

export interface EscalateDisputeDto {
  escalatedTo: string;
  notes?: string;
}

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);
  private readonly RESPONSE_DEADLINE_HOURS = 48;
  private readonly APPEAL_DEADLINE_DAYS = 7;

  constructor(
    private readonly disputeRepository: DisputeRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateDisputeDto): Promise<Dispute> {
    // Verify order exists and user is part of it
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You are not part of this order');
    }

    // Check if order can be disputed
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot dispute completed or cancelled order');
    }

    // Check if there's already an open dispute
    const existingDispute = await this.disputeRepository.findByOrderId(dto.orderId);
    if (existingDispute && existingDispute.status !== DisputeStatus.CLOSED) {
      throw new BadRequestException('There is already an open dispute for this order');
    }

    // Calculate response deadline
    const responseDeadline = new Date(Date.now() + this.RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000);

    // Create dispute in transaction
    const dispute = await this.prisma.$transaction(async (tx) => {
      // Create dispute
      const newDispute = await tx.dispute.create({
        data: {
          orderId: dto.orderId,
          openedBy: userId,
          reason: dto.reason,
          status: DisputeStatus.OPEN,
          responseDeadline,
        },
        include: {
          opener: { select: { id: true, username: true, email: true } },
          order: true,
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: dto.orderId },
        data: { status: OrderStatus.DISPUTED },
      });

      // Create timeline entry
      await tx.disputeTimeline.create({
        data: {
          disputeId: newDispute.id,
          action: 'OPENED',
          performedBy: userId,
          details: { reason: dto.reason },
        },
      });

      return newDispute;
    });

    this.logger.log(`Dispute created: ${dispute.id} for order: ${dto.orderId}`);

    return dispute;
  }

  async findAll(params?: PaginationParams) {
    const { page = 1, limit = 10 } = params || {};
    const skip = PaginationUtil.getSkip(page, limit);

    const { disputes, total } = await this.disputeRepository.findAll(skip, limit);

    return PaginationUtil.paginate(disputes, total, page, limit);
  }

  async findByStatus(status: DisputeStatus, params?: PaginationParams) {
    const { page = 1, limit = 10 } = params || {};
    const skip = PaginationUtil.getSkip(page, limit);

    const { disputes, total } = await this.disputeRepository.findByStatus(status, skip, limit);

    return PaginationUtil.paginate(disputes, total, page, limit);
  }

  async findOne(id: string, userId?: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findById(id);
    
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // If userId provided, check authorization
    if (userId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dispute.orderId },
      });
      
      if (
        order &&
        dispute.openedBy !== userId &&
        order.initiatorId !== userId &&
        order.counterpartyId !== userId
      ) {
        throw new ForbiddenException('Not authorized to view this dispute');
      }
    }

    return dispute;
  }

  async respond(id: string, userId: string, response: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findById(id);
    
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Dispute is not open for response');
    }

    // Check if user is the counterparty
    const order = await this.prisma.order.findUnique({
      where: { id: dispute.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isCounterparty = 
      (order.initiatorId === dispute.openedBy && order.counterpartyId === userId) ||
      (order.counterpartyId === dispute.openedBy && order.initiatorId === userId);

    if (!isCounterparty) {
      throw new ForbiddenException('Only the counterparty can respond to this dispute');
    }

    // Update dispute
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: { status: DisputeStatus.RESPONDED },
      });

      // Create timeline entry
      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          action: 'RESPONDED',
          performedBy: userId,
          details: { response },
        },
      });

      return updatedDispute;
    });

    this.logger.log(`Dispute ${id} responded by ${userId}`);

    return updated;
  }

  async escalate(id: string, adminId: string, dto: EscalateDisputeDto): Promise<Dispute> {
    const dispute = await this.disputeRepository.findById(id);
    
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.RESPONDED) {
      throw new BadRequestException('Dispute cannot be escalated in current status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.ESCALATED,
          escalatedAt: new Date(),
          escalatedTo: dto.escalatedTo,
        },
      });

      // Create timeline entry
      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          action: 'ESCALATED',
          performedBy: adminId,
          details: { escalatedTo: dto.escalatedTo, notes: dto.notes },
        },
      });

      return updatedDispute;
    });

    this.logger.log(`Dispute ${id} escalated by ${adminId}`);

    return updated;
  }

  async assignArbitrator(id: string, adminId: string, arbitratorId: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findById(id);
    
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.UNDER_ARBITRATION,
          arbitratorId,
        },
      });

      // Create timeline entry
      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          action: 'ARBITRATOR_ASSIGNED',
          performedBy: adminId,
          details: { arbitratorId },
        },
      });

      return updatedDispute;
    });

    this.logger.log(`Arbitrator ${arbitratorId} assigned to dispute ${id}`);

    return updated;
  }

  async resolve(id: string, adminId: string, dto: ResolveDisputeDto): Promise<Dispute> {
    const dispute = await this.disputeRepository.findById(id);
    
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Dispute already closed');
    }

    // Calculate appeal deadline
    const appealDeadline = new Date(Date.now() + this.APPEAL_DEADLINE_DAYS * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update dispute
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.DECIDED,
          decision: dto.decision,
          sellerAmountMinor: dto.sellerAmountMinor ? BigInt(dto.sellerAmountMinor) : null,
          buyerRefundMinor: dto.buyerRefundMinor ? BigInt(dto.buyerRefundMinor) : null,
          resolutionNotes: dto.resolutionNotes,
          decidedAt: new Date(),
          appealDeadline,
          canAppeal: true,
        },
      });

      // Update order based on decision
      let newOrderStatus: OrderStatus;
      switch (dto.decision) {
        case DisputeDecision.RELEASE_ALL_TO_SELLER:
          newOrderStatus = OrderStatus.COMPLETED;
          break;
        case DisputeDecision.REFUND_ALL_TO_BUYER:
          newOrderStatus = OrderStatus.REFUNDED;
          break;
        case DisputeDecision.SPLIT_SETTLEMENT:
          newOrderStatus = OrderStatus.COMPLETED;
          break;
        case DisputeDecision.CANCEL_VOID:
          newOrderStatus = OrderStatus.CANCELLED;
          break;
        default:
          newOrderStatus = OrderStatus.COMPLETED;
      }

      await tx.order.update({
        where: { id: dispute.orderId },
        data: { status: newOrderStatus },
      });

      // Create timeline entry
      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          action: 'DECIDED',
          performedBy: adminId,
          details: {
            decision: dto.decision,
            sellerAmount: dto.sellerAmountMinor,
            buyerRefund: dto.buyerRefundMinor,
            notes: dto.resolutionNotes,
          },
        },
      });

      return updatedDispute;
    });

    this.logger.log(`Dispute ${id} resolved with decision: ${dto.decision}`);

    return updated;
  }

  async appeal(id: string, userId: string, reason: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findById(id);
    
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== DisputeStatus.DECIDED) {
      throw new BadRequestException('Only decided disputes can be appealed');
    }

    if (!dispute.canAppeal) {
      throw new BadRequestException('Appeal window has closed');
    }

    if (dispute.appealDeadline && new Date() > dispute.appealDeadline) {
      throw new BadRequestException('Appeal deadline has passed');
    }

    // Check if user is part of the dispute
    const order = await this.prisma.order.findUnique({
      where: { id: dispute.orderId },
    });

    if (!order || (order.initiatorId !== userId && order.counterpartyId !== userId)) {
      throw new ForbiddenException('Not authorized to appeal this dispute');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.APPEALED,
          appealCount: { increment: 1 },
        },
      });

      // Create timeline entry
      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          action: 'APPEALED',
          performedBy: userId,
          details: { reason },
        },
      });

      return updatedDispute;
    });

    this.logger.log(`Dispute ${id} appealed by ${userId}`);

    return updated;
  }

  async closeAppealWindow(id: string): Promise<Dispute> {
    return this.disputeRepository.closeAppealWindow(id);
  }

  async submitEvidence(
    disputeId: string,
    userId: string,
    fileUrls: string[],
    description: string,
  ): Promise<void> {
    const dispute = await this.disputeRepository.findById(disputeId);
    
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.CLOSED || dispute.status === DisputeStatus.DECIDED) {
      throw new BadRequestException('Cannot submit evidence for closed disputes');
    }

    await this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        submittedBy: userId,
        fileUrls,
        description,
      },
    });

    this.logger.log(`Evidence submitted for dispute ${disputeId} by ${userId}`);
  }
}

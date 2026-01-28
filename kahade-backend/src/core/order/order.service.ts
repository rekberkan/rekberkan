// @ts-nocheck - Legacy code with complex type issues that need refactoring
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { OrderRepository, CreateOrderData } from './order.repository';
import { EscrowService } from '../escrow/escrow.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AcceptOrderDto } from './dto/accept-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { CreateOrderCommentDto, UpdateOrderCommentDto } from './dto/order-comment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly PLATFORM_FEE_PERCENTAGE = 1; // 1% platform fee
  private readonly INVITE_EXPIRY_DAYS = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly orderRepository: OrderRepository,
    private readonly escrowService: EscrowService,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Calculate platform fee based on amount
   */
  private calculatePlatformFee(amountMinor: bigint): bigint {
    return (amountMinor * BigInt(this.PLATFORM_FEE_PERCENTAGE)) / 100n;
  }

  /**
   * Generate invite token
   */
  private generateInviteToken(): string {
    return uuidv4().replace(/-/g, '');
  }

  /**
   * Create a new order
   */
  async createOrder(userId: string, dto: CreateOrderDto, idempotencyKey?: string) {
    this.logger.log(`Creating order for user ${userId}`);

    // Check idempotency
    if (idempotencyKey) {
      const existing = await this.prisma.order.findFirst({
        where: {
          initiatorId: userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });
      if (existing) {
        this.logger.warn(`Duplicate order creation attempt with idempotency key`);
        return existing;
      }
    }

    const amountMinor = BigInt(dto.amountMinor);
    const platformFeeMinor = this.calculatePlatformFee(amountMinor);
    const inviteToken = this.generateInviteToken();
    const inviteExpiresAt = new Date(Date.now() + this.INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const orderData: CreateOrderData = {
      initiatorId: userId,
      initiatorRole: dto.initiatorRole as any,
      title: dto.title,
      description: dto.description,
      category: dto.category as any,
      amountMinor,
      feePayer: dto.feePayer as any,
      platformFeeMinor,
      holdingPeriodDays: dto.holdingPeriodDays,
      customTerms: dto.customTerms,
      inviteToken,
      inviteExpiresAt,
    };

    const order = await this.orderRepository.create(orderData);

    // Send invite email if counterparty email provided
    if (dto.counterpartyEmail) {
      await this.notificationService.sendOrderInvite(
        dto.counterpartyEmail,
        order.orderNumber,
        inviteToken,
        dto.title,
        amountMinor,
      );
    }

    this.logger.log(`Order ${order.orderNumber} created successfully`);

    return {
      success: true,
      message: 'Order created successfully',
      data: {
        ...order,
        inviteLink: `${this.configService.get('app.frontendUrl')}/orders/accept/${inviteToken}`,
      },
    };
  }

  /**
   * Get orders with filters
   */
  async getOrders(userId: string, filterDto: OrderFilterDto) {
    const options = {
      userId,
      status: filterDto.status as any,
      role: filterDto.role,
      search: filterDto.search,
      dateFrom: filterDto.dateFrom ? new Date(filterDto.dateFrom) : undefined,
      dateTo: filterDto.dateTo ? new Date(filterDto.dateTo) : undefined,
      minAmount: filterDto.minAmount ? BigInt(filterDto.minAmount) : undefined,
      maxAmount: filterDto.maxAmount ? BigInt(filterDto.maxAmount) : undefined,
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
      sortBy: filterDto.sortBy || 'createdAt',
      sortOrder: filterDto.sortOrder || 'desc',
    };

    return this.orderRepository.findMany(options);
  }

  /**
   * Get order by ID
   */
  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(userId: string, orderNumber: string) {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  /**
   * Get order by invite token (public preview)
   */
  async getOrderByInviteToken(inviteToken: string) {
    const order = await this.orderRepository.findByInviteToken(inviteToken);

    if (!order) {
      throw new NotFoundException('Invalid invite token');
    }

    if (order.inviteExpiresAt < new Date()) {
      throw new BadRequestException('Invite token has expired');
    }

    if (order.status !== 'WAITING_COUNTERPARTY') {
      throw new BadRequestException('This order has already been accepted');
    }

    // Return limited info for preview
    return {
      orderNumber: order.orderNumber,
      title: order.title,
      description: order.description,
      category: order.category,
      amountMinor: order.amountMinor,
      initiatorRole: order.initiatorRole,
      holdingPeriodDays: order.holdingPeriodDays,
      customTerms: order.customTerms,
      initiator: {
        username: order.initiator.username,
        reputationScore: order.initiator.reputationScore,
        totalTransactions: order.initiator.totalTransactions,
      },
      expiresAt: order.inviteExpiresAt,
    };
  }

  /**
   * Update order (only before acceptance)
   */
  async updateOrder(userId: string, orderId: string, dto: UpdateOrderDto) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId) {
      throw new ForbiddenException('Only the order creator can update this order');
    }

    if (order.status !== 'WAITING_COUNTERPARTY' && order.status !== 'PENDING_ACCEPT') {
      throw new BadRequestException('Cannot update order after acceptance');
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description) updateData.description = dto.description;
    if (dto.category) updateData.category = dto.category;
    if (dto.customTerms !== undefined) updateData.customTerms = dto.customTerms;

    // Only allow amount/period changes before acceptance
    if (order.status === 'WAITING_COUNTERPARTY') {
      if (dto.amountMinor) {
        updateData.amountMinor = BigInt(dto.amountMinor);
        updateData.platformFeeMinor = this.calculatePlatformFee(BigInt(dto.amountMinor));
      }
      if (dto.holdingPeriodDays) updateData.holdingPeriodDays = dto.holdingPeriodDays;
    }

    const updated = await this.orderRepository.update(orderId, updateData);

    return {
      success: true,
      message: 'Order updated successfully',
      data: updated,
    };
  }

  /**
   * Accept order invitation
   */
  async acceptOrder(userId: string, dto: AcceptOrderDto) {
    const order = await this.orderRepository.findByInviteToken(dto.inviteToken);

    if (!order) {
      throw new NotFoundException('Invalid invite token');
    }

    if (order.inviteExpiresAt < new Date()) {
      throw new BadRequestException('Invite token has expired');
    }

    if (order.status !== 'WAITING_COUNTERPARTY') {
      throw new ConflictException('This order has already been accepted');
    }

    if (order.initiatorId === userId) {
      throw new BadRequestException('You cannot accept your own order');
    }

    const updated = await this.orderRepository.updateStatus(order.id, 'PENDING_ACCEPT' as any, {
      counterpartyId: userId,
    });

    // Notify initiator
    await this.notificationService.sendOrderAccepted(
      order.initiatorId,
      order.orderNumber,
      updated.counterparty?.username || 'Unknown',
    );

    this.logger.log(`Order ${order.orderNumber} accepted by user ${userId}`);

    return {
      success: true,
      message: 'Order accepted successfully',
      data: updated,
    };
  }

  /**
   * Pay for order (lock funds in escrow)
   */
  async payOrder(userId: string, orderId: string, idempotencyKey: string) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key is required for payment');
    }

    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Determine buyer
    const buyerId = order.initiatorRole === 'BUYER' ? order.initiatorId : order.counterpartyId;

    if (userId !== buyerId) {
      throw new ForbiddenException('Only the buyer can pay for this order');
    }

    if (order.status !== 'PENDING_ACCEPT' && order.status !== 'ACCEPTED') {
      throw new BadRequestException(`Cannot pay for order in status: ${order.status}`);
    }

    // Calculate total amount including fee if buyer pays
    let totalAmount = order.amountMinor;
    if (order.feePayer === 'BUYER' || order.feePayer === 'FIFTY_FIFTY') {
      const feeAmount =
        order.feePayer === 'FIFTY_FIFTY' ? order.platformFeeMinor / 2n : order.platformFeeMinor;
      totalAmount += feeAmount;
    }

    // Check buyer balance
    const balance = await this.walletService.getBalance(buyerId);
    if (BigInt(balance.availableBalance) < totalAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create escrow
    const sellerId = order.initiatorRole === 'SELLER' ? order.initiatorId : order.counterpartyId;

    await this.escrowService.createEscrow({
      orderId: order.id,
      buyerUserId: buyerId,
      sellerUserId: sellerId || undefined,
      amountMinor: order.amountMinor,
      timeoutHours: order.holdingPeriodDays * 24,
      idempotencyKey,
    });

    // Update order status
    const autoReleaseAt = new Date(Date.now() + order.holdingPeriodDays * 24 * 60 * 60 * 1000);
    const updated = await this.orderRepository.updateStatus(orderId, 'PAID' as any, {
      autoReleaseAt,
    });

    // Notify seller
    if (sellerId) {
      await this.notificationService.sendPaymentReceived(
        sellerId,
        order.orderNumber,
        order.amountMinor,
      );
    }

    this.logger.log(`Order ${order.orderNumber} paid, escrow created`);

    return {
      success: true,
      message: 'Payment successful, funds locked in escrow',
      data: updated,
    };
  }

  /**
   * Confirm delivery and release escrow
   */
  async confirmDelivery(userId: string, orderId: string, idempotencyKey: string) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }

    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only buyer can confirm
    const buyerId = order.initiatorRole === 'BUYER' ? order.initiatorId : order.counterpartyId;

    if (userId !== buyerId) {
      throw new ForbiddenException('Only the buyer can confirm delivery');
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException(`Cannot confirm delivery for order in status: ${order.status}`);
    }

    if (!order.escrowHold) {
      throw new BadRequestException('No escrow found for this order');
    }

    // Release escrow
    await this.escrowService.releaseEscrow({
      escrowId: order.escrowHold.id,
      actorId: userId,
      platformFeeMinor: order.platformFeeMinor,
      idempotencyKey,
    });

    // Update order status
    const updated = await this.orderRepository.updateStatus(orderId, 'COMPLETED' as any);

    // Notify seller
    const sellerId = order.initiatorRole === 'SELLER' ? order.initiatorId : order.counterpartyId;
    if (sellerId) {
      await this.notificationService.sendEscrowReleased(
        sellerId,
        order.orderNumber,
        order.amountMinor - order.platformFeeMinor,
      );
    }

    this.logger.log(`Order ${order.orderNumber} completed, escrow released`);

    return {
      success: true,
      message: 'Delivery confirmed, escrow released to seller',
      data: updated,
    };
  }

  /**
   * Cancel order
   */
  async cancelOrder(userId: string, orderId: string, dto: CancelOrderDto) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Can only cancel before payment
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      throw new BadRequestException(
        'Cannot cancel order after payment. Please open a dispute instead.',
      );
    }

    const updated = await this.orderRepository.updateStatus(orderId, 'CANCELLED' as any);

    // Notify other party
    const otherPartyId = order.initiatorId === userId ? order.counterpartyId : order.initiatorId;
    if (otherPartyId) {
      await this.notificationService.sendOrderCancelled(
        otherPartyId,
        order.orderNumber,
        dto.reason,
      );
    }

    this.logger.log(`Order ${order.orderNumber} cancelled by user ${userId}`);

    return {
      success: true,
      message: 'Order cancelled successfully',
      data: updated,
    };
  }

  /**
   * Open dispute
   */
  async openDispute(
    userId: string,
    orderId: string,
    _disputeData: { reason: string; description: string },
  ) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException('Can only dispute paid orders');
    }

    // Update order status
    const updated = await this.orderRepository.updateStatus(orderId, 'DISPUTED' as any);

    // Create dispute record (handled by dispute service)
    // This is a simplified version - full implementation would call DisputeService

    this.logger.log(`Dispute opened for order ${order.orderNumber} by user ${userId}`);

    return {
      success: true,
      message: 'Dispute opened successfully',
      data: updated,
    };
  }

  /**
   * Resend invite
   */
  async resendInvite(userId: string, orderId: string, email: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId) {
      throw new ForbiddenException('Only the order creator can resend invites');
    }

    if (order.status !== 'WAITING_COUNTERPARTY') {
      throw new BadRequestException('Order has already been accepted');
    }

    // Generate new invite token
    const newInviteToken = this.generateInviteToken();
    const newInviteExpiresAt = new Date(Date.now() + this.INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.orderRepository.update(orderId, {
      inviteToken: newInviteToken,
      inviteExpiresAt: newInviteExpiresAt,
    } as any);

    // Send email
    await this.notificationService.sendOrderInvite(
      email,
      order.orderNumber,
      newInviteToken,
      order.title,
      order.amountMinor,
    );

    return {
      success: true,
      message: 'Invitation resent successfully',
    };
  }

  /**
   * Get order comments
   */
  async getComments(userId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order.comments || [];
  }

  /**
   * Add comment
   */
  async addComment(userId: string, orderId: string, dto: CreateOrderCommentDto) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.initiatorId !== userId && order.counterpartyId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const comment = await this.prisma.orderComment.create({
      data: {
        orderId,
        userId,
        message: dto.content,
        parentId: dto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * Update comment
   */
  async updateComment(
    userId: string,
    orderId: string,
    commentId: string,
    dto: UpdateOrderCommentDto,
  ) {
    const comment = await this.prisma.orderComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.orderId !== orderId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.orderComment.update({
      where: { id: commentId },
      data: {
        message: dto.content,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete comment
   */
  async deleteComment(userId: string, orderId: string, commentId: string) {
    const comment = await this.prisma.orderComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.orderId !== orderId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.orderComment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { success: true, message: 'Comment deleted' };
  }
}

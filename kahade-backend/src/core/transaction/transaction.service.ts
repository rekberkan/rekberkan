import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { TransactionRepository } from './transaction.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { PaginationUtil, PaginationParams } from '@common/utils/pagination.util';
import { UserService } from '@core/user/user.service';
import { WalletService } from '@core/wallet/wallet.service';
import { NotificationService } from '@core/notification/notification.service';
import { ITransactionResponse } from '../../common/interfaces/transaction.interface';
import { Transaction } from '../../common/shims/prisma-types.shim';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly PLATFORM_FEE_PERCENT = 2.5;

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<ITransactionResponse> {
    // Validate counterparty exists if provided
    let counterpartyId: string | null = null;

    if (createTransactionDto.counterpartyId) {
      const counterparty = await this.userService.findById(createTransactionDto.counterpartyId);
      if (!counterparty) {
        throw new NotFoundException('Counterparty user not found');
      }
      if (counterparty.id === userId) {
        throw new BadRequestException('Cannot create transaction with yourself');
      }
      counterpartyId = counterparty.id;
    } else if (createTransactionDto.counterpartyEmail) {
      const counterparty = await this.userService.findByEmail(
        createTransactionDto.counterpartyEmail,
      );
      if (counterparty) {
        if (counterparty.id === userId) {
          throw new BadRequestException('Cannot create transaction with yourself');
        }
        counterpartyId = counterparty.id;
      }
    }

    // Generate unique order number
    const orderNumber = `KHD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Calculate platform fee
    const amountMinor = BigInt(Math.round(createTransactionDto.amount * 100));
    const platformFeeMinor = BigInt(
      Math.round(createTransactionDto.amount * this.PLATFORM_FEE_PERCENT),
    );

    // Generate invite token
    const inviteToken = this.generateInviteToken();

    // Create transaction in database
    const transaction = await this.transactionRepository.create({
      orderNumber,
      initiatorId: userId,
      initiatorRole: createTransactionDto.role?.toUpperCase() || 'BUYER',
      counterpartyId,
      title: createTransactionDto.title,
      description: createTransactionDto.description,
      category: createTransactionDto.category || 'OTHER',
      amountMinor,
      feePayer: createTransactionDto.feePaidBy?.toUpperCase() || 'BUYER',
      platformFeeMinor,
      holdingPeriodDays: 7,
      status: counterpartyId ? 'PENDING_ACCEPT' : 'WAITING_COUNTERPARTY',
      inviteToken,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      terms: createTransactionDto.terms || null,
    });

    this.logger.log(`Transaction created: ${transaction.id} by user ${userId}`);

    // Send notification to counterparty if exists
    if (counterpartyId) {
      await this.notificationService.sendTransactionNotification(
        counterpartyId,
        transaction.id,
        'created',
        transaction.title,
      );
    }

    return this.transformToResponse(transaction);
  }

  async findOne(id: string, userId?: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // If userId provided, check authorization
    if (userId && transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Not authorized to view this transaction');
    }

    return this.transformToResponse(transaction);
  }

  async findByOrderNumber(orderNumber: string, userId?: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findByOrderNumber(orderNumber);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (userId && transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Not authorized to view this transaction');
    }

    return this.transformToResponse(transaction);
  }

  async findByInviteToken(inviteToken: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findByInviteToken(inviteToken);

    if (!transaction) {
      throw new NotFoundException('Invalid or expired invite link');
    }

    return this.transformToResponse(transaction);
  }

  async findAllByUser(
    userId: string,
    params: PaginationParams & { status?: string; role?: string },
  ) {
    const { page = 1, limit = 10, status, role } = params;
    const skip = PaginationUtil.getSkip(page, limit);

    const { transactions, total } = await this.transactionRepository.findByUser(
      userId,
      skip,
      limit,
      { status, role },
    );

    const transformedTransactions = transactions.map((t) => this.transformToResponse(t));

    return PaginationUtil.paginate(transformedTransactions, total, page, limit);
  }

  async accept(id: string, userId: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Only counterparty can accept
    if (transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Only the counterparty can accept this transaction');
    }

    if (transaction.status !== 'PENDING_ACCEPT') {
      throw new BadRequestException('Transaction cannot be accepted in current status');
    }

    const updated = await this.transactionRepository.update(id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });

    this.logger.log(`Transaction ${id} accepted by user ${userId}`);

    // Notify initiator
    await this.notificationService.sendTransactionNotification(
      transaction.initiatorId,
      transaction.id,
      'accepted',
      transaction.title,
    );

    return this.transformToResponse(updated);
  }

  async acceptByInvite(inviteToken: string, userId: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findByInviteToken(inviteToken);

    if (!transaction) {
      throw new NotFoundException('Invalid or expired invite link');
    }

    if (transaction.initiatorId === userId) {
      throw new BadRequestException('Cannot accept your own transaction');
    }

    // If counterparty is set and not this user, reject
    if (transaction.counterpartyId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('This transaction is for a different user');
    }

    // Update counterparty if not set
    const updateData: any = {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    };

    if (!transaction.counterpartyId) {
      updateData.counterpartyId = userId;
    }

    const updated = await this.transactionRepository.update(transaction.id, updateData);

    this.logger.log(`Transaction ${transaction.id} accepted via invite by user ${userId}`);

    // Notify initiator
    await this.notificationService.sendTransactionNotification(
      transaction.initiatorId,
      transaction.id,
      'accepted',
      transaction.title,
    );

    return this.transformToResponse(updated);
  }

  async reject(id: string, userId: string, _reason?: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Only the counterparty can reject this transaction');
    }

    if (transaction.status !== 'PENDING_ACCEPT') {
      throw new BadRequestException('Transaction cannot be rejected in current status');
    }

    const updated = await this.transactionRepository.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });

    this.logger.log(`Transaction ${id} rejected by user ${userId}`);

    return this.transformToResponse(updated);
  }

  async pay(id: string, userId: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Determine buyer based on initiator role
    const buyerId =
      transaction.initiatorRole === 'BUYER' ? transaction.initiatorId : transaction.counterpartyId;

    if (buyerId !== userId) {
      throw new ForbiddenException('Only buyer can make payment');
    }

    if (transaction.status !== 'ACCEPTED') {
      throw new BadRequestException('Transaction must be accepted before payment');
    }

    // Calculate total amount buyer needs to pay
    const amountMinor = transaction.amountMinor || BigInt(0);
    const platformFeeMinor = transaction.platformFeeMinor || BigInt(0);

    let totalToPay = amountMinor;
    if (transaction.feePayer === 'BUYER') {
      totalToPay = amountMinor + platformFeeMinor;
    } else if (transaction.feePayer === 'SPLIT') {
      totalToPay = amountMinor + platformFeeMinor / BigInt(2);
    }

    // Lock buyer's wallet balance
    try {
      await this.walletService.lockBalance({
        userId: buyerId as string,
        amount: totalToPay,
        reason: `Escrow for transaction ${transaction.orderNumber}`,
      });
    } catch (error) {
      this.logger.error(`Failed to lock balance for transaction ${id}: ${error.message}`);
      throw new BadRequestException('Insufficient balance to pay for this transaction');
    }

    const buyerWallet = await this.prisma.wallet.findUnique({
      where: { userId: buyerId as string },
    });

    if (!buyerWallet) {
      throw new BadRequestException('Buyer wallet not found');
    }

    const sellerId =
      transaction.initiatorRole === 'SELLER' ? transaction.initiatorId : transaction.counterpartyId;
    const sellerWallet = sellerId
      ? await this.prisma.wallet.findUnique({ where: { userId: sellerId } })
      : null;

    // Create escrow hold record
    await (this.prisma as any).escrowHold.create({
      data: {
        orderId: transaction.id,
        buyerWalletId: buyerWallet.id,
        sellerWalletId: sellerWallet?.id,
        amountMinor: totalToPay,
        status: 'HELD',
      },
    });

    const updated = await this.transactionRepository.update(id, {
      status: 'PAID',
      paidAt: new Date(),
    });

    this.logger.log(`Transaction ${id} paid by user ${userId}`);

    // Notify seller
    if (sellerId) {
      await this.notificationService.sendTransactionNotification(
        sellerId,
        transaction.id,
        'paid',
        transaction.title,
      );
    }

    return this.transformToResponse(updated);
  }

  async confirmDelivery(
    id: string,
    userId: string,
    proofUrl?: string,
    notes?: string,
  ): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Determine seller based on initiator role
    const sellerId =
      transaction.initiatorRole === 'SELLER' ? transaction.initiatorId : transaction.counterpartyId;

    if (sellerId !== userId) {
      throw new ForbiddenException('Only seller can confirm delivery');
    }

    if (transaction.status !== 'PAID') {
      throw new BadRequestException('Payment must be confirmed before delivery');
    }

    // Create delivery proof if provided
    if (proofUrl) {
      await (this.prisma as any).deliveryProof.create({
        data: {
          orderId: transaction.id,
          fileUrls: [proofUrl],
          notes: notes?.trim() || 'Delivery proof submitted',
        },
      });
    }

    // Set auto-release time (7 days from now)
    const autoReleaseAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await this.transactionRepository.update(id, {
      autoReleaseAt,
    });

    this.logger.log(`Transaction ${id} delivery confirmed by seller ${userId}`);

    // Notify buyer
    const buyerId =
      transaction.initiatorRole === 'BUYER' ? transaction.initiatorId : transaction.counterpartyId;
    if (buyerId) {
      await this.notificationService.createForUser(
        buyerId,
        'TRANSACTION' as any,
        'Delivery Confirmed',
        `The seller has confirmed delivery for "${transaction.title}". Please confirm receipt within 7 days.`,
        { transactionId: transaction.id },
      );
    }

    return this.transformToResponse(updated);
  }

  async confirmReceipt(id: string, userId: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Determine buyer based on initiator role
    const buyerId =
      transaction.initiatorRole === 'BUYER' ? transaction.initiatorId : transaction.counterpartyId;

    if (buyerId !== userId) {
      throw new ForbiddenException('Only buyer can confirm receipt');
    }

    if (transaction.status !== 'PAID') {
      throw new BadRequestException('Transaction must be paid before confirming receipt');
    }

    // Release funds to seller
    const sellerId =
      transaction.initiatorRole === 'SELLER' ? transaction.initiatorId : transaction.counterpartyId;

    if (!sellerId) {
      throw new BadRequestException('No seller found for this transaction');
    }

    try {
      const amountMinor = transaction.amountMinor || BigInt(0);
      const platformFeeMinor = transaction.platformFeeMinor || BigInt(0);

      // Calculate seller's amount after fee
      let sellerAmount = amountMinor;
      if (transaction.feePayer === 'SELLER') {
        sellerAmount = amountMinor - platformFeeMinor;
      } else if (transaction.feePayer === 'SPLIT') {
        sellerAmount = amountMinor - platformFeeMinor / BigInt(2);
      }

      // Transfer from buyer's locked balance to seller
      await this.walletService.transferLockedBalance(
        buyerId as string,
        sellerId,
        sellerAmount,
        `Payment for transaction ${transaction.orderNumber}`,
      );

      // Update escrow hold status
      await (this.prisma as any).escrowHold.updateMany({
        where: { orderId: transaction.id },
        data: { status: 'RELEASED', resolvedAt: new Date() },
      });

      const updated = await this.transactionRepository.update(id, {
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      this.logger.log(`Transaction ${id} completed - funds released to seller ${sellerId}`);

      // Notify seller
      await this.notificationService.sendTransactionNotification(
        sellerId,
        transaction.id,
        'completed',
        transaction.title,
      );

      return this.transformToResponse(updated);
    } catch (error) {
      this.logger.error(`Failed to release funds for transaction ${id}: ${error.message}`);
      throw new BadRequestException('Failed to release funds');
    }
  }

  async dispute(
    id: string,
    userId: string,
    data: { reason: string; description: string },
  ): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Not authorized to dispute this transaction');
    }

    if (transaction.status !== 'PAID') {
      throw new BadRequestException('Only paid transactions can be disputed');
    }

    // Create dispute record
    const disputeReason = data.description ? `${data.reason} - ${data.description}` : data.reason;

    await (this.prisma as any).dispute.create({
      data: {
        orderId: transaction.id,
        openedBy: userId,
        reason: disputeReason,
        status: 'OPEN',
      },
    });

    const updated = await this.transactionRepository.update(id, {
      status: 'DISPUTED',
    });

    this.logger.log(`Transaction ${id} disputed by user ${userId}`);

    // Notify other party
    const otherPartyId =
      transaction.initiatorId === userId ? transaction.counterpartyId : transaction.initiatorId;
    if (otherPartyId) {
      await this.notificationService.sendTransactionNotification(
        otherPartyId,
        transaction.id,
        'disputed',
        transaction.title,
      );
    }

    return this.transformToResponse(updated);
  }

  async cancel(id: string, userId: string, _reason?: string): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this transaction');
    }

    if (transaction.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed transaction');
    }

    if (transaction.status === 'PAID') {
      throw new BadRequestException('Cannot cancel paid transaction - please dispute instead');
    }

    const updated = await this.transactionRepository.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });

    this.logger.log(`Transaction ${id} cancelled by user ${userId}`);

    // Notify other party
    const otherPartyId =
      transaction.initiatorId === userId ? transaction.counterpartyId : transaction.initiatorId;
    if (otherPartyId) {
      await this.notificationService.sendTransactionNotification(
        otherPartyId,
        transaction.id,
        'cancelled',
        transaction.title,
      );
    }

    return this.transformToResponse(updated);
  }

  async rate(
    id: string,
    userId: string,
    data: { score: number; comment?: string },
  ): Promise<{ message: string }> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Not authorized to rate this transaction');
    }

    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed transactions can be rated');
    }

    // Determine who is being rated
    const ratedUserId =
      transaction.initiatorId === userId ? transaction.counterpartyId : transaction.initiatorId;

    if (!ratedUserId) {
      throw new BadRequestException('No counterparty to rate');
    }

    // Check if already rated
    const existingRating = await (this.prisma as any).rating.findFirst({
      where: {
        orderId: transaction.id,
        fromUserId: userId,
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this transaction');
    }

    // Create rating
    await (this.prisma as any).rating.create({
      data: {
        orderId: transaction.id,
        fromUserId: userId,
        toUserId: ratedUserId,
        score: data.score,
        review: data.comment,
      },
    });

    this.logger.log(`Transaction ${id} rated by user ${userId}`);

    return { message: 'Rating submitted successfully' };
  }

  async updateStatus(
    id: string,
    userId: string,
    updateStatusDto: UpdateTransactionStatusDto,
  ): Promise<ITransactionResponse> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Not authorized to update this transaction');
    }

    // Validate status transition
    this.validateStatusTransition(transaction.status, updateStatusDto.status);

    const updated = await this.transactionRepository.update(id, {
      status: updateStatusDto.status,
    });

    return this.transformToResponse(updated);
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      WAITING_COUNTERPARTY: ['PENDING_ACCEPT', 'CANCELLED'],
      PENDING_ACCEPT: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PAID', 'CANCELLED'],
      PAID: ['COMPLETED', 'DISPUTED', 'REFUNDED'],
      DISPUTED: ['COMPLETED', 'REFUNDED'],
      CANCELLED: [],
      COMPLETED: [],
      REFUNDED: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private generateInviteToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  async getTimeline(transactionId: string, userId: string): Promise<any[]> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Return timeline based on transaction events
    const timeline: Array<{ event: string; timestamp: Date | null; description: string }> = [];
    timeline.push({
      event: 'created',
      timestamp: transaction.createdAt,
      description: 'Transaction created',
    });

    if (transaction.acceptedAt) {
      timeline.push({
        event: 'accepted',
        timestamp: transaction.acceptedAt,
        description: 'Transaction accepted',
      });
    }
    if (transaction.paidAt) {
      timeline.push({
        event: 'paid',
        timestamp: transaction.paidAt,
        description: 'Payment confirmed',
      });
    }
    if (transaction.completedAt) {
      timeline.push({
        event: 'completed',
        timestamp: transaction.completedAt,
        description: 'Transaction completed',
      });
    }
    if (transaction.cancelledAt) {
      timeline.push({
        event: 'cancelled',
        timestamp: transaction.cancelledAt,
        description: 'Transaction cancelled',
      });
    }

    return timeline;
  }

  async getMessages(transactionId: string, userId: string): Promise<any[]> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get messages from order comments
    const messages = await this.prisma.orderComment.findMany({
      where: { orderId: transactionId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, username: true } } },
    });

    return messages;
  }

  async sendMessage(transactionId: string, userId: string, message: string): Promise<any> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.initiatorId !== userId && transaction.counterpartyId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const comment = await this.prisma.orderComment.create({
      data: {
        orderId: transactionId,
        userId,
        message: message,
      },
      include: { user: { select: { id: true, username: true } } },
    });

    return comment;
  }

  private transformToResponse(transaction: Transaction & any): ITransactionResponse {
    const amountMinor = transaction.amountMinor || BigInt(0);
    const platformFeeMinor = transaction.platformFeeMinor || BigInt(0);

    return {
      id: transaction.id,
      orderNumber: transaction.orderNumber,
      initiatorId: transaction.initiatorId,
      counterpartyId: transaction.counterpartyId,
      initiatorRole: transaction.initiatorRole,
      title: transaction.title,
      description: transaction.description,
      category: transaction.category,
      amount: Number(amountMinor) / 100,
      platformFee: Number(platformFeeMinor) / 100,
      feePayer: transaction.feePayer,
      status: transaction.status,
      terms: transaction.customTerms || transaction.terms,
      inviteToken: transaction.inviteToken,
      inviteExpiresAt: transaction.inviteExpiresAt,
      acceptedAt: transaction.acceptedAt,
      paidAt: transaction.paidAt,
      completedAt: transaction.completedAt,
      cancelledAt: transaction.cancelledAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      initiator: transaction.initiator,
      counterparty: transaction.counterparty,
      escrowHold: transaction.escrowHold,
      deliveryProof: transaction.deliveryProof,
      dispute: transaction.dispute,
      ratings: transaction.ratings,
    };
  }
}

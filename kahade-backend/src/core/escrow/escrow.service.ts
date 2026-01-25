import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { EscrowHold, EscrowHoldStatus, Order, OrderStatus } from '@common/shims/prisma-types.shim';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../wallet/wallet.service';
import { LedgerService } from '../ledger/ledger.service';

// ============================================================================
// BANK-GRADE ESCROW SERVICE
// Implements: State Machine Validation, Atomic Fund Movements, Timeout Enforcement
// ============================================================================

export class InvalidStateTransitionError extends BadRequestException {
  constructor(currentState: string, targetState: string) {
    super({
      code: 'INVALID_STATE_TRANSITION',
      message: `Cannot transition from ${currentState} to ${targetState}`,
      currentState,
      targetState,
    });
  }
}

export class UnauthorizedTransitionError extends ForbiddenException {
  constructor(actorId: string, action: string) {
    super({
      code: 'UNAUTHORIZED_TRANSITION',
      message: `User ${actorId} is not authorized to perform ${action}`,
    });
  }
}

// ============================================================================
// STATE MACHINE DEFINITIONS
// ============================================================================

/**
 * BANK-GRADE: Escrow State Machine
 * Defines all valid state transitions
 */
const ESCROW_STATE_MACHINE: Record<EscrowHoldStatus, EscrowHoldStatus[]> = {
  [EscrowHoldStatus.ACTIVE]: [EscrowHoldStatus.RELEASED, EscrowHoldStatus.REFUNDED, EscrowHoldStatus.DISPUTED],
  [EscrowHoldStatus.HELD]: [EscrowHoldStatus.RELEASED, EscrowHoldStatus.REFUNDED, EscrowHoldStatus.DISPUTED],
  [EscrowHoldStatus.DISPUTED]: [EscrowHoldStatus.ADJUSTED, EscrowHoldStatus.RELEASED, EscrowHoldStatus.REFUNDED],
  [EscrowHoldStatus.RELEASED]: [], // Terminal state
  [EscrowHoldStatus.REFUNDED]: [], // Terminal state
  [EscrowHoldStatus.ADJUSTED]: [], // Terminal state (dispute resolution)
};

/**
 * BANK-GRADE: Order State Machine
 * Defines all valid state transitions
 */
const ORDER_STATE_MACHINE: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.WAITING_COUNTERPARTY]: [OrderStatus.PENDING_ACCEPT, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_ACCEPT]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED, OrderStatus.DISPUTED],
  [OrderStatus.COMPLETED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [], // Terminal state
  [OrderStatus.REFUNDED]: [], // Terminal state
  [OrderStatus.DISPUTED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED], // After dispute resolution
};

export interface CreateEscrowOptions {
  orderId: string;
  buyerUserId: string;
  sellerUserId?: string;
  amountMinor: bigint;
  timeoutHours?: number;
  idempotencyKey: string;
}

export interface ReleaseEscrowOptions {
  escrowId: string;
  actorId: string;
  platformFeeMinor: bigint;
  idempotencyKey: string;
}

export interface RefundEscrowOptions {
  escrowId: string;
  actorId: string;
  reason: string;
  idempotencyKey: string;
}

export interface ResolveDisputeOptions {
  escrowId: string;
  resolverId: string;
  buyerRefundMinor: bigint;
  sellerAmountMinor: bigint;
  platformFeeMinor: bigint;
  resolution: 'BUYER_WINS' | 'SELLER_WINS' | 'SPLIT';
  notes: string;
  idempotencyKey: string;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private readonly DEFAULT_TIMEOUT_HOURS = 72; // 3 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
  ) {}

  // ============================================================================
  // STATE MACHINE VALIDATION
  // ============================================================================

  /**
   * BANK-GRADE: Validate escrow state transition
   */
  validateEscrowTransition(
    currentStatus: EscrowHoldStatus,
    targetStatus: EscrowHoldStatus,
  ): boolean {
    const allowedTransitions = ESCROW_STATE_MACHINE[currentStatus];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new InvalidStateTransitionError(currentStatus, targetStatus);
    }
    return true;
  }

  /**
   * BANK-GRADE: Validate order state transition
   */
  validateOrderTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
  ): boolean {
    const allowedTransitions = ORDER_STATE_MACHINE[currentStatus];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new InvalidStateTransitionError(currentStatus, targetStatus);
    }
    return true;
  }

  /**
   * BANK-GRADE: Validate actor can perform transition
   */
  validateActorPermission(
    escrow: EscrowHold & { order: Order },
    actorId: string,
    action: string,
  ): boolean {
    const order = escrow.order;

    switch (action) {
      case 'RELEASE':
        // Only buyer can release (confirm delivery)
        if (order.initiatorRole === 'BUYER' && order.initiatorId !== actorId) {
          throw new UnauthorizedTransitionError(actorId, action);
        }
        if (order.initiatorRole === 'SELLER' && order.counterpartyId !== actorId) {
          throw new UnauthorizedTransitionError(actorId, action);
        }
        break;

      case 'REFUND':
        // Only seller can initiate refund, or system for timeout
        if (order.initiatorRole === 'SELLER' && order.initiatorId !== actorId) {
          throw new UnauthorizedTransitionError(actorId, action);
        }
        if (order.initiatorRole === 'BUYER' && order.counterpartyId !== actorId) {
          throw new UnauthorizedTransitionError(actorId, action);
        }
        break;

      case 'DISPUTE':
        // Both parties can dispute
        if (actorId !== order.initiatorId && actorId !== order.counterpartyId) {
          throw new UnauthorizedTransitionError(actorId, action);
        }
        break;

      case 'RESOLVE':
        // Only admin can resolve disputes
        // This should be checked at controller level with admin guard
        break;

      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }

    return true;
  }

  // ============================================================================
  // ESCROW OPERATIONS
  // ============================================================================

  /**
   * BANK-GRADE: Create escrow hold
   */
  async createEscrow(options: CreateEscrowOptions): Promise<EscrowHold> {
    const {
      orderId,
      buyerUserId,
      sellerUserId,
      amountMinor,
      timeoutHours = this.DEFAULT_TIMEOUT_HOURS,
      idempotencyKey,
    } = options;

    // Check idempotency
    const existing = await this.prisma.escrowHold.findFirst({
      where: { orderId },
    });

    if (existing) {
      this.logger.warn(`Escrow already exists for order ${orderId}`);
      return existing;
    }

    // Get buyer wallet
    const buyerWallet = await this.prisma.wallet.findUnique({
      where: { userId: buyerUserId },
    });

    if (!buyerWallet) {
      throw new NotFoundException('Buyer wallet not found');
    }

    // Get seller wallet if provided
    let sellerWallet: { id: string } | null = null;
    if (sellerUserId) {
      sellerWallet = await this.prisma.wallet.findUnique({
        where: { userId: sellerUserId },
      });
    }

    // Calculate timeout
    const timeoutAt = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);

    // Create escrow in transaction
    const escrow = await this.prisma.$transaction(async (tx) => {
      // Lock buyer's balance
      await this.walletService.lockBalance({
        userId: buyerUserId,
        amount: amountMinor,
        reason: `Escrow hold for order ${orderId}`,
        tx,
      });

      // Create escrow record
      const newEscrow = await tx.escrowHold.create({
        data: {
          orderId,
          buyerWalletId: buyerWallet.id,
          sellerWalletId: sellerWallet?.id,
          amountMinor,
          status: EscrowHoldStatus.ACTIVE,
          timeoutAt,
        },
      });

      // Get or create accounts for ledger
      const buyerAccount = await this.ledgerService.getOrCreateUserAccount(
        buyerWallet.id,
        'USER_WALLET',
        'IDR',
        tx,
      );

      const escrowAccount = await this.ledgerService.getOrCreatePlatformAccount(
        'ESCROW_HOLDING',
        'ESCROW',
        'IDR',
        tx,
      );

      // Record in ledger
      await this.ledgerService.recordEscrowHold(
        buyerAccount.id,
        escrowAccount.id,
        amountMinor,
        newEscrow.id,
        orderId,
        idempotencyKey,
        tx,
      );

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          autoReleaseAt: timeoutAt,
        },
      });

      return newEscrow;
    });

    this.logger.log(
      `Created escrow ${escrow.id} for order ${orderId}, amount: ${amountMinor}`,
    );

    return escrow;
  }

  /**
   * BANK-GRADE: Release escrow to seller
   */
  async releaseEscrow(options: ReleaseEscrowOptions): Promise<EscrowHold> {
    const { escrowId, actorId, platformFeeMinor, idempotencyKey } = options;

    const escrow = await this.prisma.escrowHold.findUnique({
      where: { id: escrowId },
      include: { order: true, buyerWallet: true, sellerWallet: true },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Validate state transition
    this.validateEscrowTransition(escrow.status, EscrowHoldStatus.RELEASED);

    // Validate actor permission
    this.validateActorPermission(escrow, actorId, 'RELEASE');

    if (!escrow.sellerWallet) {
      throw new BadRequestException('Seller wallet not set');
    }

    const sellerAmount = escrow.amountMinor - platformFeeMinor;

    // Execute release in transaction
    const updatedEscrow = await this.prisma.$transaction(async (tx) => {
      // Get accounts
      const escrowAccount = await this.ledgerService.getOrCreatePlatformAccount(
        'ESCROW_HOLDING',
        'ESCROW',
        'IDR',
        tx,
      );

      const sellerAccount = await this.ledgerService.getOrCreateUserAccount(
        escrow.sellerWallet!.id,
        'USER_WALLET',
        'IDR',
        tx,
      );

      const platformFeeAccount = await this.ledgerService.getOrCreatePlatformAccount(
        'PLATFORM_FEES',
        'REVENUE',
        'IDR',
        tx,
      );

      // Record in ledger
      await this.ledgerService.recordEscrowRelease(
        escrowAccount.id,
        sellerAccount.id,
        platformFeeAccount.id,
        escrow.amountMinor,
        platformFeeMinor,
        escrow.id,
        escrow.orderId,
        idempotencyKey,
        tx,
      );

      // Transfer locked balance from buyer to seller
      await this.walletService.transferLockedBalance(
        escrow.buyerWallet.userId,
        escrow.sellerWallet!.userId,
        sellerAmount,
        `Escrow release for order ${escrow.orderId}`,
        tx,
      );

      // Deduct platform fee from buyer's locked balance
      if (platformFeeMinor > 0n) {
        await tx.wallet.update({
          where: { id: escrow.buyerWallet.id },
          data: {
            balanceMinor: { decrement: platformFeeMinor },
            lockedMinor: { decrement: platformFeeMinor },
          },
        });
      }

      // Update escrow status
      const updated = await tx.escrowHold.update({
        where: { id: escrowId },
        data: {
          status: EscrowHoldStatus.RELEASED,
          resolvedAt: new Date(),
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: escrow.orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      return updated;
    });

    this.logger.log(
      `Released escrow ${escrowId}, seller received: ${sellerAmount}, platform fee: ${platformFeeMinor}`,
    );

    return updatedEscrow;
  }

  /**
   * BANK-GRADE: Refund escrow to buyer
   */
  async refundEscrow(options: RefundEscrowOptions): Promise<EscrowHold> {
    const { escrowId, actorId, reason, idempotencyKey } = options;

    const escrow = await this.prisma.escrowHold.findUnique({
      where: { id: escrowId },
      include: { order: true, buyerWallet: true },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Validate state transition
    this.validateEscrowTransition(escrow.status, EscrowHoldStatus.REFUNDED);

    // Validate actor permission (skip for system timeout)
    if (actorId !== 'SYSTEM') {
      this.validateActorPermission(escrow, actorId, 'REFUND');
    }

    // Execute refund in transaction
    const updatedEscrow = await this.prisma.$transaction(async (tx) => {
      // Get accounts
      const escrowAccount = await this.ledgerService.getOrCreatePlatformAccount(
        'ESCROW_HOLDING',
        'ESCROW',
        'IDR',
        tx,
      );

      const buyerAccount = await this.ledgerService.getOrCreateUserAccount(
        escrow.buyerWallet.id,
        'USER_WALLET',
        'IDR',
        tx,
      );

      // Record in ledger
      await this.ledgerService.recordEscrowRefund(
        escrowAccount.id,
        buyerAccount.id,
        escrow.amountMinor,
        escrow.id,
        escrow.orderId,
        idempotencyKey,
        tx,
      );

      // Unlock buyer's balance
      await this.walletService.unlockBalance(
        escrow.buyerWallet.userId,
        escrow.amountMinor,
        `Escrow refund for order ${escrow.orderId}: ${reason}`,
        tx,
      );

      // Update escrow status
      const updated = await tx.escrowHold.update({
        where: { id: escrowId },
        data: {
          status: EscrowHoldStatus.REFUNDED,
          resolvedAt: new Date(),
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: escrow.orderId },
        data: {
          status: OrderStatus.REFUNDED,
          cancelledAt: new Date(),
        },
      });

      return updated;
    });

    this.logger.log(
      `Refunded escrow ${escrowId} to buyer, amount: ${escrow.amountMinor}, reason: ${reason}`,
    );

    return updatedEscrow;
  }

  /**
   * BANK-GRADE: Initiate dispute
   */
  async initiateDispute(
    escrowId: string,
    actorId: string,
    reason: string,
  ): Promise<EscrowHold> {
    const escrow = await this.prisma.escrowHold.findUnique({
      where: { id: escrowId },
      include: { order: true },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Validate state transition
    this.validateEscrowTransition(escrow.status, EscrowHoldStatus.DISPUTED);

    // Validate actor permission
    this.validateActorPermission(escrow, actorId, 'DISPUTE');

    // Update escrow and order status
    const [updatedEscrow] = await this.prisma.$transaction([
      this.prisma.escrowHold.update({
        where: { id: escrowId },
        data: { status: EscrowHoldStatus.DISPUTED },
      }),
      this.prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: OrderStatus.DISPUTED },
      }),
      this.prisma.dispute.create({
        data: {
          orderId: escrow.orderId,
          openedBy: actorId,
          reason,
          status: 'OPEN',
        },
      }),
    ]);

    this.logger.log(
      `Dispute initiated for escrow ${escrowId} by ${actorId}: ${reason}`,
    );

    return updatedEscrow;
  }

  /**
   * BANK-GRADE: Resolve dispute (admin only)
   */
  async resolveDispute(options: ResolveDisputeOptions): Promise<EscrowHold> {
    const {
      escrowId,
      resolverId,
      buyerRefundMinor,
      sellerAmountMinor,
      platformFeeMinor,
      resolution,
      notes,
      idempotencyKey,
    } = options;

    const escrow = await this.prisma.escrowHold.findUnique({
      where: { id: escrowId },
      include: { order: true, buyerWallet: true, sellerWallet: true },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Validate state transition
    this.validateEscrowTransition(escrow.status, resolution as EscrowHoldStatus);

    // Validate amounts
    const totalDistribution = buyerRefundMinor + sellerAmountMinor + platformFeeMinor;
    if (totalDistribution !== escrow.amountMinor) {
      throw new BadRequestException(
        `Distribution total (${totalDistribution}) must equal escrow amount (${escrow.amountMinor})`,
      );
    }

    if (!escrow.sellerWallet && sellerAmountMinor > 0n) {
      throw new BadRequestException('Seller wallet not set but seller amount > 0');
    }

    // Execute resolution in transaction
    const updatedEscrow = await this.prisma.$transaction(async (tx) => {
      // Get accounts
      const escrowAccount = await this.ledgerService.getOrCreatePlatformAccount(
        'ESCROW_HOLDING',
        'ESCROW',
        'IDR',
        tx,
      );

      const buyerAccount = await this.ledgerService.getOrCreateUserAccount(
        escrow.buyerWallet.id,
        'USER_WALLET',
        'IDR',
        tx,
      );

      const sellerAccount = escrow.sellerWallet
        ? await this.ledgerService.getOrCreateUserAccount(
            escrow.sellerWallet.id,
            'USER_WALLET',
            'IDR',
            tx,
          )
        : null;

      const platformFeeAccount = await this.ledgerService.getOrCreatePlatformAccount(
        'PLATFORM_FEES',
        'REVENUE',
        'IDR',
        tx,
      );

      // Get dispute
      const dispute = await tx.dispute.findFirst({
        where: { orderId: escrow.orderId },
      });

      // Record in ledger
      await this.ledgerService.recordDisputeResolution(
        escrowAccount.id,
        buyerAccount.id,
        sellerAccount?.id ?? buyerAccount.id, // Fallback to buyer if no seller
        platformFeeAccount.id,
        buyerRefundMinor,
        sellerAmountMinor,
        platformFeeMinor,
        dispute?.id ?? escrow.id,
        escrow.orderId,
        idempotencyKey,
        tx,
      );

      // Distribute funds
      // First, unlock all from buyer
      await tx.wallet.update({
        where: { id: escrow.buyerWallet.id },
        data: {
          lockedMinor: { decrement: escrow.amountMinor },
          balanceMinor: { decrement: escrow.amountMinor - buyerRefundMinor },
        },
      });

      // Credit seller if applicable
      if (sellerAmountMinor > 0n && escrow.sellerWallet) {
        await tx.wallet.update({
          where: { id: escrow.sellerWallet.id },
          data: {
            balanceMinor: { increment: sellerAmountMinor },
          },
        });
      }

      // Update escrow status
      const updated = await tx.escrowHold.update({
        where: { id: escrowId },
        data: {
          status: resolution as EscrowHoldStatus,
          resolvedAt: new Date(),
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: escrow.orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Update dispute
      if (dispute) {
        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: 'CLOSED',
            arbitratorId: resolverId,
            decidedAt: new Date(),
            resolutionNotes: notes,
          },
        });
      }

      return updated;
    });

    this.logger.log(
      `Resolved dispute for escrow ${escrowId}: buyer=${buyerRefundMinor}, seller=${sellerAmountMinor}, fee=${platformFeeMinor}`,
    );

    return updatedEscrow;
  }

  /**
   * BANK-GRADE: Auto-release expired escrows (cron job)
   */
  async processExpiredEscrows(): Promise<number> {
    const now = new Date();

    const expiredEscrows = await this.prisma.escrowHold.findMany({
      where: {
        status: EscrowHoldStatus.ACTIVE,
        timeoutAt: { lte: now },
      },
      include: { order: true },
    });

    let processedCount = 0;

    for (const escrow of expiredEscrows) {
      try {
        // Auto-release to seller (default behavior for timeout)
        await this.releaseEscrow({
          escrowId: escrow.id,
          actorId: 'SYSTEM',
          platformFeeMinor: escrow.order.platformFeeMinor,
          idempotencyKey: `auto-release-${escrow.id}-${Date.now()}`,
        });
        processedCount++;
        this.logger.log(`Auto-released expired escrow ${escrow.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to auto-release escrow ${escrow.id}: ${error.message}`,
        );
      }
    }

    return processedCount;
  }

  async healthCheck(): Promise<{ status: string }> {
    this.logger.debug('Health check called');
    return { status: 'ok' };
  }
}

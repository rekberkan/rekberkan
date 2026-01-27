import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { EscrowService } from './escrow.service';
import { ConfigService } from '@nestjs/config';

// ============================================================================
// ESCROW TIMEOUT JOB
// ============================================================================
// Fix #35: Handles automatic escrow timeout and release
// ============================================================================

@Injectable()
export class EscrowTimeoutJob {
  private readonly logger = new Logger(EscrowTimeoutJob.name);
  private readonly batchSize: number;
  private readonly isEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
    private readonly configService: ConfigService,
  ) {
    this.batchSize = this.configService.get<number>('ESCROW_TIMEOUT_BATCH_SIZE', 100);
    this.isEnabled = this.configService.get<string>('ENABLE_ESCROW_TIMEOUT_JOB', 'true') === 'true';
  }

  /**
   * Process expired escrows every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleEscrowTimeouts(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting escrow timeout job');
    const startTime = Date.now();
    let processedCount = 0;
    let errorCount = 0;

    try {
      // Find escrows that have timed out
      const expiredEscrows = await this.prisma.escrowHold.findMany({
        where: {
          status: 'ACTIVE',
          timeoutAt: {
            lte: new Date(),
          },
        },
        include: {
          order: true,
          buyerWallet: true,
          sellerWallet: true,
        },
        take: this.batchSize,
        orderBy: {
          timeoutAt: 'asc',
        },
      });

      if (expiredEscrows.length === 0) {
        this.logger.debug('No expired escrows found');
        return;
      }

      this.logger.log(`Found ${expiredEscrows.length} expired escrows to process`);

      // Process each expired escrow
      for (const escrow of expiredEscrows) {
        try {
          await this.processExpiredEscrow(escrow);
          processedCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to process expired escrow ${escrow.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Escrow timeout job completed: ${processedCount} processed, ${errorCount} errors, ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(`Escrow timeout job failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Process a single expired escrow
   */
  private async processExpiredEscrow(escrow: any): Promise<void> {
    this.logger.log(`Processing expired escrow ${escrow.id} for order ${escrow.orderId}`);

    // Determine action based on order status
    const order = escrow.order;

    if (!order) {
      this.logger.warn(`Escrow ${escrow.id} has no associated order`);
      return;
    }

    // If order is in PAID status and buyer hasn't confirmed, auto-release to seller
    if (order.status === 'PAID') {
      await this.escrowService.releaseEscrow({
        escrowId: escrow.id,
        actorId: 'SYSTEM',
        platformFeeMinor: order.platformFeeMinor,
        idempotencyKey: `timeout_release_${escrow.id}_${Date.now()}`,
      });

      this.logger.log(
        `Auto-released escrow ${escrow.id} to seller due to timeout`,
      );
    }
    // If order is still pending payment, refund to buyer
    else if (['PENDING_ACCEPT', 'ACCEPTED', 'WAITING_COUNTERPARTY'].includes(order.status)) {
      await this.escrowService.refundEscrow({
        escrowId: escrow.id,
        actorId: 'SYSTEM',
        reason: 'Order timeout - payment not completed',
        idempotencyKey: `timeout_refund_${escrow.id}_${Date.now()}`,
      });

      this.logger.log(
        `Auto-refunded escrow ${escrow.id} to buyer due to timeout`,
      );
    }
  }

  /**
   * Process orders with expired invites
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredInvites(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting expired invite cleanup job');

    try {
      // Cancel orders with expired invites that haven't been accepted
      const result = await this.prisma.order.updateMany({
        where: {
          status: 'WAITING_COUNTERPARTY',
          inviteExpiresAt: {
            lte: new Date(),
          },
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cancelled ${result.count} orders with expired invites`);
      }
    } catch (error) {
      this.logger.error(`Expired invite cleanup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Cleanup old completed escrows (for data retention)
   * Runs daily at 3 AM
   */
  @Cron('0 3 * * *')
  async handleDataRetention(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const retentionDays = this.configService.get<number>('ESCROW_RETENTION_DAYS', 365);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(`Starting data retention job (cutoff: ${cutoffDate.toISOString()})`);

    try {
      // Archive old escrows (soft delete or move to archive table)
      // This is a placeholder - actual implementation depends on data retention policy
      const oldEscrows = await this.prisma.escrowHold.count({
        where: {
          status: { in: ['RELEASED', 'REFUNDED'] },
          resolvedAt: {
            lte: cutoffDate,
          },
        },
      });

      this.logger.log(`Found ${oldEscrows} escrows eligible for archival`);

      // TODO: Implement actual archival logic based on compliance requirements
    } catch (error) {
      this.logger.error(`Data retention job failed: ${error.message}`, error.stack);
    }
  }
}

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PaymentStatus, WebhookStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { Request } from 'express';

// ============================================================================
// BANK-GRADE MIDTRANS WEBHOOK CONTROLLER
// Implements: SHA512 Signature Verification, Idempotency, Audit Trail
// ============================================================================

interface MidtransNotificationPayload {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time?: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency: string;
  approval_code?: string;
  acquirer?: string;
  [key: string]: any;
}

@Controller('webhooks/midtrans')
export class MidtransWebhookController {
  private readonly logger = new Logger(MidtransWebhookController.name);
  private readonly serverKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY', '');

    if (!this.serverKey) {
      this.logger.warn(
        '⚠️  MIDTRANS_SERVER_KEY not set! Webhook signature verification will fail.',
      );
    }
  }

  // ============================================================================
  // PAYMENT NOTIFICATION HANDLER
  // ============================================================================

  @Post('notification')
  @HttpCode(HttpStatus.OK)
  async handleNotification(
    @Body() payload: MidtransNotificationPayload,
    @Req() req: Request,
  ): Promise<{ status: string; message: string }> {
    const requestIp = this.getClientIp(req);
    const eventId = payload.transaction_id || `midtrans-${Date.now()}`;

    this.logger.log(
      `Received Midtrans notification: ${eventId}, status: ${payload.transaction_status}`,
    );

    // Step 1: CRITICAL - Verify webhook signature
    const signatureValid = this.verifySignature(payload);

    // Step 2: Store webhook event (for audit trail)
    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: 'MIDTRANS',
        eventId,
        eventType: `payment.${payload.transaction_status}`,
        payload: payload as any,
        status: WebhookStatus.PENDING,
        signatureValid,
        signatureError: signatureValid ? null : 'Invalid signature key',
        requestIp,
        requestHeaders: this.sanitizeHeaders(req.headers),
        providerEventAt: payload.transaction_time
          ? new Date(payload.transaction_time)
          : null,
      },
    });

    // Step 3: Reject if signature invalid
    if (!signatureValid) {
      this.logger.error(
        `Invalid Midtrans signature for transaction ${payload.transaction_id}`,
      );

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: 'Invalid signature key',
          processedAt: new Date(),
        },
      });

      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Step 4: Check idempotency
    const existingEvent = await this.prisma.webhookEvent.findFirst({
      where: {
        eventId,
        status: WebhookStatus.PROCESSED,
        id: { not: webhookEvent.id },
      },
    });

    if (existingEvent) {
      this.logger.warn(`Duplicate Midtrans notification: ${eventId}`);
      return { status: 'ok', message: 'Already processed' };
    }

    try {
      // Step 5: Process the notification
      await this.processNotification(payload, webhookEvent.id);

      // Step 6: Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      return { status: 'ok', message: 'Processed successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to process Midtrans notification ${eventId}: ${error.message}`,
      );

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: error.message,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });

      // Return 200 to prevent Midtrans from retrying (we handle retries internally)
      return { status: 'error', message: 'Processing failed, will retry' };
    }
  }

  // ============================================================================
  // RECURRING PAYMENT NOTIFICATION
  // ============================================================================

  @Post('recurring')
  @HttpCode(HttpStatus.OK)
  async handleRecurringNotification(
    @Body() payload: any,
    @Req() req: Request,
  ): Promise<{ status: string; message: string }> {
    const requestIp = this.getClientIp(req);
    const eventId = payload.transaction_id || `midtrans-recurring-${Date.now()}`;

    this.logger.log(`Received Midtrans recurring notification: ${eventId}`);

    const signatureValid = this.verifySignature(payload);

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: 'MIDTRANS',
        eventId,
        eventType: 'recurring.notification',
        payload: payload as any,
        status: WebhookStatus.PENDING,
        signatureValid,
        signatureError: signatureValid ? null : 'Invalid signature',
        requestIp,
        requestHeaders: this.sanitizeHeaders(req.headers),
      },
    });

    if (!signatureValid) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: WebhookStatus.FAILED, processingError: 'Invalid signature' },
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      // Process recurring payment (similar to regular notification)
      await this.processNotification(payload, webhookEvent.id);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: WebhookStatus.PROCESSED, processedAt: new Date() },
      });

      return { status: 'ok', message: 'Processed successfully' };
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: error.message,
          retryCount: { increment: 1 },
        },
      });
      return { status: 'error', message: 'Processing failed' };
    }
  }

  // ============================================================================
  // PAYOUT NOTIFICATION (for disbursements)
  // ============================================================================

  @Post('payout')
  @HttpCode(HttpStatus.OK)
  async handlePayoutNotification(
    @Body() payload: any,
    @Req() req: Request,
  ): Promise<{ status: string; message: string }> {
    const requestIp = this.getClientIp(req);
    const eventId = payload.reference_no || `midtrans-payout-${Date.now()}`;

    this.logger.log(`Received Midtrans payout notification: ${eventId}`);

    // Payout uses different signature verification
    const signatureValid = this.verifyPayoutSignature(payload);

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: 'MIDTRANS',
        eventId,
        eventType: 'payout.notification',
        payload: payload as any,
        status: WebhookStatus.PENDING,
        signatureValid,
        signatureError: signatureValid ? null : 'Invalid payout signature',
        requestIp,
        requestHeaders: this.sanitizeHeaders(req.headers),
      },
    });

    if (!signatureValid) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: WebhookStatus.FAILED, processingError: 'Invalid signature' },
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      await this.processPayoutNotification(payload, webhookEvent.id);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: WebhookStatus.PROCESSED, processedAt: new Date() },
      });

      return { status: 'ok', message: 'Processed successfully' };
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: error.message,
          retryCount: { increment: 1 },
        },
      });
      return { status: 'error', message: 'Processing failed' };
    }
  }

  // ============================================================================
  // SIGNATURE VERIFICATION (BANK-GRADE)
  // ============================================================================

  /**
   * BANK-GRADE: Verify Midtrans signature using SHA512
   * Formula: SHA512(order_id + status_code + gross_amount + server_key)
   */
  private verifySignature(payload: MidtransNotificationPayload): boolean {
    if (!this.serverKey) {
      this.logger.error('Server key not configured');
      return false;
    }

    if (!payload.signature_key) {
      this.logger.error('No signature key in payload');
      return false;
    }

    const { order_id, status_code, gross_amount, signature_key } = payload;

    // Build signature string according to Midtrans spec
    const signatureString = `${order_id}${status_code}${gross_amount}${this.serverKey}`;

    // Generate expected signature
    const expectedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature_key),
        Buffer.from(expectedSignature),
      );
    } catch {
      // If buffers have different lengths, comparison fails
      return false;
    }
  }

  /**
   * Verify payout signature (different format)
   */
  private verifyPayoutSignature(payload: any): boolean {
    if (!this.serverKey) {
      return false;
    }

    // Payout signature format may differ - implement based on Midtrans docs
    // For now, use similar approach
    const signatureString = `${payload.reference_no}${payload.status}${this.serverKey}`;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex');

    if (!payload.signature_key) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(payload.signature_key),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  // ============================================================================
  // NOTIFICATION PROCESSING
  // ============================================================================

  /**
   * Process payment notification
   */
  private async processNotification(
    payload: MidtransNotificationPayload,
    webhookEventId: string,
  ): Promise<void> {
    const { order_id, transaction_status, fraud_status, gross_amount } = payload;

    // Find payment by order_id (which should be our payment reference)
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { providerInvoiceId: payload.transaction_id },
          {
            paymentDetails: {
              path: ['order_id'],
              equals: order_id,
            },
          },
        ],
      },
    });

    if (!payment) {
      throw new BadRequestException(`Payment not found for order ${order_id}`);
    }

    // Check fraud status
    if (fraud_status === 'deny') {
      this.logger.warn(`Payment ${payment.id} flagged as fraud`);
    }

    // Map Midtrans status to our status
    const newStatus = this.mapMidtransStatus(transaction_status, fraud_status);

    // Update payment in transaction
    await this.prisma.$transaction(async (tx) => {
      // Record status history
      await tx.paymentStatusHistory.create({
        data: {
          paymentId: payment.id,
          fromStatus: payment.status,
          toStatus: newStatus,
          webhookEventId,
          reason: `Midtrans: ${transaction_status}${fraud_status ? ` (fraud: ${fraud_status})` : ''}`,
        },
      });

      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paidAt:
            newStatus === PaymentStatus.SUCCESS
              ? new Date(payload.settlement_time || payload.transaction_time)
              : null,
          paymentDetails: {
            ...(payment.paymentDetails as object),
            midtrans_status: transaction_status,
            fraud_status,
            settlement_time: payload.settlement_time,
            callback_received_at: new Date().toISOString(),
          },
        },
      });

      // Link webhook event to payment
      await tx.webhookEvent.update({
        where: { id: webhookEventId },
        data: { paymentId: payment.id },
      });

      // If payment completed, trigger downstream processes
      if (newStatus === PaymentStatus.SUCCESS) {
        await this.handlePaymentCompleted(payment.id, tx);
      }

      // If payment failed/expired, handle accordingly
      if (
        newStatus === PaymentStatus.FAILED ||
        newStatus === PaymentStatus.EXPIRED
      ) {
        await this.handlePaymentFailed(payment.id, tx);
      }
    });

    this.logger.log(
      `Processed Midtrans notification for payment ${payment.id}: ${transaction_status}`,
    );
  }

  /**
   * Process payout notification (withdrawal)
   */
  private async processPayoutNotification(
    payload: any,
    webhookEventId: string,
  ): Promise<void> {
    const { reference_no, status } = payload;

    // Find withdrawal by reference
    const withdrawal = await this.prisma.withdrawal.findFirst({
      where: { providerDisbursementId: reference_no },
    });

    if (!withdrawal) {
      this.logger.warn(`Withdrawal not found for payout ${reference_no}`);
      return;
    }

    const newStatus = this.mapPayoutStatus(status);

    await this.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: newStatus,
          processedAt: new Date(),
          completedAt: status === 'success' ? new Date() : null,
          providerResponse: payload,
        },
      });

      // If failed, unlock the balance
      if (status === 'failed') {
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            lockedMinor: { decrement: withdrawal.amountMinor },
          },
        });
      }

      // If completed, deduct from locked balance
      if (status === 'success') {
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            balanceMinor: { decrement: withdrawal.amountMinor },
            lockedMinor: { decrement: withdrawal.amountMinor },
          },
        });
      }
    });

    this.logger.log(
      `Processed payout notification for withdrawal ${withdrawal.id}: ${status}`,
    );
  }

  /**
   * Handle completed payment
   */
  private async handlePaymentCompleted(
    paymentId: string,
    tx: any,
  ): Promise<void> {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { deposit: true, order: true },
    });

    if (!payment) return;

    // If this is a deposit payment
    if (payment.deposit) {
      await tx.deposit.update({
        where: { id: payment.deposit.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Credit wallet
      await tx.wallet.update({
        where: { id: payment.deposit.walletId },
        data: {
          balanceMinor: { increment: payment.deposit.amountMinor },
        },
      });
    }

    // If this is an order payment
    if (payment.order) {
      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    paymentId: string,
    tx: any,
  ): Promise<void> {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { deposit: true, order: true },
    });

    if (!payment) return;

    // If this is a deposit payment
    if (payment.deposit) {
      await tx.deposit.update({
        where: { id: payment.deposit.id },
        data: { status: 'FAILED' },
      });
    }

    // If this is an order payment
    if (payment.order) {
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: 'EXPIRED' },
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mapMidtransStatus(
    transactionStatus: string,
    fraudStatus?: string,
  ): PaymentStatus {
    // Check fraud first
    if (fraudStatus === 'deny') {
      return PaymentStatus.FAILED;
    }

    const statusMap: Record<string, PaymentStatus> = {
      capture: PaymentStatus.SUCCESS,
      settlement: PaymentStatus.SUCCESS,
      pending: PaymentStatus.PENDING,
      deny: PaymentStatus.FAILED,
      cancel: PaymentStatus.FAILED,
      expire: PaymentStatus.EXPIRED,
      failure: PaymentStatus.FAILED,
      refund: PaymentStatus.FAILED,
      partial_refund: PaymentStatus.FAILED,
    };

    return statusMap[transactionStatus] ?? PaymentStatus.PENDING;
  }

  private mapPayoutStatus(status: string): any {
    const statusMap: Record<string, string> = {
      success: 'COMPLETED',
      pending: 'PROCESSING',
      failed: 'FAILED',
      queued: 'PENDING',
    };

    return statusMap[status] ?? 'PENDING';
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized['authorization'];
    delete sanitized['cookie'];
    return sanitized;
  }
}

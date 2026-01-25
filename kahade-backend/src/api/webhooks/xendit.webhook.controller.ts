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
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PaymentStatus, WebhookStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { Request } from 'express';

// ============================================================================
// BANK-GRADE XENDIT WEBHOOK CONTROLLER
// Implements: Signature Verification, Idempotency, Audit Trail
// ============================================================================

interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id?: string;
  status: string;
  amount: number;
  paid_amount?: number;
  bank_code?: string;
  paid_at?: string;
  payer_email?: string;
  description?: string;
  payment_method?: string;
  payment_channel?: string;
  currency?: string;
  created?: string;
  updated?: string;
  [key: string]: any;
}

@Controller('webhooks/xendit')
export class XenditWebhookController {
  private readonly logger = new Logger(XenditWebhookController.name);
  private readonly webhookToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.webhookToken = this.configService.get<string>(
      'XENDIT_WEBHOOK_VERIFICATION_TOKEN',
      '',
    );

    if (!this.webhookToken) {
      this.logger.warn(
        '⚠️  XENDIT_WEBHOOK_VERIFICATION_TOKEN not set! Webhook signature verification will fail.',
      );
    }
  }

  // ============================================================================
  // INVOICE CALLBACK (Payment Notification)
  // ============================================================================

  @Post('invoice')
  @HttpCode(HttpStatus.OK)
  async handleInvoiceCallback(
    @Body() payload: XenditWebhookPayload,
    @Headers('x-callback-token') callbackToken: string,
    @Headers('webhook-id') webhookId: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ status: string; message: string }> {
    const requestIp = this.getClientIp(req);
    const eventId = webhookId || payload.id || `xendit-${Date.now()}`;

    this.logger.log(`Received Xendit invoice webhook: ${eventId}`);

    // Step 1: CRITICAL - Verify webhook signature
    const signatureValid = this.verifyCallbackToken(callbackToken);

    // Step 2: Store webhook event (for audit trail)
    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: 'XENDIT',
        eventId,
        eventType: 'invoice.callback',
        payload: payload as any,
        status: WebhookStatus.PENDING,
        signatureValid,
        signatureError: signatureValid ? null : 'Invalid callback token',
        requestIp,
        requestHeaders: this.sanitizeHeaders(req.headers),
      },
    });

    // Step 3: Reject if signature invalid
    if (!signatureValid) {
      this.logger.error(`Invalid webhook signature for event ${eventId}`);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: 'Invalid callback token',
          processedAt: new Date(),
        },
      });

      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Step 4: Check idempotency (prevent duplicate processing)
    const existingEvent = await this.prisma.webhookEvent.findFirst({
      where: {
        eventId,
        status: WebhookStatus.PROCESSED,
        id: { not: webhookEvent.id },
      },
    });

    if (existingEvent) {
      this.logger.warn(`Duplicate webhook event: ${eventId}`);
      return { status: 'ok', message: 'Already processed' };
    }

    try {
      // Step 5: Process the webhook
      await this.processInvoiceCallback(payload, webhookEvent.id);

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
      this.logger.error(`Failed to process webhook ${eventId}: ${error.message}`);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: error.message,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });

      // Return 200 to prevent Xendit from retrying (we handle retries internally)
      return { status: 'error', message: 'Processing failed, will retry' };
    }
  }

  // ============================================================================
  // DISBURSEMENT CALLBACK (Withdrawal Notification)
  // ============================================================================

  @Post('disbursement')
  @HttpCode(HttpStatus.OK)
  async handleDisbursementCallback(
    @Body() payload: any,
    @Headers('x-callback-token') callbackToken: string,
    @Headers('webhook-id') webhookId: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ status: string; message: string }> {
    const requestIp = this.getClientIp(req);
    const eventId = webhookId || payload.id || `xendit-disb-${Date.now()}`;

    this.logger.log(`Received Xendit disbursement webhook: ${eventId}`);

    // Verify signature
    const signatureValid = this.verifyCallbackToken(callbackToken);

    // Store webhook event
    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: 'XENDIT',
        eventId,
        eventType: 'disbursement.callback',
        payload: payload as any,
        status: WebhookStatus.PENDING,
        signatureValid,
        signatureError: signatureValid ? null : 'Invalid callback token',
        requestIp,
        requestHeaders: this.sanitizeHeaders(req.headers),
      },
    });

    if (!signatureValid) {
      this.logger.error(`Invalid disbursement webhook signature: ${eventId}`);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: 'Invalid callback token',
          processedAt: new Date(),
        },
      });

      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      await this.processDisbursementCallback(payload, webhookEvent.id);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      return { status: 'ok', message: 'Processed successfully' };
    } catch (error) {
      this.logger.error(`Failed to process disbursement webhook: ${error.message}`);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          processingError: error.message,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });

      return { status: 'error', message: 'Processing failed' };
    }
  }

  // ============================================================================
  // VIRTUAL ACCOUNT CALLBACK
  // ============================================================================

  @Post('virtual-account')
  @HttpCode(HttpStatus.OK)
  async handleVACallback(
    @Body() payload: any,
    @Headers('x-callback-token') callbackToken: string,
    @Headers('webhook-id') webhookId: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ status: string; message: string }> {
    const requestIp = this.getClientIp(req);
    const eventId = webhookId || payload.id || `xendit-va-${Date.now()}`;

    this.logger.log(`Received Xendit VA webhook: ${eventId}`);

    const signatureValid = this.verifyCallbackToken(callbackToken);

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: 'XENDIT',
        eventId,
        eventType: 'virtual_account.callback',
        payload: payload as any,
        status: WebhookStatus.PENDING,
        signatureValid,
        signatureError: signatureValid ? null : 'Invalid callback token',
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
      await this.processVACallback(payload, webhookEvent.id);

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
  // SIGNATURE VERIFICATION
  // ============================================================================

  /**
   * BANK-GRADE: Verify Xendit callback token
   */
  private verifyCallbackToken(callbackToken: string): boolean {
    if (!this.webhookToken) {
      this.logger.error('Webhook verification token not configured');
      return false;
    }

    if (!callbackToken) {
      this.logger.error('No callback token provided in request');
      return false;
    }

    // Xendit uses a simple token comparison
    // For production, use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(callbackToken),
      Buffer.from(this.webhookToken),
    );
  }

  /**
   * BANK-GRADE: Verify HMAC signature (for some Xendit endpoints)
   */
  private verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  // ============================================================================
  // WEBHOOK PROCESSING
  // ============================================================================

  /**
   * Process invoice callback (payment received)
   */
  private async processInvoiceCallback(
    payload: XenditWebhookPayload,
    webhookEventId: string,
  ): Promise<void> {
    const { external_id, status, amount, paid_amount, paid_at } = payload;

    // Find payment by provider invoice ID
    const payment = await this.prisma.payment.findUnique({
      where: { providerInvoiceId: payload.id },
    });

    if (!payment) {
      // Try finding by external_id (order reference)
      const paymentByExternal = await this.prisma.payment.findFirst({
        where: {
          paymentDetails: {
            path: ['external_id'],
            equals: external_id,
          },
        },
      });

      if (!paymentByExternal) {
        throw new BadRequestException(
          `Payment not found for invoice ${payload.id}`,
        );
      }
    }

    const targetPayment = payment ?? (await this.prisma.payment.findFirst({
      where: {
        paymentDetails: {
          path: ['external_id'],
          equals: external_id,
        },
      },
    }));

    if (!targetPayment) {
      throw new BadRequestException('Payment not found');
    }

    // Map Xendit status to our status
    const newStatus = this.mapXenditStatus(status);

    // Update payment in transaction
    await this.prisma.$transaction(async (tx) => {
      // Record status history
      await tx.paymentStatusHistory.create({
        data: {
          paymentId: targetPayment.id,
          fromStatus: targetPayment.status,
          toStatus: newStatus,
          webhookEventId,
          reason: `Xendit callback: ${status}`,
        },
      });

      // Update payment
      await tx.payment.update({
        where: { id: targetPayment.id },
        data: {
          status: newStatus,
          paidAt: paid_at ? new Date(paid_at) : null,
          paymentDetails: {
            ...(targetPayment.paymentDetails as object),
            xendit_status: status,
            paid_amount: paid_amount ?? amount,
            callback_received_at: new Date().toISOString(),
          },
        },
      });

      // Link webhook event to payment
      await tx.webhookEvent.update({
        where: { id: webhookEventId },
        data: { paymentId: targetPayment.id },
      });

      // If payment completed, trigger downstream processes
      if (newStatus === PaymentStatus.SUCCESS) {
        // Process deposit or order payment
        await this.handlePaymentCompleted(targetPayment.id, tx);
      }
    });

    this.logger.log(
      `Processed invoice callback for payment ${targetPayment.id}: ${status}`,
    );
  }

  /**
   * Process disbursement callback (withdrawal completed)
   */
  private async processDisbursementCallback(
    payload: any,
    webhookEventId: string,
  ): Promise<void> {
    const { id, external_id, status, amount } = payload;

    // Find withdrawal by provider disbursement ID
    const withdrawal = await this.prisma.withdrawal.findFirst({
      where: { providerDisbursementId: id },
    });

    if (!withdrawal) {
      this.logger.warn(`Withdrawal not found for disbursement ${id}`);
      return;
    }

    // Map status
    const newStatus = this.mapDisbursementStatus(status);

    await this.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: newStatus,
          processedAt: new Date(),
          completedAt: status === 'COMPLETED' ? new Date() : null,
          providerResponse: payload,
        },
      });

      // If failed, unlock the balance
      if (status === 'FAILED') {
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            lockedMinor: { decrement: withdrawal.amountMinor },
          },
        });
      }

      // If completed, deduct from locked balance
      if (status === 'COMPLETED') {
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
      `Processed disbursement callback for withdrawal ${withdrawal.id}: ${status}`,
    );
  }

  /**
   * Process VA callback
   */
  private async processVACallback(
    payload: any,
    webhookEventId: string,
  ): Promise<void> {
    // Similar to invoice callback
    await this.processInvoiceCallback(payload, webhookEventId);
  }

  /**
   * Handle completed payment (trigger deposit/order flow)
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

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mapXenditStatus(xenditStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      PAID: PaymentStatus.SUCCESS,
      SETTLED: PaymentStatus.SUCCESS,
      PENDING: PaymentStatus.PENDING,
      EXPIRED: PaymentStatus.EXPIRED,
      FAILED: PaymentStatus.FAILED,
    };

    return statusMap[xenditStatus] ?? PaymentStatus.PENDING;
  }

  private mapDisbursementStatus(status: string): any {
    const statusMap: Record<string, string> = {
      COMPLETED: 'COMPLETED',
      PENDING: 'PROCESSING',
      FAILED: 'FAILED',
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
    // Remove sensitive headers before storing
    const sanitized = { ...headers };
    delete sanitized['authorization'];
    delete sanitized['cookie'];
    delete sanitized['x-callback-token'];
    return sanitized;
  }
}

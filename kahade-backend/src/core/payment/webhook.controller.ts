import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Headers,
  BadRequestException,
  Logger,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiHeader } from "@nestjs/swagger";
import { Public } from "@common/decorators/public.decorator";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { Request } from "express";
import { PrismaService } from "@infrastructure/database/prisma.service";
import { CacheService } from "@infrastructure/cache/cache.service";

// ============================================================================
// BANK-GRADE WEBHOOK CONTROLLER
// Implements: Signature Verification, Idempotency, Secure Processing
// ============================================================================

interface XenditWebhookPayload {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  paid_amount?: number;
  bank_code?: string;
  payment_method?: string;
  created: string;
  updated: string;
  paid_at?: string;
}

interface MidtransWebhookPayload {
  transaction_id: string;
  order_id: string;
  transaction_status: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  signature_key?: string;
  status_code?: string;
  fraud_status?: string;
}

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookTtlSeconds = 24 * 60 * 60;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  @Get("health")
  health() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  // ============================================================================
  // XENDIT WEBHOOK
  // ============================================================================

  @Public()
  @Post("xendit/invoice")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle Xendit invoice webhooks" })
  @ApiHeader({
    name: "x-callback-token",
    description: "Xendit callback verification token",
  })
  async handleXenditInvoice(
    @Headers("x-callback-token") callbackToken: string,
    @Body() payload: XenditWebhookPayload,
  ) {
    // Step 1: Verify callback token
    const expectedToken = this.configService.get<string>(
      "XENDIT_CALLBACK_TOKEN",
    );
    if (!expectedToken) {
      this.logger.error("XENDIT_CALLBACK_TOKEN not configured");
      throw new BadRequestException("Webhook configuration error");
    }

    if (!this.secureCompare(callbackToken, expectedToken)) {
      this.logger.warn(`Invalid Xendit callback token received`);
      throw new BadRequestException("Invalid callback token");
    }

    // Step 2: Check idempotency
    const webhookId = `xendit_invoice_${payload.id}`;
    const idempotencyKey = `webhook:xendit:invoice:${webhookId}`;
    const lockAcquired = await this.cacheService.setnx(
      idempotencyKey,
      true,
      this.webhookTtlSeconds,
    );
    if (!lockAcquired) {
      this.logger.log(`Duplicate webhook ignored: ${webhookId}`);
      return { status: "duplicate", message: "Webhook already processed" };
    }

    // Step 3: Validate payload
    if (!payload.id || !payload.external_id || !payload.status) {
      this.logger.warn("Invalid Xendit payload received");
      throw new BadRequestException("Invalid payload");
    }

    // Step 4: Process webhook
    try {
      this.logger.log(
        `Processing Xendit invoice webhook: ${payload.id}, status: ${payload.status}`,
      );

      // Process payment based on status
      await this.processXenditPayment(payload);

      // Mark as processed
      await this.cacheService.set(idempotencyKey, true, this.webhookTtlSeconds);

      return {
        status: "processed",
        webhookId: payload.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await this.cacheService.del(idempotencyKey);
      this.logger.error(`Failed to process Xendit webhook: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post("xendit/disbursement")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle Xendit disbursement webhooks" })
  @ApiHeader({
    name: "x-callback-token",
    description: "Xendit callback verification token",
  })
  async handleXenditDisbursement(
    @Headers("x-callback-token") callbackToken: string,
    @Body() payload: any,
  ) {
    // Verify callback token
    const expectedToken = this.configService.get<string>(
      "XENDIT_CALLBACK_TOKEN",
    );
    if (!expectedToken || !this.secureCompare(callbackToken, expectedToken)) {
      this.logger.warn("Invalid Xendit disbursement callback token");
      throw new BadRequestException("Invalid callback token");
    }

    const webhookId = `xendit_disbursement_${payload.id}`;
    const idempotencyKey = `webhook:xendit:disbursement:${webhookId}`;
    const lockAcquired = await this.cacheService.setnx(
      idempotencyKey,
      true,
      this.webhookTtlSeconds,
    );
    if (!lockAcquired) {
      return { status: "duplicate" };
    }

    this.logger.log(`Processing Xendit disbursement webhook: ${payload.id}`);
    try {
      // Process withdrawal status update
      await this.processXenditDisbursement(payload);

      await this.cacheService.set(idempotencyKey, true, this.webhookTtlSeconds);

      return { status: "processed" };
    } catch (error) {
      await this.cacheService.del(idempotencyKey);
      throw error;
    }
  }

  // ============================================================================
  // MIDTRANS WEBHOOK
  // ============================================================================

  @Public()
  @Post("midtrans/notification")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle Midtrans payment notifications" })
  async handleMidtransNotification(
    @Body() payload: MidtransWebhookPayload,
    @Req() _req: RawBodyRequest<Request>,
  ) {
    // Step 1: Verify signature
    const serverKey = this.configService.get<string>("MIDTRANS_SERVER_KEY");
    if (!serverKey) {
      this.logger.error("MIDTRANS_SERVER_KEY not configured");
      throw new BadRequestException("Webhook configuration error");
    }

    const expectedSignature = this.generateMidtransSignature(
      payload.order_id,
      payload.status_code || "200",
      payload.gross_amount,
      serverKey,
    );

    if (!payload.signature_key) {
      this.logger.warn("Missing Midtrans signature");
      throw new BadRequestException("Invalid signature");
    }

    if (!this.secureCompare(payload.signature_key, expectedSignature)) {
      this.logger.warn("Invalid Midtrans signature");
      throw new BadRequestException("Invalid signature");
    }

    // Step 2: Check idempotency
    const webhookId = `midtrans_${payload.transaction_id}`;
    const idempotencyKey = `webhook:midtrans:notification:${webhookId}`;
    const lockAcquired = await this.cacheService.setnx(
      idempotencyKey,
      true,
      this.webhookTtlSeconds,
    );
    if (!lockAcquired) {
      return { status: "duplicate" };
    }

    // Step 3: Validate payload
    if (
      !payload.transaction_id ||
      !payload.order_id ||
      !payload.transaction_status
    ) {
      throw new BadRequestException("Invalid payload");
    }

    // Step 4: Process
    this.logger.log(
      `Processing Midtrans notification: ${payload.transaction_id}, status: ${payload.transaction_status}`,
    );
    try {
      // Process payment
      await this.processMidtransPayment(payload);

      await this.cacheService.set(idempotencyKey, true, this.webhookTtlSeconds);

      return { status: "processed" };
    } catch (error) {
      await this.cacheService.del(idempotencyKey);
      throw error;
    }
  }

  // ============================================================================
  // PAYMENT PROCESSING METHODS
  // ============================================================================

  private async processXenditPayment(
    payload: XenditWebhookPayload,
  ): Promise<void> {
    const { external_id, status, amount, paid_amount } = payload;

    // external_id format: "topup_{walletId}_{timestamp}" or "order_{orderId}"
    const parts = external_id.split("_");
    const type = parts[0];
    const entityId = parts[1];

    if (type === "topup") {
      // Process wallet top-up
      await this.processTopUpPayment(entityId, status, paid_amount || amount);
    } else if (type === "order") {
      // Process order payment
      await this.processOrderPayment(entityId, status, paid_amount || amount);
    }
  }

  private async processTopUpPayment(
    walletId: string,
    status: string,
    amount: number,
  ): Promise<void> {
    if (status === "PAID" || status === "SETTLED") {
      // Credit wallet
      await this.prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            balanceMinor: { increment: Math.round(amount * 100) },
          },
        });
      });

      this.logger.log(`Top-up completed for wallet ${walletId}: ${amount}`);
    }
  }

  private async processOrderPayment(
    orderId: string,
    status: string,
    _amount: number,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { initiator: true, counterparty: true },
    });

    if (!order) {
      this.logger.warn(`Order not found: ${orderId}`);
      return;
    }

    if (status === "PAID" || status === "SETTLED") {
      // Update order status to PAID
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      this.logger.log(`Order ${orderId} payment completed`);
    } else if (status === "EXPIRED" || status === "FAILED") {
      // Update order status
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      this.logger.log(`Order ${orderId} payment failed: ${status}`);
    }
  }

  private async processXenditDisbursement(payload: any): Promise<void> {
    const { external_id, status } = payload;

    // external_id format: "withdrawal_{withdrawalId}"
    const parts = external_id.split("_");
    if (parts[0] !== "withdrawal") return;

    const withdrawalId = parts[1];

    if (status === "COMPLETED") {
      await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      this.logger.log(`Withdrawal ${withdrawalId} completed`);
    } else if (status === "FAILED") {
      // Refund the locked amount
      const withdrawal = await this.prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
      });

      if (withdrawal) {
        await this.prisma.$transaction(async (tx) => {
          await tx.withdrawal.update({
            where: { id: withdrawalId },
            data: {
              status: "FAILED",
              rejectionReason: payload.failure_code || "Unknown error",
            },
          });

          // Unlock the amount back to wallet
          await tx.wallet.update({
            where: { id: withdrawal.walletId },
            data: {
              lockedMinor: { decrement: withdrawal.amountMinor },
            },
          });
        });
      }

      this.logger.log(`Withdrawal ${withdrawalId} failed`);
    }
  }

  private async processMidtransPayment(
    payload: MidtransWebhookPayload,
  ): Promise<void> {
    const { order_id, transaction_status, gross_amount, fraud_status } =
      payload;

    // order_id format: "topup_{walletId}_{timestamp}" or "order_{orderId}"
    const parts = order_id.split("_");
    const type = parts[0];
    const entityId = parts[1];
    const amount = parseFloat(gross_amount);

    // Check fraud status
    if (fraud_status === "deny") {
      this.logger.warn(`Payment denied due to fraud: ${order_id}`);
      return;
    }

    // Map Midtrans status to our status
    const isPaid =
      ["capture", "settlement"].includes(transaction_status) &&
      (fraud_status === "accept" || !fraud_status);
    const isFailed = ["deny", "cancel", "expire"].includes(transaction_status);

    if (type === "topup") {
      if (isPaid) {
        await this.processTopUpPayment(entityId, "PAID", amount);
      }
    } else if (type === "order") {
      if (isPaid) {
        await this.processOrderPayment(entityId, "PAID", amount);
      } else if (isFailed) {
        await this.processOrderPayment(entityId, "FAILED", amount);
      }
    }
  }

  // ============================================================================
  // SECURITY HELPERS
  // ============================================================================

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;

    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }

  /**
   * Generate Midtrans signature for verification
   */
  private generateMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    serverKey: string,
  ): string {
    const data = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    return crypto.createHash("sha512").update(data).digest("hex");
  }
}

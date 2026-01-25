import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface IWebhookValidationResult {
  isValid: boolean;
  provider?: string;
  eventType?: string;
  timestamp?: number;
  isReplay?: boolean;
}

@Injectable()
export class WebhookValidatorService {
  private readonly logger = new Logger(WebhookValidatorService.name);
  private readonly replayWindow = 300; // 5 minutes

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate Midtrans webhook signature
   */
  validateMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    const serverKey = this.configService.get<string>('midtrans.serverKey');
    
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    return expectedSignature === signatureKey;
  }

  /**
   * Validate Xendit webhook signature
   */
  validateXenditSignature(
    callbackToken: string,
    expectedToken: string,
  ): boolean {
    return callbackToken === expectedToken;
  }

  /**
   * Validate generic HMAC-SHA256 webhook signature
   */
  validateHMACSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature) {
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Validate webhook timestamp to prevent replay attacks
   */
  validateTimestamp(timestamp: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - timestamp);

    if (diff > this.replayWindow) {
      this.logger.warn(
        `Webhook timestamp outside replay window: ${diff}s (max ${this.replayWindow}s)`,
      );
      return false;
    }

    return true;
  }

  /**
   * Validate complete webhook request
   */
  async validateWebhookRequest(
    provider: 'midtrans' | 'xendit' | 'custom',
    headers: Record<string, string>,
    body: any,
  ): Promise<IWebhookValidationResult> {
    const signature =
      headers['x-signature'] ||
      headers['x-callback-token'] ||
      body?.signature_key;
    const timestamp = parseInt(headers['x-timestamp'] || '0', 10);

    // Validate timestamp (replay attack prevention)
    if (timestamp && !this.validateTimestamp(timestamp)) {
      return {
        isValid: false,
        isReplay: true,
      };
    }

    let isValid = false;

    switch (provider) {
      case 'midtrans':
        isValid = this.validateMidtransSignature(
          body.order_id,
          body.status_code,
          body.gross_amount,
          signature,
        );
        break;

      case 'xendit':
        const expectedToken = this.configService.get<string>(
          'xendit.callbackToken',
        ) || '';
        isValid = this.validateXenditSignature(signature, expectedToken);
        break;

      case 'custom':
        const secret = this.configService.get<string>('webhook.secret') || '';
        const payload = JSON.stringify(body);
        isValid = this.validateHMACSignature(payload, signature, secret);
        break;
    }

    if (!isValid) {
      this.logger.error(
        `Webhook signature validation failed for provider: ${provider}`,
      );
    }

    return {
      isValid,
      provider,
      eventType: body.event_type || body.type,
      timestamp,
      isReplay: false,
    };
  }

  /**
   * Generate webhook signature for outgoing webhooks
   */
  generateWebhookSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
}

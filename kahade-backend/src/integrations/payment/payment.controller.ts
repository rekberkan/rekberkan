import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { WebhookValidatorService } from '@integrations/webhook/webhook-validator.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@infrastructure/cache/cache.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookValidatorService: WebhookValidatorService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  @Public()
  @Post('callback')
  @ApiOperation({ summary: 'Payment gateway callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleCallback(@Body() payload: any, @Headers() headers: Record<string, string>) {
    const provider = (this.configService.get<string>('payment.gateway', 'midtrans') || 'midtrans')
      .toLowerCase() as 'midtrans' | 'xendit' | 'custom';
    const normalizedHeaders = this.normalizeHeaders(headers);

    const validationResult = await this.webhookValidatorService.validateWebhookRequest(
      provider,
      normalizedHeaders,
      payload,
    );

    if (!validationResult.isValid) {
      if (validationResult.isReplay) {
        throw new BadRequestException('Webhook timestamp outside allowed window');
      }
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const idempotencyKey = this.getWebhookIdempotencyKey(payload);
    if (!idempotencyKey) {
      throw new BadRequestException('Webhook payload missing idempotency key');
    }

    const cacheKey = `webhook:${provider}:${idempotencyKey}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = { message: 'Callback received', data: payload };
    await this.cacheService.set(cacheKey, response, 86400);
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('verify/:paymentId')
  @ApiOperation({ summary: 'Verify payment status' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  async verifyPayment(@Param('paymentId') paymentId: string) {
    return this.paymentService.verifyPayment(paymentId);
  }

  private normalizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
    return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'undefined') {
        return acc;
      }
      acc[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value);
      return acc;
    }, {});
  }

  private getWebhookIdempotencyKey(payload: any): string | null {
    return (
      payload?.transaction_id ||
      payload?.order_id ||
      payload?.payment_id ||
      payload?.id ||
      payload?.reference_id ||
      null
    );
  }
}

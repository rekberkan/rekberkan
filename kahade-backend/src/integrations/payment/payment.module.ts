import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { WebhookValidatorService } from '@integrations/webhook/webhook-validator.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, WebhookValidatorService],
  exports: [PaymentService],
})
export class PaymentModule {}

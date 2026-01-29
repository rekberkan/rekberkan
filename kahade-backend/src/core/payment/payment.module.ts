import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaymentRepository } from './payment.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { PaymentModule as PaymentIntegrationModule } from '@integrations/payment/payment.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => PaymentIntegrationModule)],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentRepository],
  exports: [PaymentRepository],
})
export class CorePaymentModule {}

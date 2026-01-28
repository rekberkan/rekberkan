import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryRepository } from './delivery.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryController],
  providers: [DeliveryRepository],
  exports: [DeliveryRepository],
})
export class DeliveryModule {}

import { Module } from '@nestjs/common';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';
import { PromoRepository } from './promo.repository';
import { VoucherRepository } from './voucher.repository';
import { PrismaModule } from '@infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromoController],
  providers: [PromoService, PromoRepository, VoucherRepository],
  exports: [PromoService],
})
export class PromoModule {}

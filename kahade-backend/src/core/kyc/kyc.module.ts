import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycRepository } from './kyc.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [KycController],
  providers: [KycRepository],
  exports: [KycRepository],
})
export class KycModule {}

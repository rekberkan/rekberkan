import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [KycController],
  providers: [],
  exports: [],
})
export class KycModule {}

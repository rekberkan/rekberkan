import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { DisputeModule } from '../dispute/dispute.module';

@Module({
  imports: [DatabaseModule, DisputeModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}

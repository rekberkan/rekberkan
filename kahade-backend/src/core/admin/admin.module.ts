import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}

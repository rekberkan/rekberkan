import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller';
import { RatingRepository } from './rating.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RatingController],
  providers: [RatingRepository],
  exports: [RatingRepository],
})
export class RatingModule {}

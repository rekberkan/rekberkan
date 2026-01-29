import { Module } from "@nestjs/common";
import { ReferralController } from "./referral.controller";
import { ReferralRepository } from "./referral.repository";
import { DatabaseModule } from "@infrastructure/database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [ReferralController],
  providers: [ReferralRepository],
  exports: [ReferralRepository],
})
export class ReferralModule {}

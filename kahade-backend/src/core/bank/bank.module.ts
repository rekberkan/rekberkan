import { Module } from "@nestjs/common";
import { BankController } from "./bank.controller";
import { BankRepository } from "./bank.repository";
import { DatabaseModule } from "@infrastructure/database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [BankController],
  providers: [BankRepository],
  exports: [BankRepository],
})
export class BankModule {}

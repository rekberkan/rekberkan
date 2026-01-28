import { Module, forwardRef } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerLockService } from './ledger-lock.service';
import { LedgerRepository } from './ledger.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [LedgerService, LedgerLockService, LedgerRepository],
  controllers: [],
  exports: [LedgerService, LedgerLockService, LedgerRepository],
})
export class LedgerModule {}

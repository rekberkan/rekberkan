import { Module, forwardRef } from '@nestjs/common';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalGuardService } from './withdrawal-guard.service';
import { WithdrawalRepository } from './withdrawal.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => WalletModule),
    forwardRef(() => LedgerModule),
  ],
  controllers: [WithdrawalController],
  providers: [WithdrawalService, WithdrawalGuardService, WithdrawalRepository],
  exports: [WithdrawalService, WithdrawalGuardService],
})
export class WithdrawalModule {}

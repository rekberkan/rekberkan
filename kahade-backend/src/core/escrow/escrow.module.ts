import { Module, forwardRef } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => WalletModule),
    forwardRef(() => LedgerModule),
  ],
  providers: [EscrowService],
  controllers: [EscrowController],
  exports: [EscrowService],
})
export class EscrowModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionRepository } from './transaction.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { UserModule } from '@core/user/user.module';
import { WalletModule } from '@core/wallet/wallet.module';
import { NotificationModule } from '@core/notification/notification.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => UserModule),
    forwardRef(() => WalletModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionModule {}

import { Module, forwardRef } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { DatabaseModule } from "@infrastructure/database/database.module";
import { EscrowModule } from "../escrow/escrow.module";
import { WalletModule } from "../wallet/wallet.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => EscrowModule),
    forwardRef(() => WalletModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}

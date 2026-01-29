import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// Configuration
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";
import redisConfig from "./config/redis.config";
import emailConfig from "./config/email.config";
import paymentConfig from "./config/payment.config";
import queueConfig from "./config/queue.config";

// Infrastructure
import { DatabaseModule } from "./infrastructure/database/database.module";
import { CacheModule } from "./infrastructure/cache/cache.module";
import { QueueModule } from "./infrastructure/queue/queue.module";
import { StorageModule } from "./infrastructure/storage/storage.module";

// Core Modules
import { ActivityModule } from "./core/activity/activity.module";
import { AdminModule } from "./core/admin/admin.module";
import { AuthModule } from "./core/auth/auth.module";
import { BankModule } from "./core/bank/bank.module";
import { DeliveryModule } from "./core/delivery/delivery.module";
import { DisputeModule } from "./core/dispute/dispute.module";
import { EscrowModule } from "./core/escrow/escrow.module";
import { KycModule } from "./core/kyc/kyc.module";
import { LedgerModule } from "./core/ledger/ledger.module";
import { NotificationModule } from "./core/notification/notification.module";
import { OrderModule } from "./core/order/order.module";
import { CorePaymentModule } from "./core/payment/payment.module";
import { PromoModule } from "./core/promo/promo.module";
import { RatingModule } from "./core/rating/rating.module";
import { ReferralModule } from "./core/referral/referral.module";
import { TransactionModule } from "./core/transaction/transaction.module";
import { UserModule } from "./core/user/user.module";
import { WalletModule } from "./core/wallet/wallet.module";
import { WithdrawalModule } from "./core/withdrawal/withdrawal.module";

// Integration Modules
import { PaymentModule as IntegrationPaymentModule } from "./integrations/payment/payment.module";
import { EmailModule } from "./integrations/email/email.module";

// Jobs
import { JobsModule } from "./jobs/jobs.module";

// Common - Fix #22: Removed unused HttpExceptionFilter import (using AllExceptionsFilter in main.ts)
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        emailConfig,
        paymentConfig,
        queueConfig,
      ],
      envFilePath: [`.env.${process.env.NODE_ENV || "development"}`, ".env"],
    }),

    // Rate Limiting - Fix #23: Increased default from 10 to 100
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>("app.rateLimit.ttl") || 60,
            limit: config.get<number>("app.rateLimit.limit") || 100, // Fixed: Increased from 10 to 100
          },
        ],
      }),
    }),

    // Infrastructure
    DatabaseModule,
    CacheModule,
    QueueModule,
    StorageModule,

    // Core Modules
    ActivityModule,
    AdminModule,
    AuthModule,
    BankModule,
    DeliveryModule,
    DisputeModule,
    EscrowModule,
    KycModule,
    LedgerModule,
    NotificationModule,
    OrderModule,
    CorePaymentModule,
    PromoModule,
    RatingModule,
    ReferralModule,
    TransactionModule,
    UserModule,
    WalletModule,
    WithdrawalModule,

    // Integration Modules
    IntegrationPaymentModule,
    EmailModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Fix #22: Removed APP_FILTER with HttpExceptionFilter (using AllExceptionsFilter in main.ts)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // Middleware configuration can be added here if needed
  }
}

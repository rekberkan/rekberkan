import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { CacheModule } from '@infrastructure/cache/cache.module';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [CacheModule, AuthModule],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class GuardsModule {}

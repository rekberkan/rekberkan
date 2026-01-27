import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '@infrastructure/database/prisma.module';

// ============================================================================
// AUDIT MODULE
// ============================================================================
// Provides audit logging for admin actions
// ============================================================================

@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

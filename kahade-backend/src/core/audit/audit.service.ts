import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@infrastructure/database/prisma.service";

// ============================================================================
// AUDIT LOG SERVICE
// ============================================================================
// Fix #57: Tracks all admin actions for compliance and security
// ============================================================================

export enum AuditAction {
  // User management
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  USER_SUSPEND = "USER_SUSPEND",
  USER_UNSUSPEND = "USER_UNSUSPEND",
  USER_KYC_APPROVE = "USER_KYC_APPROVE",
  USER_KYC_REJECT = "USER_KYC_REJECT",

  // Order management
  ORDER_CANCEL = "ORDER_CANCEL",
  ORDER_FORCE_COMPLETE = "ORDER_FORCE_COMPLETE",

  // Escrow management
  ESCROW_FORCE_RELEASE = "ESCROW_FORCE_RELEASE",
  ESCROW_FORCE_REFUND = "ESCROW_FORCE_REFUND",

  // Dispute management
  DISPUTE_RESOLVE = "DISPUTE_RESOLVE",
  DISPUTE_ESCALATE = "DISPUTE_ESCALATE",

  // Wallet management
  WALLET_ADJUSTMENT = "WALLET_ADJUSTMENT",
  WALLET_FREEZE = "WALLET_FREEZE",
  WALLET_UNFREEZE = "WALLET_UNFREEZE",

  // Withdrawal management
  WITHDRAWAL_APPROVE = "WITHDRAWAL_APPROVE",
  WITHDRAWAL_REJECT = "WITHDRAWAL_REJECT",

  // System configuration
  CONFIG_UPDATE = "CONFIG_UPDATE",
  FEATURE_FLAG_UPDATE = "FEATURE_FLAG_UPDATE",

  // Security
  ADMIN_LOGIN = "ADMIN_LOGIN",
  ADMIN_LOGOUT = "ADMIN_LOGOUT",
  PERMISSION_GRANT = "PERMISSION_GRANT",
  PERMISSION_REVOKE = "PERMISSION_REVOKE",
}

export interface AuditLogEntry {
  action: AuditAction;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  details?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an admin action
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          performedBy: entry.actorId,
          entityType: entry.targetType,
          entityId: entry.targetId,
          details: JSON.parse(
            JSON.stringify({
              actorEmail: entry.actorEmail,
              actorRole: entry.actorRole,
              targetName: entry.targetName,
              previousState: entry.previousState || {},
              newState: entry.newState || {},
              requestId: entry.requestId,
              ...entry.details,
            }),
          ),
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: new Date(),
        },
      });

      this.logger.log(
        `Audit: ${entry.action} by ${entry.actorId} on ${entry.targetType}:${entry.targetId}`,
      );
    } catch (error: unknown) {
      // Never fail the main operation due to audit logging
      const err = error as Error;
      this.logger.error(
        `Failed to create audit log: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Log user management action
   */
  async logUserAction(
    action: AuditAction,
    actor: { id: string; email?: string; role?: string },
    targetUser: { id: string; email?: string },
    details?: Record<string, unknown>,
    request?: { ip?: string; userAgent?: string; id?: string },
  ): Promise<void> {
    await this.log({
      action,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetType: "User",
      targetId: targetUser.id,
      targetName: targetUser.email,
      details,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestId: request?.id,
    });
  }

  /**
   * Log escrow action
   */
  async logEscrowAction(
    action: AuditAction,
    actor: { id: string; email?: string; role?: string },
    escrow: { id: string; orderId?: string },
    details?: Record<string, unknown>,
    request?: { ip?: string; userAgent?: string; id?: string },
  ): Promise<void> {
    await this.log({
      action,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetType: "Escrow",
      targetId: escrow.id,
      targetName: escrow.orderId,
      details,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestId: request?.id,
    });
  }

  /**
   * Log wallet action
   */
  async logWalletAction(
    action: AuditAction,
    actor: { id: string; email?: string; role?: string },
    wallet: { id: string; userId?: string },
    previousBalance: bigint,
    newBalance: bigint,
    reason: string,
    request?: { ip?: string; userAgent?: string; id?: string },
  ): Promise<void> {
    await this.log({
      action,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetType: "Wallet",
      targetId: wallet.id,
      targetName: wallet.userId,
      previousState: { balance: previousBalance.toString() },
      newState: { balance: newBalance.toString() },
      details: { reason },
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestId: request?.id,
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(filters: {
    action?: AuditAction;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: unknown[]; total: number }> {
    const { page = 1, limit = 50, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: {
      action?: string;
      performedBy?: string;
      entityType?: string;
      entityId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (where.action) whereClause.action = where.action;
    if (where.actorId) whereClause.performedBy = where.actorId;
    if (where.targetType) whereClause.entityType = where.targetType;
    if (where.targetId) whereClause.entityId = where.targetId;
    if (where.startDate || where.endDate) {
      whereClause.createdAt = {};
      if (where.startDate) whereClause.createdAt.gte = where.startDate;
      if (where.endDate) whereClause.createdAt.lte = where.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: whereClause }),
    ]);

    return { logs, total };
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(
    targetType: string,
    targetId: string,
  ): Promise<unknown[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: targetType,
        entityId: targetId,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import * as crypto from 'crypto';

// ============================================================================
// BANK-GRADE SESSION REPOSITORY
// Implements: Token Hashing, Session Families, Rotation Tracking
// ============================================================================

interface CreateSessionData {
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class SessionRepository {
  private readonly logger = new Logger(SessionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * BANK-GRADE: Create new session with hashed token
   */
  async create(data: CreateSessionData) {
    // Hash the token before storing (never store raw tokens)
    const tokenHash = this.hashToken(data.token);
    const sessionFamilyId = crypto.randomUUID();

    const session = await this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshHash: tokenHash,
        expiresAt: data.expiresAt,
        sessionFamilyId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });

    this.logger.debug(`Created session ${session.id} for user ${data.userId}`);

    return session;
  }

  /**
   * BANK-GRADE: Find session by token
   */
  async findByToken(token: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.session.findFirst({
      where: {
        refreshHash: tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * BANK-GRADE: Find all active sessions for user
   */
  async findActiveByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * BANK-GRADE: Revoke session by token
   */
  async revoke(token: string, reason: string = 'revoked') {
    const tokenHash = this.hashToken(token);

    const result = await this.prisma.session.updateMany({
      where: {
        refreshHash: tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count > 0) {
      this.logger.debug(`Revoked session: ${reason}`);
    }

    return result;
  }

  /**
   * BANK-GRADE: Revoke all sessions for user
   */
  async revokeAllByUserId(userId: string, reason: string = 'logout_all'): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Revoked ${result.count} sessions for user ${userId}: ${reason}`);

    return result.count;
  }

  /**
   * BANK-GRADE: Revoke session family (for token rotation security)
   */
  async revokeSessionFamily(sessionFamilyId: string, reason: string = 'family_revoked') {
    const result = await this.prisma.session.updateMany({
      where: {
        sessionFamilyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.warn(`Revoked session family ${sessionFamilyId}: ${reason}, count: ${result.count}`);

    return result;
  }

  /**
   * BANK-GRADE: Rotate session (create new, link to old)
   */
  async rotateSession(
    oldToken: string,
    newData: CreateSessionData,
  ) {
    const oldTokenHash = this.hashToken(oldToken);
    const newTokenHash = this.hashToken(newData.token);

    // Find old session
    const oldSession = await this.prisma.session.findFirst({
      where: { refreshHash: oldTokenHash },
    });

    if (!oldSession) {
      throw new Error('Session not found for rotation');
    }

    // Create new session and revoke old in transaction
    const [newSession] = await this.prisma.$transaction([
      this.prisma.session.create({
        data: {
          userId: newData.userId,
          refreshHash: newTokenHash,
          expiresAt: newData.expiresAt,
          sessionFamilyId: oldSession.sessionFamilyId, // Keep same family
          userAgent: newData.userAgent,
          ipAddress: newData.ipAddress,
        },
      }),
      this.prisma.session.update({
        where: { id: oldSession.id },
        data: {
          revokedAt: new Date(),
          rotatedAt: new Date(),
        },
      }),
    ]);

    // Update old session with reference to new
    await this.prisma.session.update({
      where: { id: oldSession.id },
      data: {
        replacedBySessionId: newSession.id,
      },
    });

    this.logger.debug(`Rotated session ${oldSession.id} -> ${newSession.id}`);

    return newSession;
  }

  /**
   * BANK-GRADE: Detect token reuse (security breach)
   */
  async detectTokenReuse(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const session = await this.prisma.session.findFirst({
      where: {
        refreshHash: tokenHash,
        revokedAt: { not: null },
        rotatedAt: { not: null },
      },
    });

    if (session) {
      // Token was already rotated - this is a reuse attempt!
      this.logger.error(`TOKEN REUSE DETECTED! Session: ${session.id}, Family: ${session.sessionFamilyId}`);

      // Revoke entire session family as security measure
      await this.revokeSessionFamily(session.sessionFamilyId!, 'token_reuse_detected');

      return true;
    }

    return false;
  }

  /**
   * BANK-GRADE: Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            AND: [
              { revokedAt: { not: null } },
              { revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Older than 7 days
            ],
          },
        ],
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired sessions`);
    }

    return result.count;
  }

  /**
   * BANK-GRADE: Get session statistics for user
   */
  async getSessionStats(userId: string) {
    const [active, total] = await Promise.all([
      this.prisma.session.count({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
      this.prisma.session.count({
        where: { userId },
      }),
    ]);

    return { active, total };
  }

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { LedgerJournal, LedgerEntry, LedgerAccount, JournalType } from '@common/shims/prisma-types.shim';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// ============================================================================
// BANK-GRADE LEDGER SERVICE
// Implements: Double-Entry Accounting, Immutable Ledger, Audit Trail
// ============================================================================

export class LedgerInvariantError extends InternalServerErrorException {
  constructor(journalId: string, sum: bigint) {
    super({
      code: 'LEDGER_INVARIANT_VIOLATION',
      message: 'Critical: Double-entry invariant violated. Sum of entries must be zero.',
      journalId,
      sum: sum.toString(),
    });
  }
}

export class DuplicateIdempotencyKeyError extends BadRequestException {
  constructor(key: string) {
    super({
      code: 'DUPLICATE_IDEMPOTENCY_KEY',
      message: 'This operation has already been processed',
      idempotencyKey: key,
    });
  }
}

export interface LedgerEntryInput {
  accountId: string;
  amountMinor: bigint; // Positive for debit, negative for credit
}

export interface CreateJournalOptions {
  type: JournalType;
  amountMinor: bigint;
  description: string;
  entries: LedgerEntryInput[];
  idempotencyKey?: string;
  depositId?: string;
  withdrawalId?: string;
  orderId?: string;
  escrowHoldId?: string;
  disputeId?: string;
  referralRewardId?: string;
  voucherUsageId?: string;
  orderSettlementId?: string;
  tx?: Prisma.TransactionClient;
}

export interface JournalWithEntries extends LedgerJournal {
  entries: LedgerEntry[];
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================================
  // CORE LEDGER OPERATIONS (BANK-GRADE DOUBLE-ENTRY)
  // ============================================================================

  /**
   * BANK-GRADE: Create journal entry with double-entry validation
   * CRITICAL: Sum of all entries MUST equal zero (balanced)
   */
  async createJournal(options: CreateJournalOptions): Promise<JournalWithEntries> {
    const {
      type,
      amountMinor,
      description,
      entries,
      idempotencyKey,
      tx,
      ...linkIds
    } = options;

    const prisma = tx ?? this.prisma;

    // Step 1: Validate double-entry invariant
    const sum = entries.reduce((acc, entry) => acc + entry.amountMinor, 0n);
    if (sum !== 0n) {
      this.logger.error(
        `Double-entry invariant violation: sum=${sum}, entries=${JSON.stringify(entries)}`,
      );
      throw new LedgerInvariantError('pre-validation', sum);
    }

    // Step 2: Check idempotency
    if (idempotencyKey) {
      const existing = await prisma.ledgerJournal.findUnique({
        where: { idempotencyKey },
        include: { entries: true },
      });

      if (existing) {
        this.logger.warn(`Duplicate idempotency key: ${idempotencyKey}`);
        return existing as JournalWithEntries;
      }
    }

    // Step 3: Create journal and entries atomically
    const journal = await prisma.ledgerJournal.create({
      data: {
        type,
        amountMinor,
        description,
        idempotencyKey,
        ...linkIds,
        entries: {
          create: entries.map((entry) => ({
            accountId: entry.accountId,
            amountMinor: entry.amountMinor,
          })),
        },
      },
      include: {
        entries: true,
      },
    });

    // Step 4: Update running balances for each account
    for (const entry of journal.entries) {
      await this.updateRunningBalance(entry.accountId, entry.id, prisma);
    }

    // Step 5: Post-validation (paranoid check)
    const postSum = journal.entries.reduce(
      (acc, entry) => acc + entry.amountMinor,
      0n,
    );
    if (postSum !== 0n) {
      this.logger.error(
        `CRITICAL: Post-creation invariant violation for journal ${journal.id}`,
      );
      throw new LedgerInvariantError(journal.id, postSum);
    }

    this.logger.log(
      `Created journal ${journal.id} (${type}) with ${entries.length} entries`,
    );

    return journal as JournalWithEntries;
  }

  /**
   * BANK-GRADE: Record deposit transaction
   */
  async recordDeposit(
    userAccountId: string,
    platformAccountId: string,
    amountMinor: bigint,
    depositId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalWithEntries> {
    return this.createJournal({
      type: 'DEPOSIT' as JournalType,
      amountMinor,
      description: `Deposit ${amountMinor} to user wallet`,
      depositId,
      idempotencyKey,
      entries: [
        { accountId: userAccountId, amountMinor: amountMinor }, // Debit user (increase)
        { accountId: platformAccountId, amountMinor: -amountMinor }, // Credit platform (liability)
      ],
      tx,
    });
  }

  /**
   * BANK-GRADE: Record withdrawal transaction
   */
  async recordWithdrawal(
    userAccountId: string,
    platformAccountId: string,
    amountMinor: bigint,
    withdrawalId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalWithEntries> {
    return this.createJournal({
      type: 'WITHDRAWAL' as JournalType,
      amountMinor,
      description: `Withdrawal ${amountMinor} from user wallet`,
      withdrawalId,
      idempotencyKey,
      entries: [
        { accountId: userAccountId, amountMinor: -amountMinor }, // Credit user (decrease)
        { accountId: platformAccountId, amountMinor: amountMinor }, // Debit platform (reduce liability)
      ],
      tx,
    });
  }

  /**
   * BANK-GRADE: Record escrow hold
   */
  async recordEscrowHold(
    buyerAccountId: string,
    escrowAccountId: string,
    amountMinor: bigint,
    escrowHoldId: string,
    orderId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalWithEntries> {
    return this.createJournal({
      type: 'ESCROW_HOLD' as JournalType,
      amountMinor,
      description: `Escrow hold for order ${orderId}`,
      escrowHoldId,
      orderId,
      idempotencyKey,
      entries: [
        { accountId: buyerAccountId, amountMinor: -amountMinor }, // Credit buyer (decrease available)
        { accountId: escrowAccountId, amountMinor: amountMinor }, // Debit escrow (hold funds)
      ],
      tx,
    });
  }

  /**
   * BANK-GRADE: Record escrow release to seller
   */
  async recordEscrowRelease(
    escrowAccountId: string,
    sellerAccountId: string,
    platformFeeAccountId: string,
    amountMinor: bigint,
    platformFeeMinor: bigint,
    escrowHoldId: string,
    orderId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalWithEntries> {
    const sellerAmount = amountMinor - platformFeeMinor;

    return this.createJournal({
      type: 'ESCROW_RELEASE' as JournalType,
      amountMinor,
      description: `Escrow release for order ${orderId}`,
      escrowHoldId,
      orderId,
      idempotencyKey,
      entries: [
        { accountId: escrowAccountId, amountMinor: -amountMinor }, // Credit escrow (release)
        { accountId: sellerAccountId, amountMinor: sellerAmount }, // Debit seller (receive)
        { accountId: platformFeeAccountId, amountMinor: platformFeeMinor }, // Debit platform fee
      ],
      tx,
    });
  }

  /**
   * BANK-GRADE: Record escrow refund to buyer
   */
  async recordEscrowRefund(
    escrowAccountId: string,
    buyerAccountId: string,
    amountMinor: bigint,
    escrowHoldId: string,
    orderId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalWithEntries> {
    return this.createJournal({
      type: 'ESCROW_REFUND' as JournalType,
      amountMinor,
      description: `Escrow refund for order ${orderId}`,
      escrowHoldId,
      orderId,
      idempotencyKey,
      entries: [
        { accountId: escrowAccountId, amountMinor: -amountMinor }, // Credit escrow (release)
        { accountId: buyerAccountId, amountMinor: amountMinor }, // Debit buyer (refund)
      ],
      tx,
    });
  }

  /**
   * BANK-GRADE: Record dispute resolution with split
   */
  async recordDisputeResolution(
    escrowAccountId: string,
    buyerAccountId: string,
    sellerAccountId: string,
    platformFeeAccountId: string,
    buyerRefundMinor: bigint,
    sellerAmountMinor: bigint,
    platformFeeMinor: bigint,
    disputeId: string,
    orderId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalWithEntries> {
    const totalEscrow = buyerRefundMinor + sellerAmountMinor + platformFeeMinor;

    const entries: LedgerEntryInput[] = [
      { accountId: escrowAccountId, amountMinor: -totalEscrow },
    ];

    if (buyerRefundMinor > 0n) {
      entries.push({ accountId: buyerAccountId, amountMinor: buyerRefundMinor });
    }
    if (sellerAmountMinor > 0n) {
      entries.push({ accountId: sellerAccountId, amountMinor: sellerAmountMinor });
    }
    if (platformFeeMinor > 0n) {
      entries.push({ accountId: platformFeeAccountId, amountMinor: platformFeeMinor });
    }

    return this.createJournal({
      type: 'DISPUTE_RESOLUTION' as JournalType,
      amountMinor: totalEscrow,
      description: `Dispute resolution for order ${orderId}`,
      disputeId,
      orderId,
      idempotencyKey,
      entries,
      tx,
    });
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  /**
   * Get or create ledger account for user wallet
   */
  async getOrCreateUserAccount(
    walletId: string,
    type: string = 'USER_WALLET',
    currency: string = 'IDR',
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerAccount> {
    const prisma = tx ?? this.prisma;

    const existing = await prisma.ledgerAccount.findFirst({
      where: {
        walletId,
        type: type as any,
        currency: currency as any,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.ledgerAccount.create({
      data: {
        walletId,
        type: type as any,
        currency: currency as any,
      },
    });
  }

  /**
   * Get or create platform account (escrow, fees, etc.)
   */
  async getOrCreatePlatformAccount(
    platformKey: string,
    type: string,
    currency: string = 'IDR',
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerAccount> {
    const prisma = tx ?? this.prisma;

    const existing = await prisma.ledgerAccount.findFirst({
      where: {
        platformKey,
        type: type as any,
        currency: currency as any,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.ledgerAccount.create({
      data: {
        platformKey,
        type: type as any,
        currency: currency as any,
      },
    });
  }

  // ============================================================================
  // BALANCE QUERIES
  // ============================================================================

  /**
   * Calculate account balance from ledger entries
   */
  async getAccountBalance(accountId: string): Promise<bigint> {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: { accountId },
      _sum: { amountMinor: true },
    });

    return result._sum.amountMinor ?? 0n;
  }

  /**
   * Get account statement (entries with running balance)
   */
  async getAccountStatement(
    accountId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<LedgerEntry[]> {
    const where: any = { accountId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    return this.prisma.ledgerEntry.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: {
        journal: true,
      },
    });
  }

  // ============================================================================
  // INTEGRITY CHECKS
  // ============================================================================

  /**
   * BANK-GRADE: Verify all journals are balanced
   */
  async verifyAllJournalsBalanced(): Promise<{
    totalJournals: number;
    unbalancedJournals: string[];
    isHealthy: boolean;
  }> {
    const journals = await this.prisma.ledgerJournal.findMany({
      include: { entries: true },
    });

    const unbalancedJournals: string[] = [];

    for (const journal of journals) {
      const sum = journal.entries.reduce(
        (acc, entry) => acc + entry.amountMinor,
        0n,
      );
      if (sum !== 0n) {
        unbalancedJournals.push(journal.id);
        this.logger.error(
          `Unbalanced journal detected: ${journal.id}, sum=${sum}`,
        );
      }
    }

    return {
      totalJournals: journals.length,
      unbalancedJournals,
      isHealthy: unbalancedJournals.length === 0,
    };
  }

  /**
   * BANK-GRADE: Verify platform accounts balance (should net to zero)
   */
  async verifyPlatformBalance(): Promise<{
    totalBalance: bigint;
    isBalanced: boolean;
    accountBalances: Record<string, bigint>;
  }> {
    const platformAccounts = await this.prisma.ledgerAccount.findMany({
      where: { platformKey: { not: null } },
    });

    const accountBalances: Record<string, bigint> = {};
    let totalBalance = 0n;

    for (const account of platformAccounts) {
      const balance = await this.getAccountBalance(account.id);
      accountBalances[account.platformKey!] = balance;
      totalBalance += balance;
    }

    return {
      totalBalance,
      isBalanced: totalBalance === 0n,
      accountBalances,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Update running balance for an entry
   */
  private async updateRunningBalance(
    accountId: string,
    entryId: string,
    prisma: Prisma.TransactionClient | PrismaService,
  ): Promise<void> {
    // Get all entries for this account up to and including this entry
    const entries = await prisma.ledgerEntry.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    let runningBalance = 0n;
    for (const entry of entries) {
      runningBalance += entry.amountMinor;
      if (entry.id === entryId) {
        await prisma.ledgerEntry.update({
          where: { id: entryId },
          data: { runningBalanceMinor: runningBalance },
        });
        break;
      }
    }
  }

  /**
   * Generate idempotency key for operations
   */
  generateIdempotencyKey(
    operation: string,
    ...identifiers: string[]
  ): string {
    const data = [operation, ...identifiers, Date.now().toString()].join(':');
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  async healthCheck(): Promise<{ status: string }> {
    this.logger.debug('Health check called');
    return { status: 'ok' };
  }
}

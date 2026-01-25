import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Ledger Lock Service
 * 
 * Implements pessimistic locking for concurrent ledger operations.
 * Prevents double-spending and ensures data consistency.
 */
@Injectable()
export class LedgerLockService {
  private readonly logger = new Logger(LedgerLockService.name);
  private readonly LOCK_TIMEOUT_MS = 5000; // 5 seconds

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute ledger operation with wallet lock
   * 
   * Acquires pessimistic lock on wallet row before performing operation.
   * Prevents concurrent modifications to the same wallet.
   */
  async withWalletLock<T>(
    walletId: string,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return await this.prisma.$transaction(
      async (tx) => {
        // Acquire FOR UPDATE lock on wallet
        const wallet = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM wallets
          WHERE id = ${walletId}
          FOR UPDATE
        `;

        if (!wallet || wallet.length === 0) {
          throw new Error(`Wallet ${walletId} not found`);
        }

        // Execute operation within locked context
        return await operation(tx);
      },
      {
        timeout: this.LOCK_TIMEOUT_MS,
      },
    );
  }

  /**
   * Execute ledger operation with multiple wallet locks
   * 
   * Acquires locks in deterministic order (by wallet ID) to prevent deadlocks.
   */
  async withMultipleWalletLocks<T>(
    walletIds: string[],
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    // Sort wallet IDs to ensure consistent lock order (prevent deadlocks)
    const sortedWalletIds = [...walletIds].sort();

    return await this.prisma.$transaction(
      async (tx) => {
        // Acquire FOR UPDATE locks on all wallets
        for (const walletId of sortedWalletIds) {
          await tx.$queryRaw`
            SELECT id FROM wallets
            WHERE id = ${walletId}
            FOR UPDATE
          `;
        }

        // Execute operation within locked context
        return await operation(tx);
      },
      {
        timeout: this.LOCK_TIMEOUT_MS,
      },
    );
  }

  /**
   * Create double-entry ledger transaction with automatic validation
   */
  async createDoubleEntry(
    tx: Prisma.TransactionClient,
    journalData: {
      type: string;
      description: string;
      metadata?: any;
    },
    entries: Array<{
      walletId: string;
      type: 'DEBIT' | 'CREDIT';
      amountMinor: bigint;
      balanceAfterMinor: bigint;
    }>,
  ): Promise<string> {
    // Validate double-entry invariant: sum must be zero
    let sum = 0n;
    for (const entry of entries) {
      if (entry.type === 'DEBIT') {
        sum += entry.amountMinor;
      } else {
        sum -= entry.amountMinor;
      }
    }

    if (sum !== 0n) {
      throw new Error(`Double-entry invariant violated: sum is ${sum}, expected 0`);
    }

    // Create journal
    const journal = await (tx as any).ledgerJournal.create({
      data: {
        type: journalData.type,
        description: journalData.description,
        metadata: journalData.metadata,
        totalAmountMinor: entries.reduce((acc, e) => acc + (e.type === 'DEBIT' ? e.amountMinor : 0n), 0n),
      },
    });

    // Create entries
    for (const entry of entries) {
      await (tx as any).ledgerEntry.create({
        data: {
          journalId: journal.id,
          walletId: entry.walletId,
          type: entry.type,
          amountMinor: entry.amountMinor,
          balanceAfterMinor: entry.balanceAfterMinor,
        },
      });
    }

    this.logger.debug(`Created ledger journal ${journal.id} with ${entries.length} entries`);

    return journal.id;
  }

  /**
   * Validate ledger integrity for a wallet
   */
  async validateWalletLedger(walletId: string): Promise<{
    isValid: boolean;
    expectedBalance: bigint;
    actualBalance: bigint;
    discrepancy: bigint;
  }> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    // Calculate expected balance from ledger entries
    const entries = await (this.prisma as any).ledgerEntry.findMany({
      where: { walletId },
    });

    let expectedBalance = 0n;
    for (const entry of entries) {
      if (entry.type === 'CREDIT') {
        expectedBalance += entry.amountMinor;
      } else {
        expectedBalance -= entry.amountMinor;
      }
    }

    const actualBalance = wallet.balanceMinor;
    const discrepancy = actualBalance - expectedBalance;

    return {
      isValid: discrepancy === 0n,
      expectedBalance,
      actualBalance,
      discrepancy,
    };
  }
}

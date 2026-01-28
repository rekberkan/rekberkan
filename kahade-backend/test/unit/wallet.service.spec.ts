import { Test, TestingModule } from '@nestjs/testing';
import { WalletService, InsufficientBalanceError } from '../../src/core/wallet/wallet.service';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LedgerService } from '../../src/core/ledger/ledger.service';
import { BadRequestException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  // Mocked services for potential assertions in extended tests
  let _prismaService: jest.Mocked<PrismaService>;
  let _ledgerService: jest.Mocked<LedgerService>;

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockLedgerService = {
    getOrCreateUserAccount: jest.fn(),
    getOrCreatePlatformAccount: jest.fn(),
    recordDeposit: jest.fn(),
    recordWithdrawal: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LedgerService, useValue: mockLedgerService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    _prismaService = module.get(PrismaService);
    _ledgerService = module.get(LedgerService);

    jest.clearAllMocks();
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 0n,
        currency: 'IDR',
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getOrCreateWallet('user-1');

      expect(result).toEqual(mockWallet);
      expect(mockPrismaService.wallet.create).not.toHaveBeenCalled();
    });

    it('should create new wallet if not exists', async () => {
      const mockNewWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 0n,
        lockedMinor: 0n,
        currency: 'IDR',
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue(mockNewWallet);

      const result = await service.getOrCreateWallet('user-1');

      expect(result).toEqual(mockNewWallet);
      expect(mockPrismaService.wallet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          balanceMinor: 0n,
          lockedMinor: 0n,
          currency: 'IDR',
        }),
      });
    });
  });

  describe('getBalance', () => {
    it('should return formatted balance', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 25000n,
        currency: 'IDR',
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getBalance('user-1');

      expect(result).toEqual({
        available: 750, // (100000 - 25000) / 100
        locked: 250, // 25000 / 100
        total: 1000, // 100000 / 100
        currency: 'IDR',
      });
    });

    it('should return zero balance if wallet not found (auto-create)', async () => {
      // The service auto-creates wallet if not found, so it returns zero balance
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getBalance('user-1');
      expect(result.total).toBe(0);
      expect(result.available).toBe(0);
      expect(result.locked).toBe(0);
    });
  });

  describe('lockBalance', () => {
    it('should lock balance successfully', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 0n,
        version: 1,
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.wallet.updateMany.mockResolvedValue({ count: 1 });

      await service.lockBalance({
        userId: 'user-1',
        amount: 50000n,
        reason: 'Escrow hold',
      });

      expect(mockPrismaService.wallet.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
          data: expect.objectContaining({
            lockedMinor: { increment: 50000n },
          }),
        }),
      );
    });

    it('should throw if insufficient available balance', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 80000n, // Only 20000 available
        version: 1,
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        service.lockBalance({
          userId: 'user-1',
          amount: 50000n,
          reason: 'Escrow hold',
        }),
      ).rejects.toThrow(InsufficientBalanceError);
    });
  });

  describe('unlockBalance', () => {
    it('should unlock balance successfully', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 50000n,
        version: 1,
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.wallet.update.mockResolvedValue({
        ...mockWallet,
        lockedMinor: 0n,
      });

      await service.unlockBalance('user-1', 50000n, 'Escrow refund');

      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: expect.objectContaining({
            lockedMinor: { decrement: 50000n },
          }),
        }),
      );
    });

    it('should throw if trying to unlock more than locked', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 20000n,
        version: 1,
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.unlockBalance('user-1', 50000n, 'Escrow refund')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('creditBalance', () => {
    it('should credit balance successfully', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 0n,
        version: 1,
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.wallet.update.mockResolvedValue({
        ...mockWallet,
        balanceMinor: 150000n,
      });
      mockPrismaService.walletTransaction.create.mockResolvedValue({
        id: 'tx-1',
        type: 'CREDIT',
        amount: 50000n,
      });

      await service.creditBalance({
        userId: 'user-1',
        amount: 50000n,
        reason: 'Top up',
        referenceType: 'DEPOSIT',
        referenceId: 'deposit-1',
      });

      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: expect.objectContaining({
            balanceMinor: { increment: 50000n },
          }),
        }),
      );
    });
  });

  describe('deductBalance', () => {
    it('should deduct balance successfully', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 0n,
        version: 1,
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.walletTransaction.create.mockResolvedValue({
        id: 'tx-1',
        type: 'DEBIT',
        amount: 50000n,
      });

      await service.deductBalance({
        userId: 'user-1',
        amount: 50000n,
        reason: 'Withdrawal',
        referenceType: 'WITHDRAWAL',
        referenceId: 'withdrawal-1',
      });

      expect(mockPrismaService.wallet.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
          data: expect.objectContaining({
            balanceMinor: { decrement: 50000n },
          }),
        }),
      );
    });

    it('should throw if insufficient balance', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 30000n,
        lockedMinor: 0n,
        version: 1,
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        service.deductBalance({
          userId: 'user-1',
          amount: 50000n,
          reason: 'Withdrawal',
          referenceType: 'WITHDRAWAL',
          referenceId: 'withdrawal-1',
        }),
      ).rejects.toThrow(InsufficientBalanceError);
    });
  });

  describe('transferLockedBalance', () => {
    it('should transfer locked balance between users', async () => {
      const mockFromWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balanceMinor: 100000n,
        lockedMinor: 50000n,
      };

      const mockToWallet = {
        id: 'wallet-2',
        userId: 'user-2',
        balanceMinor: 0n,
        lockedMinor: 0n,
      };

      mockPrismaService.wallet.findUnique
        .mockResolvedValueOnce(mockFromWallet)
        .mockResolvedValueOnce(mockToWallet);

      await service.transferLockedBalance('user-1', 'user-2', 50000n, 'Escrow release');

      // Verify from wallet update (deduct locked and balance)
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );

      // Verify to wallet update (credit balance)
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-2' },
        }),
      );
    });
  });
});

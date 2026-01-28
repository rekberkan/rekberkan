import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EscrowService, InvalidStateTransitionError } from '../../src/core/escrow/escrow.service';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../../src/core/wallet/wallet.service';
import { LedgerService } from '../../src/core/ledger/ledger.service';
import { EscrowHoldStatus, OrderStatus } from '@prisma/client';

describe('EscrowService', () => {
  let service: EscrowService;
  // Mocked services for potential assertions in extended tests
  let _prismaService: jest.Mocked<PrismaService>;
  let _walletService: jest.Mocked<WalletService>;
  let _ledgerService: jest.Mocked<LedgerService>;

  const mockPrismaService = {
    escrowHold: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    dispute: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockWalletService = {
    lockBalance: jest.fn(),
    unlockBalance: jest.fn(),
    transferLockedBalance: jest.fn(),
  };

  const mockLedgerService = {
    getOrCreateUserAccount: jest.fn(),
    getOrCreatePlatformAccount: jest.fn(),
    recordEscrowHold: jest.fn(),
    recordEscrowRelease: jest.fn(),
    recordEscrowRefund: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: LedgerService, useValue: mockLedgerService },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
    _prismaService = module.get(PrismaService);
    _walletService = module.get(WalletService);
    _ledgerService = module.get(LedgerService);

    jest.clearAllMocks();
  });

  describe('State Machine Validation', () => {
    it('should allow ACTIVE -> RELEASED transition', () => {
      expect(() =>
        service.validateEscrowTransition(EscrowHoldStatus.ACTIVE, EscrowHoldStatus.RELEASED),
      ).not.toThrow();
    });

    it('should allow ACTIVE -> REFUNDED transition', () => {
      expect(() =>
        service.validateEscrowTransition(EscrowHoldStatus.ACTIVE, EscrowHoldStatus.REFUNDED),
      ).not.toThrow();
    });

    it('should allow ACTIVE -> DISPUTED transition', () => {
      expect(() =>
        service.validateEscrowTransition(EscrowHoldStatus.ACTIVE, EscrowHoldStatus.DISPUTED),
      ).not.toThrow();
    });

    it('should reject RELEASED -> ACTIVE transition (terminal state)', () => {
      expect(() =>
        service.validateEscrowTransition(EscrowHoldStatus.RELEASED, EscrowHoldStatus.ACTIVE),
      ).toThrow(InvalidStateTransitionError);
    });

    it('should reject REFUNDED -> RELEASED transition (terminal state)', () => {
      expect(() =>
        service.validateEscrowTransition(EscrowHoldStatus.REFUNDED, EscrowHoldStatus.RELEASED),
      ).toThrow(InvalidStateTransitionError);
    });

    it('should allow DISPUTED -> RELEASED transition', () => {
      expect(() =>
        service.validateEscrowTransition(EscrowHoldStatus.DISPUTED, EscrowHoldStatus.RELEASED),
      ).not.toThrow();
    });

    it('should allow DISPUTED -> REFUNDED transition', () => {
      expect(() =>
        service.validateEscrowTransition(EscrowHoldStatus.DISPUTED, EscrowHoldStatus.REFUNDED),
      ).not.toThrow();
    });
  });

  describe('Order State Machine Validation', () => {
    it('should allow WAITING_COUNTERPARTY -> PENDING_ACCEPT transition', () => {
      expect(() =>
        service.validateOrderTransition(
          OrderStatus.WAITING_COUNTERPARTY,
          OrderStatus.PENDING_ACCEPT,
        ),
      ).not.toThrow();
    });

    it('should allow PAID -> COMPLETED transition', () => {
      expect(() =>
        service.validateOrderTransition(OrderStatus.PAID, OrderStatus.COMPLETED),
      ).not.toThrow();
    });

    it('should allow PAID -> DISPUTED transition', () => {
      expect(() =>
        service.validateOrderTransition(OrderStatus.PAID, OrderStatus.DISPUTED),
      ).not.toThrow();
    });

    it('should reject COMPLETED -> PAID transition (terminal state)', () => {
      expect(() =>
        service.validateOrderTransition(OrderStatus.COMPLETED, OrderStatus.PAID),
      ).toThrow(InvalidStateTransitionError);
    });

    it('should reject CANCELLED -> ACCEPTED transition (terminal state)', () => {
      expect(() =>
        service.validateOrderTransition(OrderStatus.CANCELLED, OrderStatus.ACCEPTED),
      ).toThrow(InvalidStateTransitionError);
    });
  });

  describe('createEscrow', () => {
    const mockBuyerWallet = { id: 'wallet-1', userId: 'buyer-1' };
    const mockSellerWallet = { id: 'wallet-2', userId: 'seller-1' };
    const mockEscrow = {
      id: 'escrow-1',
      orderId: 'order-1',
      buyerWalletId: 'wallet-1',
      sellerWalletId: 'wallet-2',
      amountMinor: 100000n,
      status: EscrowHoldStatus.ACTIVE,
    };

    beforeEach(() => {
      mockPrismaService.escrowHold.findFirst.mockResolvedValue(null);
      mockPrismaService.wallet.findUnique
        .mockResolvedValueOnce(mockBuyerWallet)
        .mockResolvedValueOnce(mockSellerWallet);
      mockPrismaService.escrowHold.create.mockResolvedValue(mockEscrow);
      mockLedgerService.getOrCreateUserAccount.mockResolvedValue({ id: 'account-1' });
      mockLedgerService.getOrCreatePlatformAccount.mockResolvedValue({ id: 'platform-account-1' });
    });

    it('should create escrow successfully', async () => {
      const result = await service.createEscrow({
        orderId: 'order-1',
        buyerUserId: 'buyer-1',
        sellerUserId: 'seller-1',
        amountMinor: 100000n,
        idempotencyKey: 'idem-1',
      });

      expect(result).toEqual(mockEscrow);
      expect(mockWalletService.lockBalance).toHaveBeenCalled();
      expect(mockLedgerService.recordEscrowHold).toHaveBeenCalled();
    });

    it('should return existing escrow if already exists (idempotency)', async () => {
      mockPrismaService.escrowHold.findFirst.mockResolvedValue(mockEscrow);

      const result = await service.createEscrow({
        orderId: 'order-1',
        buyerUserId: 'buyer-1',
        sellerUserId: 'seller-1',
        amountMinor: 100000n,
        idempotencyKey: 'idem-1',
      });

      expect(result).toEqual(mockEscrow);
      expect(mockWalletService.lockBalance).not.toHaveBeenCalled();
    });

    it('should throw if buyer wallet not found', async () => {
      // Reset mock and set up for this specific test
      mockPrismaService.escrowHold.findFirst.mockReset();
      mockPrismaService.wallet.findUnique.mockReset();
      mockPrismaService.escrowHold.findFirst.mockResolvedValue(null);
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(
        service.createEscrow({
          orderId: 'order-1',
          buyerUserId: 'buyer-1',
          sellerUserId: 'seller-1',
          amountMinor: 100000n,
          idempotencyKey: 'idem-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('releaseEscrow', () => {
    const mockEscrow = {
      id: 'escrow-1',
      orderId: 'order-1',
      buyerWalletId: 'wallet-1',
      sellerWalletId: 'wallet-2',
      amountMinor: 100000n,
      status: EscrowHoldStatus.ACTIVE,
      buyerWallet: { id: 'wallet-1', userId: 'buyer-1' },
      sellerWallet: { id: 'wallet-2', userId: 'seller-1' },
      order: {
        id: 'order-1',
        initiatorId: 'buyer-1',
        counterpartyId: 'seller-1',
        initiatorRole: 'BUYER',
      },
    };

    beforeEach(() => {
      mockPrismaService.escrowHold.findUnique.mockResolvedValue(mockEscrow);
      mockPrismaService.escrowHold.update.mockResolvedValue({
        ...mockEscrow,
        status: EscrowHoldStatus.RELEASED,
      });
      mockLedgerService.getOrCreatePlatformAccount.mockResolvedValue({ id: 'platform-account-1' });
      mockLedgerService.getOrCreateUserAccount.mockResolvedValue({ id: 'account-1' });
    });

    it('should release escrow successfully', async () => {
      const result = await service.releaseEscrow({
        escrowId: 'escrow-1',
        actorId: 'buyer-1',
        platformFeeMinor: 2500n,
        idempotencyKey: 'idem-1',
      });

      expect(result.status).toBe(EscrowHoldStatus.RELEASED);
      expect(mockWalletService.transferLockedBalance).toHaveBeenCalled();
      expect(mockLedgerService.recordEscrowRelease).toHaveBeenCalled();
    });

    it('should throw if escrow not found', async () => {
      mockPrismaService.escrowHold.findUnique.mockResolvedValue(null);

      await expect(
        service.releaseEscrow({
          escrowId: 'escrow-1',
          actorId: 'buyer-1',
          platformFeeMinor: 2500n,
          idempotencyKey: 'idem-1',
        }),
      ).rejects.toThrow('Escrow not found');
    });
  });

  describe('refundEscrow', () => {
    const mockEscrow = {
      id: 'escrow-1',
      orderId: 'order-1',
      buyerWalletId: 'wallet-1',
      amountMinor: 100000n,
      status: EscrowHoldStatus.ACTIVE,
      buyerWallet: { id: 'wallet-1', userId: 'buyer-1' },
      order: {
        id: 'order-1',
        initiatorId: 'buyer-1',
        counterpartyId: 'seller-1',
        initiatorRole: 'BUYER',
      },
    };

    beforeEach(() => {
      mockPrismaService.escrowHold.findUnique.mockResolvedValue(mockEscrow);
      mockPrismaService.escrowHold.update.mockResolvedValue({
        ...mockEscrow,
        status: EscrowHoldStatus.REFUNDED,
      });
      mockLedgerService.getOrCreatePlatformAccount.mockResolvedValue({ id: 'platform-account-1' });
      mockLedgerService.getOrCreateUserAccount.mockResolvedValue({ id: 'account-1' });
    });

    it('should refund escrow successfully', async () => {
      const result = await service.refundEscrow({
        escrowId: 'escrow-1',
        actorId: 'seller-1',
        reason: 'Item not available',
        idempotencyKey: 'idem-1',
      });

      expect(result.status).toBe(EscrowHoldStatus.REFUNDED);
      expect(mockWalletService.unlockBalance).toHaveBeenCalled();
      expect(mockLedgerService.recordEscrowRefund).toHaveBeenCalled();
    });

    it('should allow SYSTEM to refund (timeout)', async () => {
      const result = await service.refundEscrow({
        escrowId: 'escrow-1',
        actorId: 'SYSTEM',
        reason: 'Timeout',
        idempotencyKey: 'idem-1',
      });

      expect(result.status).toBe(EscrowHoldStatus.REFUNDED);
    });
  });
});

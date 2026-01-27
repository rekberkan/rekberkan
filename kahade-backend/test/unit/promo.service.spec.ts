import { Test, TestingModule } from '@nestjs/testing';
import { PromoService } from '../../src/core/promo/promo.service';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { VoucherStatus, VoucherType } from '@prisma/client';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('PromoService', () => {
  let service: PromoService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    promo: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    promoAssignment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    voucher: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    voucherUsage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PromoService>(PromoService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('validateVoucher', () => {
    const mockVoucher = {
      id: 'voucher-1',
      code: 'DISCOUNT10',
      voucherType: VoucherType.PERCENTAGE,
      discountPercent: 10,
      discountMinor: null,
      maxDiscountMinor: 50000n,
      minPurchaseMinor: 100000n,
      maxUsages: 100,
      currentUsages: 50,
      status: VoucherStatus.ACTIVE,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      assignedToUserId: null,
      applicableCategories: null,
      promoId: null,
    };

    it('should validate voucher successfully', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue(mockVoucher);
      mockPrismaService.voucherUsage.count.mockResolvedValue(0);

      const result = await service.validateVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
      );

      expect(result.valid).toBe(true);
      expect(result.voucher).toBeDefined();
    });

    it('should reject non-existent voucher', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue(null);

      const result = await service.validateVoucher(
        'INVALID',
        'user-1',
        200000n,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voucher not found');
    });

    it('should reject inactive voucher', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue({
        ...mockVoucher,
        status: VoucherStatus.INACTIVE,
      });

      const result = await service.validateVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voucher is not active');
    });

    it('should reject expired voucher', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue({
        ...mockVoucher,
        validUntil: new Date('2020-01-01'),
      });

      const result = await service.validateVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voucher has expired');
    });

    it('should reject voucher with usage limit reached', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue({
        ...mockVoucher,
        currentUsages: 100,
        maxUsages: 100,
      });

      const result = await service.validateVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voucher usage limit reached');
    });

    it('should reject voucher assigned to different user', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue({
        ...mockVoucher,
        assignedToUserId: 'user-2',
      });

      const result = await service.validateVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voucher is not available for this user');
    });

    it('should reject if minimum purchase not met', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue(mockVoucher);

      const result = await service.validateVoucher(
        'DISCOUNT10',
        'user-1',
        50000n, // Below minimum
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum purchase');
    });

    it('should reject if user already used voucher', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue(mockVoucher);
      mockPrismaService.voucherUsage.count.mockResolvedValue(1);

      const result = await service.validateVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You have already used this voucher');
    });
  });

  describe('applyVoucher', () => {
    const mockVoucher = {
      id: 'voucher-1',
      code: 'DISCOUNT10',
      voucherType: VoucherType.PERCENTAGE,
      discountPercent: 10,
      discountMinor: null,
      maxDiscountMinor: 50000n,
      minPurchaseMinor: 100000n,
      maxUsages: 100,
      currentUsages: 50,
      status: VoucherStatus.ACTIVE,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      assignedToUserId: null,
      applicableCategories: null,
      promoId: null,
    };

    beforeEach(() => {
      mockPrismaService.voucher.findUnique.mockResolvedValue(mockVoucher);
      mockPrismaService.voucherUsage.count.mockResolvedValue(0);
      mockPrismaService.voucherUsage.findUnique.mockResolvedValue(null);
    });

    it('should apply percentage voucher correctly', async () => {
      const result = await service.applyVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
        'order-1',
        'idem-1',
      );

      expect(result.discountMinor).toBe(20000n); // 10% of 200000
      expect(result.finalMinor).toBe(180000n);
    });

    it('should cap discount at maxDiscountMinor', async () => {
      const result = await service.applyVoucher(
        'DISCOUNT10',
        'user-1',
        1000000n, // 10% = 100000, but max is 50000
        'order-1',
        'idem-1',
      );

      expect(result.discountMinor).toBe(50000n); // Capped at max
      expect(result.finalMinor).toBe(950000n);
    });

    it('should apply fixed amount voucher correctly', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue({
        ...mockVoucher,
        voucherType: VoucherType.FIXED_AMOUNT,
        discountMinor: 25000n,
        discountPercent: null,
      });

      const result = await service.applyVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
        'order-1',
        'idem-1',
      );

      expect(result.discountMinor).toBe(25000n);
      expect(result.finalMinor).toBe(175000n);
    });

    it('should return existing result for idempotent request', async () => {
      const existingUsage = {
        voucherId: 'voucher-1',
        discountMinor: 20000n,
        originalMinor: 200000n,
        finalMinor: 180000n,
      };

      mockPrismaService.voucherUsage.findUnique.mockResolvedValue(existingUsage);

      const result = await service.applyVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
        'order-1',
        'idem-1',
      );

      expect(result.discountMinor).toBe(20000n);
      expect(mockPrismaService.voucherUsage.create).not.toHaveBeenCalled();
    });

    it('should increment voucher usage count', async () => {
      await service.applyVoucher(
        'DISCOUNT10',
        'user-1',
        200000n,
        'order-1',
        'idem-1',
      );

      expect(mockPrismaService.voucher.update).toHaveBeenCalledWith({
        where: { id: 'voucher-1' },
        data: { currentUsages: { increment: 1 } },
      });
    });
  });

  describe('createVoucher', () => {
    it('should create voucher successfully', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue(null);
      mockPrismaService.voucher.create.mockResolvedValue({
        id: 'voucher-1',
        code: 'NEWVOUCHER',
        voucherType: VoucherType.FIXED_AMOUNT,
        discountMinor: 50000n,
        status: VoucherStatus.ACTIVE,
      });

      const result = await service.createVoucher({
        code: 'NEWVOUCHER',
        voucherType: VoucherType.FIXED_AMOUNT,
        discountMinor: 50000,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
      });

      expect(result.code).toBe('NEWVOUCHER');
      expect(mockPrismaService.voucher.create).toHaveBeenCalled();
    });

    it('should reject duplicate voucher code', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue({
        id: 'existing-voucher',
        code: 'DUPLICATE',
      });

      await expect(
        service.createVoucher({
          code: 'DUPLICATE',
          voucherType: VoucherType.FIXED_AMOUNT,
          discountMinor: 50000,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2025-12-31'),
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should convert code to uppercase', async () => {
      mockPrismaService.voucher.findUnique.mockResolvedValue(null);
      mockPrismaService.voucher.create.mockResolvedValue({
        id: 'voucher-1',
        code: 'LOWERCASE',
      });

      await service.createVoucher({
        code: 'lowercase',
        voucherType: VoucherType.FIXED_AMOUNT,
        discountMinor: 50000,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
      });

      expect(mockPrismaService.voucher.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'LOWERCASE',
          }),
        })
      );
    });
  });

  describe('getAvailableVouchersForUser', () => {
    it('should return available vouchers for user', async () => {
      const mockVouchers = [
        {
          id: 'voucher-1',
          code: 'PUBLIC10',
          assignedToUserId: null,
          currentUsages: 5,
          maxUsages: 100,
          promoId: null,
        },
        {
          id: 'voucher-2',
          code: 'PERSONAL20',
          assignedToUserId: 'user-1',
          currentUsages: 0,
          maxUsages: 1,
          promoId: null,
        },
      ];

      mockPrismaService.voucher.findMany.mockResolvedValue(mockVouchers);
      mockPrismaService.voucherUsage.count.mockResolvedValue(0);

      const result = await service.getAvailableVouchersForUser('user-1');

      expect(result.length).toBe(2);
      expect(result[0].remainingUsages).toBe(95);
      expect(result[1].remainingUsages).toBe(1);
    });

    it('should exclude vouchers user has already used to max', async () => {
      const mockVouchers = [
        {
          id: 'voucher-1',
          code: 'USED',
          assignedToUserId: null,
          currentUsages: 5,
          maxUsages: 100,
          promoId: null,
        },
      ];

      mockPrismaService.voucher.findMany.mockResolvedValue(mockVouchers);
      mockPrismaService.voucherUsage.count.mockResolvedValue(1); // User already used

      const result = await service.getAvailableVouchersForUser('user-1');

      expect(result.length).toBe(0);
    });
  });
});

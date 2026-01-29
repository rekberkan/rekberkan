/**
 * Bank Repository Unit Tests
 * 
 * QUALITY FIX [H004]: Added test coverage for bank account operations
 * Tests: encryption, decryption, CRUD operations, security validation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BankRepository } from '../../src/core/bank/bank.repository';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('BankRepository', () => {
  let repository: BankRepository;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  const mockBankAccount = {
    id: 'bank-123',
    userId: 'user-123',
    bankName: 'BCA',
    accountNumberEnc: 'encrypted-account-number',
    accountNumberLast4: '1234',
    accountNameEnc: 'encrypted-account-name',
    isDefault: true,
    isActive: true,
    isVerified: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankRepository,
        {
          provide: PrismaService,
          useValue: {
            bankAccount: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'NODE_ENV': 'test',
                'BANK_ENCRYPTION_KEY': 'test-bank-encryption-key-32-chars!',
                'BANK_ENCRYPTION_SALT': 'test-salt-value',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    repository = module.get<BankRepository>(BankRepository);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return bank accounts for user', async () => {
      const mockAccounts = [mockBankAccount];
      (prismaService.bankAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await repository.findByUserId('user-123');

      expect(prismaService.bankAccount.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          deletedAt: null,
          isActive: true,
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array if no accounts found', async () => {
      (prismaService.bankAccount.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByUserId('user-456');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return bank account by id and userId', async () => {
      (prismaService.bankAccount.findFirst as jest.Mock).mockResolvedValue(mockBankAccount);

      const result = await repository.findById('bank-123', 'user-123');

      expect(prismaService.bankAccount.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bank-123',
          userId: 'user-123',
          deletedAt: null,
        },
      });
      expect(result).toEqual(mockBankAccount);
    });

    it('should return null if account not found', async () => {
      (prismaService.bankAccount.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('invalid-id', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create bank account with encrypted data', async () => {
      const createData = {
        userId: 'user-123',
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'John Doe',
      };

      (prismaService.bankAccount.count as jest.Mock).mockResolvedValue(0);
      (prismaService.bankAccount.create as jest.Mock).mockResolvedValue(mockBankAccount);

      const result = await repository.create(createData);

      expect(prismaService.bankAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createData.userId,
          bankName: createData.bankName,
          accountNumberLast4: '7890',
          isDefault: true, // First account should be default
          isActive: true,
          isVerified: false,
        }),
      });
      
      // Verify encrypted fields are not plain text
      const createCall = (prismaService.bankAccount.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.accountNumberEnc).not.toBe(createData.accountNumber);
      expect(createCall.data.accountNameEnc).not.toBe(createData.accountHolderName);
    });

    it('should not set as default if user has existing accounts', async () => {
      const createData = {
        userId: 'user-123',
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'John Doe',
      };

      (prismaService.bankAccount.count as jest.Mock).mockResolvedValue(2);
      (prismaService.bankAccount.create as jest.Mock).mockResolvedValue(mockBankAccount);

      await repository.create(createData);

      const createCall = (prismaService.bankAccount.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.isDefault).toBe(false);
    });

    it('should extract last 4 digits of account number', async () => {
      const createData = {
        userId: 'user-123',
        bankName: 'BCA',
        accountNumber: '9876543210',
        accountHolderName: 'John Doe',
      };

      (prismaService.bankAccount.count as jest.Mock).mockResolvedValue(0);
      (prismaService.bankAccount.create as jest.Mock).mockResolvedValue(mockBankAccount);

      await repository.create(createData);

      const createCall = (prismaService.bankAccount.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.accountNumberLast4).toBe('3210');
    });
  });

  describe('softDelete', () => {
    it('should soft delete bank account', async () => {
      (prismaService.bankAccount.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await repository.softDelete('bank-123', 'user-123');

      expect(prismaService.bankAccount.updateMany).toHaveBeenCalledWith({
        where: { id: 'bank-123', userId: 'user-123', deletedAt: null },
        data: expect.objectContaining({
          isActive: false,
        }),
      });
      
      // Verify deletedAt is set
      const updateCall = (prismaService.bankAccount.updateMany as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('setAsDefault', () => {
    it('should unset all accounts and set selected as default', async () => {
      (prismaService.bankAccount.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await repository.setAsDefault('bank-123', 'user-123');

      // First call: unset all as default
      expect(prismaService.bankAccount.updateMany).toHaveBeenNthCalledWith(1, {
        where: { userId: 'user-123', deletedAt: null },
        data: { isDefault: false },
      });

      // Second call: set selected as default
      expect(prismaService.bankAccount.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 'bank-123', userId: 'user-123', deletedAt: null },
        data: { isDefault: true },
      });
    });
  });

  describe('getDecryptedAccount', () => {
    it('should return account with decrypted data', async () => {
      // Create a real encrypted account
      const createData = {
        userId: 'user-123',
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'John Doe',
      };

      (prismaService.bankAccount.count as jest.Mock).mockResolvedValue(0);
      
      // First create to get encrypted values
      let encryptedAccount: any;
      (prismaService.bankAccount.create as jest.Mock).mockImplementation((data) => {
        encryptedAccount = {
          ...mockBankAccount,
          accountNumberEnc: data.data.accountNumberEnc,
          accountNameEnc: data.data.accountNameEnc,
        };
        return encryptedAccount;
      });

      await repository.create(createData);

      // Now test decryption
      (prismaService.bankAccount.findFirst as jest.Mock).mockResolvedValue(encryptedAccount);

      const result = await repository.getDecryptedAccount('bank-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.accountNumber).toBe(createData.accountNumber);
      expect(result?.accountHolderName).toBe(createData.accountHolderName);
    });

    it('should return null if account not found', async () => {
      (prismaService.bankAccount.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.getDecryptedAccount('invalid-id', 'user-123');

      expect(result).toBeNull();
    });

    it('should handle decryption errors gracefully', async () => {
      const invalidEncryptedAccount = {
        ...mockBankAccount,
        accountNumberEnc: 'invalid-encrypted-data',
        accountNameEnc: 'invalid-encrypted-data',
      };

      (prismaService.bankAccount.findFirst as jest.Mock).mockResolvedValue(invalidEncryptedAccount);

      const result = await repository.getDecryptedAccount('bank-123', 'user-123');

      // Should return masked data on decryption failure
      expect(result?.accountNumber).toBe('****');
      expect(result?.accountHolderName).toBe('****');
    });
  });

  describe('encryption key validation', () => {
    it('should throw error in production without encryption key', async () => {
      const prodConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'BANK_ENCRYPTION_KEY') return undefined;
          return undefined;
        }),
      };

      expect(() => {
        new BankRepository(prismaService, prodConfigService as any);
      }).toThrow('CRITICAL: BANK_ENCRYPTION_KEY must be configured in production');
    });
  });
});

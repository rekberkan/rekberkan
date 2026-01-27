import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

@Injectable()
export class BankRepository {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly prisma: PrismaService) {
    // In production, this should come from environment/KMS
    const secret = process.env.BANK_ENCRYPTION_KEY || 'default-encryption-key-32-chars!';
    this.encryptionKey = scryptSync(secret, 'salt', 32);
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '****';
    }
  }

  async findByUserId(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: {
        userId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findById(id: string, userId: string) {
    return this.prisma.bankAccount.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  async findByAccountNumber(userId: string, bankName: string, accountNumberLast4: string) {
    return this.prisma.bankAccount.findFirst({
      where: {
        userId,
        bankName,
        accountNumberLast4,
        deletedAt: null,
      },
    });
  }

  async create(data: {
    userId: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  }) {
    // Encrypt sensitive data
    const accountNumberEnc = this.encrypt(data.accountNumber);
    const accountNameEnc = this.encrypt(data.accountHolderName);
    const accountNumberLast4 = data.accountNumber.slice(-4);

    // Check if this is the first account (make it default)
    const existingCount = await this.prisma.bankAccount.count({
      where: {
        userId: data.userId,
        deletedAt: null,
      },
    });

    return this.prisma.bankAccount.create({
      data: {
        userId: data.userId,
        bankName: data.bankName,
        accountNumberEnc,
        accountNumberLast4,
        accountNameEnc,
        isDefault: existingCount === 0,
        isActive: true,
        isVerified: false,
      },
    });
  }

  async update(id: string, userId: string, data: Partial<{
    accountHolderName: string;
    isActive: boolean;
    isVerified: boolean;
  }>) {
    const updateData: Record<string, any> = {};
    
    if (data.accountHolderName) {
      updateData.accountNameEnc = this.encrypt(data.accountHolderName);
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    if (data.isVerified !== undefined) {
      updateData.isVerified = data.isVerified;
    }

    return this.prisma.bankAccount.updateMany({
      where: { id, userId, deletedAt: null },
      data: updateData,
    });
  }

  async softDelete(id: string, userId: string) {
    return this.prisma.bankAccount.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async setAsDefault(id: string, userId: string) {
    // First, unset all as default
    await this.prisma.bankAccount.updateMany({
      where: { userId, deletedAt: null },
      data: { isDefault: false },
    });
    
    // Then set the selected one as default
    return this.prisma.bankAccount.updateMany({
      where: { id, userId, deletedAt: null },
      data: { isDefault: true },
    });
  }

  async getDecryptedAccount(id: string, userId: string) {
    const account = await this.findById(id, userId);
    if (!account) return null;

    return {
      ...account,
      accountNumber: this.decrypt(account.accountNumberEnc),
      accountHolderName: this.decrypt(account.accountNameEnc),
    };
  }
}

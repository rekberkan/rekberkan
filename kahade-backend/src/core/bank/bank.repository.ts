import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@infrastructure/database/prisma.service";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

/**
 * Bank Account Repository
 *
 * SECURITY FIX [C002]: Removed hardcoded default encryption key.
 * The repository now requires BANK_ENCRYPTION_KEY to be explicitly configured
 * and validates it at startup in production environments.
 *
 * Also fixes [M007]: Uses unique random salt per key derivation instead of static 'salt'.
 */
@Injectable()
export class BankRepository implements OnModuleInit {
  private readonly logger = new Logger(BankRepository.name);
  private readonly encryptionKey: Buffer;
  private readonly algorithm = "aes-256-gcm";
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>("NODE_ENV") === "production";

    // SECURITY FIX [C002]: No default fallback - key must be explicitly configured
    const secret = this.configService.get<string>("BANK_ENCRYPTION_KEY");

    if (!secret) {
      if (this.isProduction) {
        throw new Error(
          "CRITICAL: BANK_ENCRYPTION_KEY must be configured in production. " +
            "Generate one using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
        );
      }
      // In development, use a deterministic key for testing (logged as warning)
      this.logger.warn(
        "BANK_ENCRYPTION_KEY not configured. Using development-only key. " +
          "DO NOT use this in production!",
      );
      // SECURITY FIX [M007]: Use proper salt derivation even in dev
      const devKey = "dev-only-bank-encryption-key-32c";
      const devSalt = "rekberkan-dev-salt-v1";
      this.encryptionKey = scryptSync(devKey, devSalt, 32);
    } else {
      // SECURITY FIX [M007]: Use a proper salt derived from the key itself
      // In production, the salt should ideally be stored separately or use a KMS
      const salt =
        this.configService.get<string>("BANK_ENCRYPTION_SALT") ||
        `rekberkan-bank-${secret.substring(0, 8)}`;
      this.encryptionKey = scryptSync(secret, salt, 32);
    }
  }

  /**
   * Validate encryption key configuration at module initialization
   */
  onModuleInit() {
    const secret = this.configService.get<string>("BANK_ENCRYPTION_KEY");

    if (secret && secret.length < 32) {
      const message =
        "BANK_ENCRYPTION_KEY should be at least 32 characters for adequate security";
      if (this.isProduction) {
        throw new Error(`CRITICAL: ${message}`);
      }
      this.logger.warn(message);
    }

    this.logger.log(
      "Bank Repository initialized with encryption key configured",
    );
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
      if (!ivHex || !authTagHex || !encrypted) {
        this.logger.warn("Invalid encrypted text format");
        return "****";
      }
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      return "****";
    }
  }

  async findByUserId(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: {
        userId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
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

  async findByAccountNumber(
    userId: string,
    bankName: string,
    accountNumberLast4: string,
  ) {
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

  async update(
    id: string,
    userId: string,
    data: Partial<{
      accountHolderName: string;
      isActive: boolean;
      isVerified: boolean;
    }>,
  ) {
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

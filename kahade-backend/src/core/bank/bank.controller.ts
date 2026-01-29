import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { BankRepository } from "./bank.repository";
import { AddBankAccountDto } from "./dto/add-bank-account.dto";
import { SUPPORTED_BANKS, getBankByCode } from "@common/constants/banks";

// ============================================================================
// BANK CONTROLLER - Bank-Grade Security
// Implements: Rate Limiting, Input Validation, Secure Account Management
// ============================================================================

// Maximum bank accounts per user
const MAX_BANK_ACCOUNTS = 5;

@ApiTags("bank")
@Controller("bank")
export class BankController {
  constructor(private readonly bankRepository: BankRepository) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  health() {
    return { status: "ok", service: "bank" };
  }

  @Get("list")
  @ApiOperation({ summary: "Get list of supported banks" })
  @ApiResponse({ status: 200, description: "Returns list of supported banks" })
  getSupportedBanks() {
    return {
      banks: SUPPORTED_BANKS,
    };
  }

  @Get("accounts")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get user bank accounts" })
  @ApiResponse({ status: 200, description: "Returns user bank accounts" })
  async getBankAccounts(@CurrentUser("id") userId: string) {
    const accounts = await this.bankRepository.findByUserId(userId);
    return {
      accounts: accounts.map((acc) => ({
        id: acc.id,
        bankName: acc.bankName,
        accountNumber: `****${acc.accountNumberLast4}`,
        accountNumberLast4: acc.accountNumberLast4,
        isActive: acc.isActive,
        isVerified: acc.isVerified,
        isDefault: acc.isDefault,
        createdAt: acc.createdAt,
      })),
    };
  }

  @Get("accounts/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get bank account by ID" })
  @ApiResponse({ status: 200, description: "Returns bank account details" })
  @ApiResponse({ status: 404, description: "Bank account not found" })
  async getBankAccount(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const account = await this.bankRepository.findById(id, userId);
    if (!account) {
      throw new NotFoundException("Bank account not found");
    }
    return {
      id: account.id,
      bankName: account.bankName,
      accountNumberLast4: account.accountNumberLast4,
      isActive: account.isActive,
      isVerified: account.isVerified,
      isDefault: account.isDefault,
      createdAt: account.createdAt,
    };
  }

  @Post("accounts")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Throttle({ default: { limit: 5, ttl: 86400000 } }) // 5 bank accounts per day
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add new bank account" })
  @ApiResponse({ status: 201, description: "Bank account added successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid bank code or duplicate account",
  })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async addBankAccount(
    @CurrentUser("id") userId: string,
    @Body() dto: AddBankAccountDto,
  ) {
    // Validate bank code
    const bank = getBankByCode(dto.bankCode);
    if (!bank) {
      throw new BadRequestException("Invalid bank code");
    }

    // Check account limit
    const existingAccounts = await this.bankRepository.findByUserId(userId);
    if (existingAccounts.length >= MAX_BANK_ACCOUNTS) {
      throw new BadRequestException(
        `Maximum ${MAX_BANK_ACCOUNTS} bank accounts allowed`,
      );
    }

    // Check for duplicate by last 4 digits
    const duplicate = existingAccounts.find(
      (acc) =>
        acc.bankName === bank.name &&
        acc.accountNumberLast4 === dto.accountNumber.slice(-4),
    );
    if (duplicate) {
      throw new BadRequestException("Bank account already exists");
    }

    // Validate account number format (10-16 digits)
    if (!/^\d{10,16}$/.test(dto.accountNumber)) {
      throw new BadRequestException("Invalid account number format");
    }

    // Validate account holder name (only letters, spaces, and common characters)
    if (!/^[a-zA-Z\s.'-]{2,100}$/.test(dto.accountHolderName)) {
      throw new BadRequestException("Invalid account holder name");
    }

    const account = await this.bankRepository.create({
      userId,
      bankName: bank.name,
      accountNumber: dto.accountNumber,
      accountHolderName: dto.accountHolderName.trim(),
    });

    return {
      message: "Bank account added successfully",
      account: {
        id: account.id,
        bankName: account.bankName,
        accountNumberLast4: account.accountNumberLast4,
        isActive: account.isActive,
        isVerified: account.isVerified,
      },
    };
  }

  @Patch("accounts/:id/default")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set bank account as default" })
  @ApiResponse({ status: 200, description: "Bank account set as default" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async setAsDefault(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const account = await this.bankRepository.findById(id, userId);
    if (!account) {
      throw new NotFoundException("Bank account not found");
    }

    if (!account.isActive) {
      throw new BadRequestException("Cannot set inactive account as default");
    }

    await this.bankRepository.setAsDefault(id, userId);

    return { message: "Bank account set as default" };
  }

  @Delete("accounts/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete bank account" })
  @ApiResponse({ status: 200, description: "Bank account deleted" })
  @ApiResponse({ status: 404, description: "Bank account not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async deleteBankAccount(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const account = await this.bankRepository.findById(id, userId);
    if (!account) {
      throw new NotFoundException("Bank account not found");
    }

    // Check if this is the only account and is default
    const allAccounts = await this.bankRepository.findByUserId(userId);
    if (allAccounts.length === 1 && account.isDefault) {
      // Allow deletion of last account
    }

    await this.bankRepository.softDelete(id, userId);

    return { message: "Bank account deleted successfully" };
  }
}

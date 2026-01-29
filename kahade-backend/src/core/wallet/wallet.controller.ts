import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { WalletService } from "./wallet.service";
import { TopUpDto } from "./dto/topup.dto";
import { WithdrawDto } from "./dto/withdraw.dto";

// ============================================================================
// WALLET CONTROLLER - Production Ready
// Implements: Rate Limiting, Input Validation, Secure Financial Operations
// ============================================================================

@ApiTags("wallet")
@Controller("wallet")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ============================================================================
  // BALANCE
  // ============================================================================

  @Get("balance")
  @ApiOperation({ summary: "Get wallet balance" })
  @ApiResponse({ status: 200, description: "Returns wallet balance" })
  async getBalance(@CurrentUser("id") userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get("balance/detailed")
  @ApiOperation({
    summary: "Get detailed wallet balance including locked funds",
  })
  @ApiResponse({ status: 200, description: "Returns detailed wallet balance" })
  async getDetailedBalance(@CurrentUser("id") userId: string) {
    return this.walletService.getBalanceDetailed(userId);
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  @Get("transactions")
  @ApiOperation({ summary: "Get wallet transactions" })
  @ApiQuery({
    name: "type",
    required: false,
    type: String,
    description: "Filter by transaction type",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 100)",
  })
  async getTransactions(
    @CurrentUser("id") userId: string,
    @Query("type") type?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    // Validate pagination
    const validPage = page < 1 ? 1 : page;
    const validLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;

    return this.walletService.getTransactions(userId, {
      type,
      page: validPage,
      limit: validLimit,
    });
  }

  // ============================================================================
  // TOP UP - Rate limited to prevent abuse
  // ============================================================================

  @Post("topup")
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  @ApiOperation({ summary: "Top up wallet balance" })
  @ApiResponse({ status: 201, description: "Top up initiated" })
  @ApiResponse({ status: 400, description: "Invalid amount or method" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async topUp(@CurrentUser("id") userId: string, @Body() topUpDto: TopUpDto) {
    // Additional server-side validation
    if (topUpDto.amount < 10000) {
      throw new BadRequestException("Minimum top up amount is Rp 10,000");
    }
    if (topUpDto.amount > 100000000) {
      throw new BadRequestException("Maximum top up amount is Rp 100,000,000");
    }

    return this.walletService.topUp(userId, topUpDto);
  }

  // ============================================================================
  // WITHDRAWAL - Strict rate limit for security
  // ============================================================================

  @Post("withdraw")
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  @ApiOperation({ summary: "Withdraw from wallet" })
  @ApiResponse({ status: 201, description: "Withdrawal initiated" })
  @ApiResponse({
    status: 400,
    description: "Invalid amount or insufficient balance",
  })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async withdraw(
    @CurrentUser("id") userId: string,
    @Body() withdrawDto: WithdrawDto,
  ) {
    // Additional server-side validation
    if (withdrawDto.amount < 50000) {
      throw new BadRequestException("Minimum withdrawal amount is Rp 50,000");
    }
    if (withdrawDto.amount > 50000000) {
      throw new BadRequestException(
        "Maximum withdrawal amount is Rp 50,000,000 per transaction",
      );
    }

    return this.walletService.withdraw(userId, withdrawDto);
  }

  @Get("withdrawals")
  @ApiOperation({ summary: "Get withdrawal history" })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getWithdrawals(
    @CurrentUser("id") userId: string,
    @Query("status") status?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    const validPage = page < 1 ? 1 : page;
    const validLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;

    return this.walletService.getWithdrawalHistory(userId, {
      status,
      page: validPage,
      limit: validLimit,
    });
  }

  @Post("withdrawals/:id/cancel")
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: "Cancel pending withdrawal" })
  @ApiParam({ name: "id", description: "Withdrawal ID" })
  @ApiResponse({ status: 200, description: "Withdrawal cancelled" })
  @ApiResponse({
    status: 400,
    description: "Cannot cancel - already processed",
  })
  async cancelWithdrawal(
    @CurrentUser("id") userId: string,
    @Param("id") withdrawalId: string,
  ) {
    return this.walletService.cancelPendingWithdrawal(userId, withdrawalId);
  }

  // ============================================================================
  // BANK LIST
  // ============================================================================

  @Get("banks")
  @ApiOperation({ summary: "Get list of supported banks" })
  @ApiResponse({ status: 200, description: "Returns list of banks" })
  async getBanks() {
    return this.walletService.getSupportedBanks();
  }
}

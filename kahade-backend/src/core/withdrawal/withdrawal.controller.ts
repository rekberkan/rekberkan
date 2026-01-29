import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Headers,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { MfaGuard } from "@security/guards/mfa.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { WithdrawalService } from "./withdrawal.service";
import { CreateWithdrawalDto } from "./dto/create-withdrawal.dto";

@ApiTags("withdrawals")
@Controller("withdrawals")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  // ============================================================================
  // WITHDRAWAL OPERATIONS
  // ============================================================================

  @Post()
  @UseGuards(MfaGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 withdrawals per hour
  @ApiOperation({ summary: "Create a new withdrawal request" })
  @ApiHeader({
    name: "x-idempotency-key",
    required: true,
    description: "Idempotency key",
  })
  @ApiHeader({
    name: "x-mfa-token",
    required: true,
    description: "MFA TOTP token",
  })
  @ApiResponse({ status: 201, description: "Withdrawal request created" })
  @ApiResponse({
    status: 400,
    description: "Invalid input or insufficient balance",
  })
  @ApiResponse({ status: 401, description: "MFA verification failed" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async createWithdrawal(
    @CurrentUser("id") userId: string,
    @Body() createWithdrawalDto: CreateWithdrawalDto,
    @Headers("x-idempotency-key") idempotencyKey: string,
  ) {
    return this.withdrawalService.createWithdrawal({
      userId,
      bankAccountId: createWithdrawalDto.bankAccountId,
      amountMinor: BigInt(createWithdrawalDto.amountMinor),
      idempotencyKey,
    });
  }

  // ============================================================================
  // WITHDRAWAL LIMITS
  // ============================================================================

  @Get("limits")
  @ApiOperation({ summary: "Get withdrawal limits and usage" })
  @ApiResponse({ status: 200, description: "Returns withdrawal limits" })
  async getWithdrawalLimits(@CurrentUser("id") userId: string) {
    return this.withdrawalService.getWithdrawalLimits(userId);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get("health")
  health() {
    return { status: "ok", service: "withdrawals" };
  }
}

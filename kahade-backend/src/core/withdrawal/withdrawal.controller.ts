import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { MfaGuard } from '@common/guards/mfa.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalFilterDto } from './dto/withdrawal-filter.dto';

@ApiTags('withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  // ============================================================================
  // WITHDRAWAL OPERATIONS
  // ============================================================================

  @Post()
  @UseGuards(MfaGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 withdrawals per hour
  @ApiOperation({ summary: 'Create a new withdrawal request' })
  @ApiHeader({ name: 'x-idempotency-key', required: true, description: 'Idempotency key' })
  @ApiHeader({ name: 'x-mfa-token', required: true, description: 'MFA TOTP token' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  @ApiResponse({ status: 401, description: 'MFA verification failed' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async createWithdrawal(
    @CurrentUser('id') userId: string,
    @Body() createWithdrawalDto: CreateWithdrawalDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.withdrawalService.createWithdrawal(userId, createWithdrawalDto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'Get withdrawal history' })
  @ApiResponse({ status: 200, description: 'Returns paginated withdrawals' })
  async getWithdrawals(
    @CurrentUser('id') userId: string,
    @Query() filterDto: WithdrawalFilterDto,
  ) {
    return this.withdrawalService.getWithdrawals(userId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get withdrawal details by ID' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID' })
  @ApiResponse({ status: 200, description: 'Returns withdrawal details' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  async getWithdrawalById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) withdrawalId: string,
  ) {
    return this.withdrawalService.getWithdrawalById(userId, withdrawalId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Cancel a pending withdrawal' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel - already processed' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async cancelWithdrawal(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) withdrawalId: string,
  ) {
    return this.withdrawalService.cancelWithdrawal(userId, withdrawalId);
  }

  // ============================================================================
  // WITHDRAWAL LIMITS
  // ============================================================================

  @Get('limits/daily')
  @ApiOperation({ summary: 'Get daily withdrawal limits and usage' })
  @ApiResponse({ status: 200, description: 'Returns daily limits' })
  async getDailyLimits(@CurrentUser('id') userId: string) {
    return this.withdrawalService.getDailyLimits(userId);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get('health')
  health() {
    return { status: 'ok', service: 'withdrawals' };
  }
}

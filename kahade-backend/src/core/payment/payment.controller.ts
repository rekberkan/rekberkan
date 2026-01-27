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
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ============================================================================
  // PAYMENT OPERATIONS
  // ============================================================================

  @Post()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Create a new payment (top-up wallet)' })
  @ApiHeader({ name: 'x-idempotency-key', required: true, description: 'Idempotency key' })
  @ApiResponse({ status: 201, description: 'Payment created, returns payment URL' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Duplicate request' })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.paymentService.createPayment(userId, createPaymentDto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Returns paginated payments' })
  async getPayments(
    @CurrentUser('id') userId: string,
    @Query() filterDto: PaymentFilterDto,
  ) {
    return this.paymentService.getPayments(userId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Returns payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentService.getPaymentById(userId, paymentId);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Check payment status' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Returns payment status' })
  async checkPaymentStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentService.checkPaymentStatus(userId, paymentId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel - payment already processed' })
  async cancelPayment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentService.cancelPayment(userId, paymentId);
  }

  // ============================================================================
  // PAYMENT METHODS
  // ============================================================================

  @Get('methods/available')
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({ status: 200, description: 'Returns available payment methods' })
  async getPaymentMethods(@CurrentUser('id') userId: string) {
    return this.paymentService.getAvailablePaymentMethods(userId);
  }

  @Get('methods/fees')
  @ApiOperation({ summary: 'Get payment method fees' })
  @ApiResponse({ status: 200, description: 'Returns payment method fees' })
  async getPaymentFees(@Query('amount') amount: number) {
    return this.paymentService.calculatePaymentFees(amount);
  }

  // ============================================================================
  // PAYMENT STATISTICS
  // ============================================================================

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Returns payment statistics' })
  async getPaymentStats(@CurrentUser('id') userId: string) {
    return this.paymentService.getPaymentStats(userId);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get('health')
  health() {
    return { status: 'ok', service: 'payments' };
  }
}

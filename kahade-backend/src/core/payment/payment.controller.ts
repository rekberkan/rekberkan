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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { PaymentService } from "@integrations/payment/payment.service";
import { PaymentRepository } from "./payment.repository";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentFilterDto } from "./dto/payment-filter.dto";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

@ApiTags("payments")
@Controller("payments")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  // ============================================================================
  // PAYMENT OPERATIONS
  // ============================================================================

  @Post()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: "Create a new payment (top-up wallet)" })
  @ApiHeader({
    name: "x-idempotency-key",
    required: true,
    description: "Idempotency key",
  })
  @ApiResponse({
    status: 201,
    description: "Payment created, returns payment URL",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 409, description: "Duplicate request" })
  async createPayment(
    @CurrentUser("id") userId: string,
    @CurrentUser("email") userEmail: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment({
      amount: createPaymentDto.amountMinor,
      currency: createPaymentDto.currency || "IDR",
      transactionId: `TXN-${Date.now()}`,
      customerEmail: userEmail || "user@example.com",
    });
  }

  @Get()
  @ApiOperation({ summary: "Get user payment history" })
  @ApiResponse({ status: 200, description: "Returns paginated payments" })
  async getPayments(
    @CurrentUser("id") userId: string,
    @Query() filterDto: PaymentFilterDto,
  ) {
    return this.paymentRepository.findMany({
      userId,
      status: filterDto.status as unknown as PaymentStatus,
      paymentMethod: filterDto.method as unknown as PaymentMethod,
      dateFrom: filterDto.dateFrom ? new Date(filterDto.dateFrom) : undefined,
      dateTo: filterDto.dateTo ? new Date(filterDto.dateTo) : undefined,
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
      sortBy: filterDto.sortBy || "createdAt",
      sortOrder: (filterDto.sortOrder as "asc" | "desc") || "desc",
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payment details by ID" })
  @ApiParam({ name: "id", description: "Payment ID" })
  @ApiResponse({ status: 200, description: "Returns payment details" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  async getPaymentById(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentRepository.findById(paymentId);
  }

  @Get(":id/status")
  @ApiOperation({ summary: "Check payment status" })
  @ApiParam({ name: "id", description: "Payment ID" })
  @ApiResponse({ status: 200, description: "Returns payment status" })
  async checkPaymentStatus(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentService.verifyPayment(paymentId);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a pending payment" })
  @ApiParam({ name: "id", description: "Payment ID" })
  @ApiResponse({ status: 200, description: "Payment cancelled" })
  @ApiResponse({
    status: 400,
    description: "Cannot cancel - payment already processed",
  })
  async cancelPayment(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentRepository.updateStatus(paymentId, PaymentStatus.FAILED);
  }

  // ============================================================================
  // PAYMENT STATISTICS
  // ============================================================================

  @Get("stats/summary")
  @ApiOperation({ summary: "Get payment statistics" })
  @ApiResponse({ status: 200, description: "Returns payment statistics" })
  async getPaymentStats(@CurrentUser("id") userId: string) {
    return this.paymentRepository.getStats(userId);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get("health")
  health() {
    return { status: "ok", service: "payments" };
  }
}

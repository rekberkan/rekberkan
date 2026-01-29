import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Headers,
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
import { EscrowService } from "./escrow.service";
import { CreateEscrowDto } from "./dto/create-escrow.dto";
import { ReleaseEscrowDto } from "./dto/release-escrow.dto";
import { RefundEscrowDto } from "./dto/refund-escrow.dto";

@ApiTags("escrow")
@Controller("escrow")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  // ============================================================================
  // ESCROW OPERATIONS
  // ============================================================================

  @Post()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: "Create a new escrow hold" })
  @ApiHeader({
    name: "x-idempotency-key",
    required: true,
    description: "Idempotency key for safe retries",
  })
  @ApiResponse({ status: 201, description: "Escrow created successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid input or insufficient balance",
  })
  @ApiResponse({ status: 409, description: "Duplicate request" })
  async createEscrow(
    @CurrentUser("id") userId: string,
    @Body() createEscrowDto: CreateEscrowDto,
    @Headers("x-idempotency-key") idempotencyKey: string,
  ) {
    return this.escrowService.createEscrow({
      orderId: createEscrowDto.orderId,
      buyerUserId: userId,
      sellerUserId: createEscrowDto.sellerUserId,
      amountMinor: BigInt(createEscrowDto.amountMinor),
      timeoutHours: createEscrowDto.timeoutHours,
      idempotencyKey,
    });
  }

  @Post(":id/release")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: "Release escrow funds to seller" })
  @ApiParam({ name: "id", description: "Escrow ID" })
  @ApiHeader({
    name: "x-idempotency-key",
    required: true,
    description: "Idempotency key for safe retries",
  })
  @ApiResponse({ status: 200, description: "Escrow released successfully" })
  @ApiResponse({ status: 400, description: "Invalid escrow state" })
  @ApiResponse({
    status: 403,
    description: "Not authorized to release this escrow",
  })
  async releaseEscrow(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) escrowId: string,
    @Body() releaseDto: ReleaseEscrowDto,
    @Headers("x-idempotency-key") idempotencyKey: string,
  ) {
    return this.escrowService.releaseEscrow({
      escrowId,
      actorId: userId,
      platformFeeMinor: BigInt(releaseDto.platformFeeMinor || 0),
      idempotencyKey,
    });
  }

  @Post(":id/refund")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: "Refund escrow funds to buyer" })
  @ApiParam({ name: "id", description: "Escrow ID" })
  @ApiHeader({
    name: "x-idempotency-key",
    required: true,
    description: "Idempotency key for safe retries",
  })
  @ApiResponse({ status: 200, description: "Escrow refunded successfully" })
  @ApiResponse({ status: 400, description: "Invalid escrow state" })
  @ApiResponse({
    status: 403,
    description: "Not authorized to refund this escrow",
  })
  async refundEscrow(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) escrowId: string,
    @Body() refundDto: RefundEscrowDto,
    @Headers("x-idempotency-key") idempotencyKey: string,
  ) {
    return this.escrowService.refundEscrow({
      escrowId,
      actorId: userId,
      reason: refundDto.reason,
      idempotencyKey,
    });
  }

  @Post(":id/dispute")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Initiate dispute on escrow" })
  @ApiParam({ name: "id", description: "Escrow ID" })
  @ApiResponse({ status: 200, description: "Dispute initiated" })
  async initiateDispute(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) escrowId: string,
    @Body() body: { reason: string },
  ) {
    return this.escrowService.initiateDispute(escrowId, userId, body.reason);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get("health")
  async health() {
    return this.escrowService.healthCheck();
  }
}

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
import { EscrowService } from './escrow.service';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';
import { RefundEscrowDto } from './dto/refund-escrow.dto';
import { EscrowFilterDto } from './dto/escrow-filter.dto';

@ApiTags('escrow')
@Controller('escrow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  // ============================================================================
  // ESCROW OPERATIONS
  // ============================================================================

  @Post()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Create a new escrow hold' })
  @ApiHeader({ name: 'x-idempotency-key', required: true, description: 'Idempotency key for safe retries' })
  @ApiResponse({ status: 201, description: 'Escrow created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  @ApiResponse({ status: 409, description: 'Duplicate request' })
  async createEscrow(
    @CurrentUser('id') userId: string,
    @Body() createEscrowDto: CreateEscrowDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.escrowService.createEscrow({
      ...createEscrowDto,
      buyerUserId: userId,
      idempotencyKey,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get user escrow holds with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated escrow holds' })
  async getEscrows(
    @CurrentUser('id') userId: string,
    @Query() filterDto: EscrowFilterDto,
  ) {
    return this.escrowService.getEscrows(userId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escrow details by ID' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  @ApiResponse({ status: 200, description: 'Returns escrow details' })
  @ApiResponse({ status: 404, description: 'Escrow not found' })
  async getEscrowById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) escrowId: string,
  ) {
    return this.escrowService.getEscrowById(userId, escrowId);
  }

  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Release escrow funds to seller' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  @ApiHeader({ name: 'x-idempotency-key', required: true, description: 'Idempotency key for safe retries' })
  @ApiResponse({ status: 200, description: 'Escrow released successfully' })
  @ApiResponse({ status: 400, description: 'Invalid escrow state' })
  @ApiResponse({ status: 403, description: 'Not authorized to release this escrow' })
  async releaseEscrow(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) escrowId: string,
    @Body() releaseDto: ReleaseEscrowDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.escrowService.releaseEscrow({
      escrowId,
      actorId: userId,
      platformFeeMinor: BigInt(releaseDto.platformFeeMinor || 0),
      idempotencyKey,
    });
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Refund escrow funds to buyer' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  @ApiHeader({ name: 'x-idempotency-key', required: true, description: 'Idempotency key for safe retries' })
  @ApiResponse({ status: 200, description: 'Escrow refunded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid escrow state' })
  @ApiResponse({ status: 403, description: 'Not authorized to refund this escrow' })
  async refundEscrow(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) escrowId: string,
    @Body() refundDto: RefundEscrowDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.escrowService.refundEscrow({
      escrowId,
      actorId: userId,
      reason: refundDto.reason,
      idempotencyKey,
    });
  }

  @Post(':id/extend')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: 'Extend escrow timeout' })
  @ApiParam({ name: 'id', description: 'Escrow ID' })
  @ApiResponse({ status: 200, description: 'Escrow timeout extended' })
  @ApiResponse({ status: 400, description: 'Invalid escrow state or extension limit reached' })
  async extendEscrow(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) escrowId: string,
    @Body() body: { additionalHours: number },
  ) {
    return this.escrowService.extendTimeout(userId, escrowId, body.additionalHours);
  }

  // ============================================================================
  // ESCROW STATISTICS
  // ============================================================================

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get escrow statistics summary' })
  @ApiResponse({ status: 200, description: 'Returns escrow statistics' })
  async getEscrowStats(@CurrentUser('id') userId: string) {
    return this.escrowService.getEscrowStats(userId);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get('health')
  health() {
    return { status: 'ok', service: 'escrow' };
  }
}

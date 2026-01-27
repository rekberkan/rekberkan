import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  ParseIntPipe, 
  DefaultValuePipe,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

// ============================================================================
// TRANSACTION CONTROLLER - Production Ready
// Implements: Rate Limiting, Input Validation, Secure Escrow Operations
// ============================================================================

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // ============================================================================
  // CREATE TRANSACTION - Rate limited
  // ============================================================================

  @Post()
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 transactions per hour
  @ApiOperation({ summary: 'Create new escrow transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transaction data' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(userId, createTransactionDto);
  }

  // ============================================================================
  // LIST TRANSACTIONS
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get all transactions for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role (buyer/seller)' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    // Validate role if provided
    if (role && !['buyer', 'seller'].includes(role.toLowerCase())) {
      throw new BadRequestException('Role must be either "buyer" or "seller"');
    }

    return this.transactionService.findAllByUser(userId, { page, limit, status, role });
  }

  // ============================================================================
  // GET SINGLE TRANSACTION
  // ============================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Returns transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionService.findOne(id, userId);
  }

  // ============================================================================
  // TRANSACTION ACTIONS - Rate limited for security
  // ============================================================================

  @Post(':id/accept')
  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @ApiOperation({ summary: 'Accept transaction invitation' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction accepted' })
  @ApiResponse({ status: 400, description: 'Cannot accept - invalid status' })
  @ApiResponse({ status: 403, description: 'Not authorized to accept' })
  async accept(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionService.accept(id, userId);
  }

  @Post(':id/reject')
  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @ApiOperation({ summary: 'Reject transaction invitation' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ schema: { properties: { reason: { type: 'string', maxLength: 500 } } } })
  @ApiResponse({ status: 200, description: 'Transaction rejected' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    // Validate reason length
    if (reason && reason.length > 500) {
      throw new BadRequestException('Reason must not exceed 500 characters');
    }
    return this.transactionService.reject(id, userId, reason);
  }

  @Post(':id/pay')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // Strict limit for payment
  @ApiOperation({ summary: 'Pay for transaction (buyer)' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Payment successful' })
  @ApiResponse({ status: 400, description: 'Cannot pay - insufficient balance or invalid status' })
  @ApiResponse({ status: 403, description: 'Only buyer can pay' })
  async pay(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionService.pay(id, userId);
  }

  @Post(':id/deliver')
  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @ApiOperation({ summary: 'Confirm delivery (seller)' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ schema: { properties: { proofUrl: { type: 'string', format: 'uri' }, notes: { type: 'string', maxLength: 500 } } } })
  @ApiResponse({ status: 200, description: 'Delivery confirmed' })
  @ApiResponse({ status: 403, description: 'Only seller can confirm delivery' })
  async confirmDelivery(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('proofUrl') proofUrl?: string,
    @Body('notes') notes?: string,
  ) {
    // Validate proof URL if provided
    if (proofUrl && proofUrl.length > 500) {
      throw new BadRequestException('Proof URL is too long');
    }
    // Validate notes if provided
    if (notes && notes.length > 500) {
      throw new BadRequestException('Notes must not exceed 500 characters');
    }
    return this.transactionService.confirmDelivery(id, userId, proofUrl, notes);
  }

  @Post(':id/complete')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // Strict limit for fund release
  @ApiOperation({ summary: 'Confirm receipt and release funds (buyer)' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Receipt confirmed, funds released to seller' })
  @ApiResponse({ status: 403, description: 'Only buyer can confirm receipt' })
  async confirmReceipt(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionService.confirmReceipt(id, userId);
  }

  @Post(':id/dispute')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // Very strict limit for disputes
  @ApiOperation({ summary: 'Open dispute for transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ 
    schema: { 
      properties: { 
        reason: { type: 'string', minLength: 10, maxLength: 100 },
        description: { type: 'string', minLength: 20, maxLength: 2000 },
      },
      required: ['reason', 'description'],
    } 
  })
  @ApiResponse({ status: 200, description: 'Dispute opened' })
  @ApiResponse({ status: 400, description: 'Cannot dispute - invalid status' })
  async dispute(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: { reason: string; description: string },
  ) {
    // Validate dispute data
    if (!data.reason || data.reason.length < 10) {
      throw new BadRequestException('Reason must be at least 10 characters');
    }
    if (data.reason.length > 100) {
      throw new BadRequestException('Reason must not exceed 100 characters');
    }
    if (!data.description || data.description.length < 20) {
      throw new BadRequestException('Description must be at least 20 characters');
    }
    if (data.description.length > 2000) {
      throw new BadRequestException('Description must not exceed 2000 characters');
    }

    return this.transactionService.dispute(id, userId, data);
  }

  @Post(':id/cancel')
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
  @ApiOperation({ summary: 'Cancel transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ schema: { properties: { reason: { type: 'string', maxLength: 500 } } } })
  @ApiResponse({ status: 200, description: 'Transaction cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel - invalid status' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    if (reason && reason.length > 500) {
      throw new BadRequestException('Reason must not exceed 500 characters');
    }
    return this.transactionService.cancel(id, userId, reason);
  }

  // ============================================================================
  // TRANSACTION TIMELINE & MESSAGES
  // ============================================================================

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get transaction timeline' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Returns transaction timeline' })
  async getTimeline(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionService.getTimeline(id, userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get transaction messages' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Returns transaction messages' })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionService.getMessages(id, userId);
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 messages per minute
  @ApiOperation({ summary: 'Send message in transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ schema: { properties: { message: { type: 'string', minLength: 1, maxLength: 1000 } } } })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('message') message: string,
  ) {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }
    if (message.length > 1000) {
      throw new BadRequestException('Message must not exceed 1000 characters');
    }
    return this.transactionService.sendMessage(id, userId, message.trim());
  }

  // ============================================================================
  // TRANSACTION RATING
  // ============================================================================

  @Post(':id/rating')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Rate completed transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({
    schema: {
      properties: {
        score: { type: 'number', minimum: 1, maximum: 5 },
        comment: { type: 'string', maxLength: 1000 },
      },
      required: ['score'],
    },
  })
  @ApiResponse({ status: 200, description: 'Rating submitted' })
  async rateTransaction(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: { score: number; comment?: string },
  ) {
    if (!data.score || data.score < 1 || data.score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }
    if (data.comment && data.comment.length > 1000) {
      throw new BadRequestException('Comment must not exceed 1000 characters');
    }
    return this.transactionService.rate(id, userId, data);
  }
}

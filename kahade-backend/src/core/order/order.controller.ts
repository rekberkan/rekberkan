import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AcceptOrderDto } from './dto/accept-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { CreateOrderCommentDto, UpdateOrderCommentDto } from './dto/order-comment.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ============================================================================
  // ORDER CRUD
  // ============================================================================

  @Post()
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 orders per hour
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.orderService.createOrder(userId, createOrderDto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders' })
  async getOrders(@CurrentUser('id') userId: string, @Query() filterDto: OrderFilterDto) {
    return this.orderService.getOrders(userId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.orderService.getOrderById(userId, orderId);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order details by order number' })
  @ApiParam({ name: 'orderNumber', description: 'Order number (e.g., ORD-20240115-ABC123)' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderByNumber(
    @CurrentUser('id') userId: string,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.orderService.getOrderByNumber(userId, orderNumber);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order (only before acceptance)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update - order already accepted' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.updateOrder(userId, orderId, updateOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel/delete order (only before payment)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel - order already paid' })
  @ApiResponse({ status: 403, description: 'Not authorized to cancel this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deleteOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(userId, orderId, cancelOrderDto);
  }

  // ============================================================================
  // ORDER ACTIONS
  // ============================================================================

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 3600000 } }) // 30 accepts per hour
  @ApiOperation({ summary: 'Accept an order invitation' })
  @ApiResponse({ status: 200, description: 'Order accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invite token' })
  @ApiResponse({ status: 409, description: 'Order already accepted' })
  async acceptOrder(@CurrentUser('id') userId: string, @Body() acceptOrderDto: AcceptOrderDto) {
    return this.orderService.acceptOrder(userId, acceptOrderDto);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 payments per hour
  @ApiOperation({ summary: 'Pay for an order (lock funds in escrow)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Payment successful, funds locked in escrow' })
  @ApiResponse({ status: 400, description: 'Invalid order state or insufficient balance' })
  @ApiResponse({ status: 403, description: 'Not authorized to pay for this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async payOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.orderService.payOrder(userId, orderId, idempotencyKey);
  }

  @Post(':id/confirm-delivery')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
  @ApiOperation({ summary: 'Confirm delivery and release escrow to seller' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Delivery confirmed, escrow released' })
  @ApiResponse({ status: 400, description: 'Invalid order state' })
  @ApiResponse({ status: 403, description: 'Only buyer can confirm delivery' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async confirmDelivery(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.orderService.confirmDelivery(userId, orderId, idempotencyKey);
  }

  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 disputes per hour
  @ApiOperation({ summary: 'Open a dispute for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Dispute opened successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order state for dispute' })
  @ApiResponse({ status: 403, description: 'Not authorized to dispute this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async openDispute(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() disputeData: { reason: string; description: string },
  ) {
    return this.orderService.openDispute(userId, orderId, disputeData);
  }

  // ============================================================================
  // ORDER INVITE
  // ============================================================================

  @Get('invite/:token')
  @ApiOperation({ summary: 'Get order details by invite token (for accepting)' })
  @ApiParam({ name: 'token', description: 'Invite token' })
  @ApiResponse({ status: 200, description: 'Returns order preview' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invite token' })
  async getOrderByInvite(@Param('token') inviteToken: string) {
    return this.orderService.getOrderByInviteToken(inviteToken);
  }

  @Post(':id/resend-invite')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: 'Resend order invitation email' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Invitation resent' })
  @ApiResponse({ status: 400, description: 'Order already accepted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async resendInvite(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() body: { email: string },
  ) {
    return this.orderService.resendInvite(userId, orderId, body.email);
  }

  // ============================================================================
  // ORDER COMMENTS
  // ============================================================================

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get order comments' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Returns order comments' })
  async getComments(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.orderService.getComments(userId, orderId);
  }

  @Post(':id/comments')
  @Throttle({ default: { limit: 50, ttl: 3600000 } })
  @ApiOperation({ summary: 'Add a comment to an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() createCommentDto: CreateOrderCommentDto,
  ) {
    return this.orderService.addComment(userId, orderId, createCommentDto);
  }

  @Put(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  async updateComment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentDto: UpdateOrderCommentDto,
  ) {
    return this.orderService.updateComment(userId, orderId, commentId, updateCommentDto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.orderService.deleteComment(userId, orderId, commentId);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  @Get('health')
  health() {
    return { status: 'ok', service: 'orders' };
  }
}

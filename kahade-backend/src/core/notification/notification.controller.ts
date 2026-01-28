import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

// ============================================================================
// NOTIFICATION CONTROLLER - Bank-Grade Security
// Implements: Rate Limiting, Input Validation, Pagination Limits
// ============================================================================

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'read', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns paginated notifications' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('read') read?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    // Validate pagination
    const validPage = page < 1 ? 1 : page;
    const validLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;

    // Parse read filter
    const readFilter = read === 'true' ? true : read === 'false' ? false : undefined;

    return this.notificationService.findAllByUser(userId, {
      read: readFilter,
      page: validPage,
      limit: validLimit,
    });
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Returns count' })
  async countUnread(@CurrentUser('id') userId: string) {
    const count = await this.notificationService.countUnread(userId);
    return { count };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count (legacy route)' })
  @ApiResponse({ status: 200, description: 'Returns count' })
  async countUnreadLegacy(@CurrentUser('id') userId: string) {
    const count = await this.notificationService.countUnread(userId);
    return { count };
  }

  @Patch(':id/read')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.notificationService.delete(id, userId);
    return { message: 'Notification deleted successfully' };
  }

  @Delete()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 per hour (bulk delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({ status: 200, description: 'Notifications deleted' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async deleteAll(@CurrentUser('id') userId: string) {
    const result = await this.notificationService.deleteAll(userId);
    return { message: 'Notifications deleted successfully', ...result };
  }
}

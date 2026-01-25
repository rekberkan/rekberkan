import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { NotificationRepository, ICreateNotification } from './notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationUtil, PaginationParams } from '@common/utils/pagination.util';
import { Notification, NotificationType } from '@common/shims/prisma-types.shim';

interface FindAllParams extends PaginationParams {
  read?: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly notificationRepository: NotificationRepository) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepository.create(createNotificationDto);
    this.logger.log(`Notification created: ${notification.id} for user: ${notification.userId}`);
    return notification;
  }

  async createForUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ): Promise<Notification> {
    const data: ICreateNotification = {
      userId,
      type,
      title,
      message,
      metadata,
    };

    return this.notificationRepository.create(data);
  }

  async findAllByUser(userId: string, params: FindAllParams) {
    const { page = 1, limit = 10, read } = params;
    const skip = PaginationUtil.getSkip(page, limit);

    const { notifications, total } = await this.notificationRepository.findByUser(userId, skip, limit, read);

    return PaginationUtil.paginate(notifications, total, page, limit);
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findUnreadByUser(userId);
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.countUnread(userId);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this notification');
    }

    return this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.markAllAsRead(userId);
    this.logger.log(`Marked ${count} notifications as read for user: ${userId}`);
    return { count };
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this notification');
    }

    await this.notificationRepository.delete(id);
  }

  async deleteAll(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.deleteAllByUser(userId);
    this.logger.log(`Deleted ${count} notifications for user: ${userId}`);
    return { count };
  }

  // Send notification for transaction events
  async sendTransactionNotification(
    userId: string,
    transactionId: string,
    event: 'created' | 'accepted' | 'paid' | 'completed' | 'cancelled' | 'disputed',
    title: string,
  ): Promise<Notification> {
    const messages: Record<string, string> = {
      created: `A new transaction "${title}" has been created.`,
      accepted: `Transaction "${title}" has been accepted.`,
      paid: `Payment for "${title}" has been confirmed.`,
      completed: `Transaction "${title}" has been completed successfully.`,
      cancelled: `Transaction "${title}" has been cancelled.`,
      disputed: `A dispute has been opened for "${title}".`,
    };

    return this.createForUser(
      userId,
      'TRANSACTION' as NotificationType,
      `Transaction ${event.charAt(0).toUpperCase() + event.slice(1)}`,
      messages[event],
      { transactionId, event },
    );
  }

  // Send notification for wallet events
  async sendWalletNotification(
    userId: string,
    event: 'topup_success' | 'topup_failed' | 'withdrawal_pending' | 'withdrawal_completed' | 'withdrawal_rejected',
    amount: number,
  ): Promise<Notification> {
    const titles: Record<string, string> = {
      topup_success: 'Top Up Successful',
      topup_failed: 'Top Up Failed',
      withdrawal_pending: 'Withdrawal Pending',
      withdrawal_completed: 'Withdrawal Completed',
      withdrawal_rejected: 'Withdrawal Rejected',
    };

    const messages: Record<string, string> = {
      topup_success: `Your top up of Rp ${amount.toLocaleString('id-ID')} has been successful.`,
      topup_failed: `Your top up of Rp ${amount.toLocaleString('id-ID')} has failed.`,
      withdrawal_pending: `Your withdrawal of Rp ${amount.toLocaleString('id-ID')} is being processed.`,
      withdrawal_completed: `Your withdrawal of Rp ${amount.toLocaleString('id-ID')} has been completed.`,
      withdrawal_rejected: `Your withdrawal of Rp ${amount.toLocaleString('id-ID')} has been rejected.`,
    };

    return this.createForUser(
      userId,
      'PAYMENT' as NotificationType,
      titles[event],
      messages[event],
      { event, amount },
    );
  }
}

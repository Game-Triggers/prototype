import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INotification } from '../../../../schemas/notification.schema';

interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'campaign' | 'earnings' | 'withdrawal' | 'kyc' | 'system' | 'payment' | 'dispute';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  actionUrl?: string;
  expiresAt?: Date;
}

interface NotificationFilters {
  userId: string;
  isRead?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<INotification>,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<INotification> {
    try {
      const notification = new this.notificationModel({
        ...dto,
        priority: dto.priority || 'medium',
        isRead: false,
        createdAt: new Date(),
      });

      await notification.save();
      this.logger.log(`Notification created for user ${dto.userId}: ${dto.title}`);
      
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(filters: NotificationFilters): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const query: Record<string, unknown> = { userId: filters.userId };
      
      if (filters.isRead !== undefined) {
        query.isRead = filters.isRead;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }

      const limit = Math.min(filters.limit || 20, 100); // Max 100 notifications per request
      const offset = filters.offset || 0;

      const [notifications, total, unreadCount] = await Promise.all([
        this.notificationModel
          .find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean()
          .exec(),
        this.notificationModel.countDocuments(query),
        this.notificationModel.countDocuments({ 
          userId: filters.userId, 
          isRead: false 
        }),
      ]);

      return {
        notifications: notifications as INotification[],
        total,
        unreadCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get user notifications: ${error.message}`, error.stack);
      throw new Error('Failed to get notifications');
    }
  }

  /**
   * Get latest notifications for preview (2 most recent)
   */
  async getLatestNotifications(userId: string): Promise<{
    notifications: INotification[];
    unreadCount: number;
  }> {
    try {
      const [notifications, unreadCount] = await Promise.all([
        this.notificationModel
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(2)
          .lean()
          .exec(),
        this.notificationModel.countDocuments({ 
          userId, 
          isRead: false 
        }),
      ]);

      return {
        notifications: notifications as INotification[],
        unreadCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get latest notifications: ${error.message}`, error.stack);
      throw new Error('Failed to get latest notifications');
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    try {
      const notification = await this.notificationModel.findOneAndUpdate(
        { _id: notificationId, userId },
        { 
          isRead: true, 
          readAt: new Date() 
        },
        { new: true }
      ).lean().exec();

      if (notification) {
        this.logger.log(`Notification ${notificationId} marked as read for user ${userId}`);
      }

      return notification as INotification;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<number> {
    try {
      const result = await this.notificationModel.updateMany(
        { 
          _id: { $in: notificationIds }, 
          userId,
          isRead: false 
        },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );

      this.logger.log(`${result.modifiedCount} notifications marked as read for user ${userId}`);
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`Failed to mark multiple notifications as read: ${error.message}`, error.stack);
      throw new Error('Failed to mark notifications as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.notificationModel.updateMany(
        { userId, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );

      this.logger.log(`${result.modifiedCount} notifications marked as read for user ${userId}`);
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`, error.stack);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationModel.deleteOne({
        _id: notificationId,
        userId,
      });

      const success = result.deletedCount > 0;
      if (success) {
        this.logger.log(`Notification ${notificationId} deleted for user ${userId}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`, error.stack);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationModel.countDocuments({
        userId,
        isRead: false,
      });
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`, error.stack);
      throw new Error('Failed to get unread count');
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await this.notificationModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      this.logger.log(`Cleaned up ${result.deletedCount} expired notifications`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired notifications: ${error.message}`, error.stack);
      throw new Error('Failed to cleanup expired notifications');
    }
  }

  // Helper methods for creating specific notification types

  async createCampaignNotification(
    userId: string, 
    campaignId: string, 
    title: string, 
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      title,
      message,
      type: 'campaign',
      priority,
      data: { campaignId },
      actionUrl: `/dashboard/campaigns/${campaignId}`,
    });
  }

  async createEarningsNotification(
    userId: string, 
    amount: number, 
    campaignId?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      title: 'Earnings Credited',
      message: `You've earned ₹${amount}${campaignId ? ' from a campaign' : ''}`,
      type: 'earnings',
      priority,
      data: { amount, campaignId },
      actionUrl: '/dashboard/wallet',
    });
  }

  async createWithdrawalNotification(
    userId: string, 
    amount: number, 
    status: 'approved' | 'rejected',
    reason?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'high'
  ): Promise<INotification> {
    const title = status === 'approved' ? 'Withdrawal Approved' : 'Withdrawal Rejected';
    const message = status === 'approved' 
      ? `Your withdrawal request of ₹${amount} has been approved`
      : `Your withdrawal request of ₹${amount} has been rejected${reason ? `: ${reason}` : ''}`;

    return this.createNotification({
      userId,
      title,
      message,
      type: 'withdrawal',
      priority,
      data: { amount, status, reason },
      actionUrl: '/dashboard/wallet',
    });
  }

  async createSystemNotification(
    userId: string, 
    title: string, 
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    actionUrl?: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      title,
      message,
      type: 'system',
      priority,
      actionUrl,
    });
  }
}

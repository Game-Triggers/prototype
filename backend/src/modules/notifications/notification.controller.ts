import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('notifications')
@ApiTags('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get user notifications with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'type', required: false, description: 'Notification type filter' })
  @ApiQuery({ name: 'isRead', required: false, description: 'Read status filter' })
  async getUserNotifications(
    @Req() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID is missing from authentication token');
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        userId,
        limit: limitNum,
        offset,
        ...(type && { type }),
        ...(isRead !== undefined && { isRead: isRead === 'true' }),
      };

      const result = await this.notificationService.getUserNotifications(filters);

      return {
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.total,
            pages: Math.ceil(result.total / limitNum),
          },
          unreadCount: result.unreadCount,
        },
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw new HttpException(
        'Failed to get notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get latest notifications for preview (hover)
   */
  @Get('latest')
  @ApiOperation({ summary: 'Get latest notifications for preview' })
  @ApiResponse({ status: 200, description: 'Latest notifications retrieved successfully' })
  async getLatestNotifications(@Req() req: RequestWithUser) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID is missing from authentication token');
      }

      const result = await this.notificationService.getLatestNotifications(userId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error getting latest notifications:', error);
      throw new HttpException(
        'Failed to get latest notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get unread count
   */
  @Get('count/unread')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Req() req: RequestWithUser) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID is missing from authentication token');
      }

      const count = await this.notificationService.getUnreadCount(userId);

      return {
        success: true,
        data: { unreadCount: count },
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw new HttpException(
        'Failed to get unread count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mark notification as read
   */
  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') notificationId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID is missing from authentication token');
      }

      const notification = await this.notificationService.markAsRead(
        notificationId,
        userId,
      );

      if (!notification) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: notification,
        message: 'Notification marked as read',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error marking notification as read:', error);
      throw new HttpException(
        'Failed to mark notification as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mark multiple notifications as read
   */
  @Put('read/batch')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read successfully' })
  async markMultipleAsRead(
    @Body() body: { notificationIds: string[] },
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID is missing from authentication token');
      }

      const { notificationIds } = body;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new HttpException(
          'Invalid notification IDs',
          HttpStatus.BAD_REQUEST,
        );
      }

      const modifiedCount = await this.notificationService.markMultipleAsRead(
        notificationIds,
        userId,
      );

      return {
        success: true,
        data: { modifiedCount },
        message: `${modifiedCount} notifications marked as read`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error marking notifications as read:', error);
      throw new HttpException(
        'Failed to mark notifications as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mark all notifications as read
   */
  @Put('read/all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read successfully' })
  async markAllAsRead(@Req() req: RequestWithUser) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID is missing from authentication token');
      }

      const modifiedCount = await this.notificationService.markAllAsRead(userId);

      return {
        success: true,
        data: { modifiedCount },
        message: 'All notifications marked as read',
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new HttpException(
        'Failed to mark all notifications as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete notification
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }

    return this.notificationService.deleteNotification(id, userId);
  }

  /**
   * Test endpoint - Create a sample notification
   */
  @Post('test/create')
  @ApiOperation({ summary: 'Create a test notification (development only)' })
  @ApiResponse({ status: 200, description: 'Test notification created successfully' })
  async createTestNotification(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }

    const notification = await this.notificationService.createCampaignNotification(
      userId,
      'test-campaign-' + Date.now(),
      '🎉 Test Notification',
      'This is a test notification to verify the system is working correctly',
      'medium'
    );

    return {
      success: true,
      data: notification,
      message: 'Test notification created successfully',
    };
  }
}

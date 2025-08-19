import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationEventHandlerService } from './notification-event-handler.service';
import { TestNotificationController } from './test-notification.controller';
import { NotificationSchema } from '../../../../schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
    ]),
  ],
  controllers: [
    NotificationController,
    TestNotificationController,
  ],
  providers: [
    NotificationService,
    NotificationEventHandlerService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

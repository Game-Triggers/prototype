import { Document, Schema, model, models } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'campaign' | 'earnings' | 'withdrawal' | 'kyc' | 'system' | 'payment' | 'dispute';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  data?: Record<string, unknown>;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
}

export const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      required: true,
      enum: ['campaign', 'earnings', 'withdrawal', 'kyc', 'system', 'payment', 'dispute'],
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
    readAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export the model
export const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);

export default Notification;

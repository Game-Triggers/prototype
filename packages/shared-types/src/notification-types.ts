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
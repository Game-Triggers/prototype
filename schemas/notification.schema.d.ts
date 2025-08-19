import { Document, Schema } from 'mongoose';
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
export declare const NotificationSchema: Schema<INotification, import("mongoose").Model<INotification, any, any, any, Document<unknown, any, INotification> & INotification & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, INotification, Document<unknown, {}, import("mongoose").FlatRecord<INotification>> & import("mongoose").FlatRecord<INotification> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare const Notification: import("mongoose").Model<any, {}, {}, {}, any, any>;
export default Notification;
//# sourceMappingURL=notification.schema.d.ts.map
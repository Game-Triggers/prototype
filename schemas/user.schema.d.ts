import { Schema, Model } from 'mongoose';
import { UserRole, AuthProvider } from '../lib/schema-types';
export { UserRole, AuthProvider };
import { IUserDocument } from '../backend/src/types/mongoose-helpers';
export interface IUser extends IUserDocument {
    password?: string;
    isActive?: boolean;
    overlaySettings?: {
        position?: string;
        size?: string;
        opacity?: number;
        backgroundColor?: string;
    };
    overlayToken?: string;
    overlayLastSeen?: Date;
    overlayActive?: boolean;
    campaignSelectionStrategy?: string;
    campaignRotationSettings?: {
        preferredStrategy: 'fair-rotation' | 'weighted' | 'time-rotation' | 'performance' | 'revenue-optimized';
        rotationIntervalMinutes: number;
        priorityWeights: {
            paymentRate: number;
            performance: number;
            fairness: number;
        };
        blackoutPeriods?: Array<{
            startTime: string;
            endTime: string;
            days: string[];
        }>;
    };
    testCampaign?: {
        title: string;
        mediaUrl: string;
        mediaType: string;
        testMode: boolean;
        expiresAt: Date;
    };
    streakCurrent?: number;
    streakLongest?: number;
    streakLastDate?: Date | null;
    streakHistory?: Date[];
}
export declare const UserSchema: Schema<IUser, Model<IUser, any, any, any, import("mongoose").Document<unknown, any, IUser> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IUser, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IUser>> & import("mongoose").FlatRecord<IUser> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getUserModel(): Model<IUser> | null;
export declare const User: Model<IUser, {}, {}, {}, import("mongoose").Document<unknown, {}, IUser> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any> | null;

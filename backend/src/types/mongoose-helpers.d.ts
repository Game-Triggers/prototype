import { Document, Types } from 'mongoose';
import {
  IUserData,
  ICampaignData,
  ICampaignParticipationData,
  UserRole,
} from '../../../lib/schema-types';
/**
 * Type helper to manage Mongoose Document types safely
 * This helps TypeScript correctly identify properties on Mongoose documents
 */
export interface IUserDocument extends Omit<IUserData, '_id'>, Document {
  _id: Types.ObjectId;
  role: UserRole;
  email: string;
  name: string;
}
export interface ICampaignDocument
  extends Omit<ICampaignData, '_id' | 'brandId'>,
    Document {
  _id: Types.ObjectId;
  brandId: Types.ObjectId;
}
export interface ICampaignParticipationDocument
  extends Omit<ICampaignParticipationData, '_id' | 'campaignId' | 'streamerId'>,
    Document {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  streamerId: Types.ObjectId;
}
export declare function isMongooseDocument(obj: any): obj is Document;
export declare function ensureDocument<T extends object>(doc: any): T;
//# sourceMappingURL=mongoose-helpers.d.ts.map

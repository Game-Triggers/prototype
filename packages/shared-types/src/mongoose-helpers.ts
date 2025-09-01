import { Document, Types } from 'mongoose';
import {
  ICampaignData,
  ICampaignParticipationData,
} from './campaign-types';
import { IUserData } from './user-types';
import { UserRole } from './auth-types';

/**
 * Type helper to manage Mongoose Document types safely
 * This helps TypeScript correctly identify properties on Mongoose documents
 */

// Create more strongly-typed interfaces for Mongoose documents
export interface IUserDocument extends Omit<IUserData, '_id'>, Document {
  _id: Types.ObjectId;
  // Explicitly define properties to ensure TypeScript recognizes them
  role: UserRole;
  email: string;
  name: string;
}

export interface ICampaignDocument
  extends Omit<
      ICampaignData,
      '_id' | 'brandId' | 'verifiedBy' | 'approvedBy' | 'rejectedBy'
    >,
    Document {
  _id: Types.ObjectId;
  brandId: Types.ObjectId;
  verifiedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
}

export interface ICampaignParticipationDocument
  extends Omit<ICampaignParticipationData, '_id' | 'campaignId' | 'streamerId'>,
    Document {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  streamerId: Types.ObjectId;
}

// Type guard to check if an object is a Mongoose document
export function isMongooseDocument(obj: any): obj is Document {
  return (
    obj &&
    typeof obj === 'object' &&
    obj._id &&
    obj.save &&
    typeof obj.save === 'function'
  );
}

// Helper function to safely access document properties
export function ensureDocument<T extends object>(doc: any): T {
  return doc as T;
}

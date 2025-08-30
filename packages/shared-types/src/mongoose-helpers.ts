// Extract from backend/src/types/mongoose-helpers.d.ts

import { Document, Types } from "mongoose";
import { IUserData , ICampaignData  } from './index';
import { UserRole } from "./auth-types";

export interface IUserDocument extends Omit<IUserData, '_id'>, Document {
    _id: Types.ObjectId;
    role: UserRole;
    email: string;
    name: string;
}

export interface ICampaignDocument extends Omit<ICampaignData, '_id' | 'brandId'>, Document {
  _id: Types.ObjectId;
  brandId: Types.ObjectId;
}

export function isMongooseDocument(obj: any): obj is Document {
  return obj && typeof obj === 'object' && obj._id && obj.__v !== undefined;
}

export function ensureDocument<T extends object>(doc: any): T {
  if (!isMongooseDocument(doc)) {
    throw new Error('Expected a Mongoose document');
  }
  return doc as T;
}
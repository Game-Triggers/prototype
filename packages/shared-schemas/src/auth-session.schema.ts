import { Schema, model, Model, models } from 'mongoose';
import { AuthProvider } from '@/packages/shared-types';

// Interface for auth tokens
export interface IAuthSession {
  userId: string;
  provider: AuthProvider;
  token: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema for storing auth sessions with tokens
const authSessionSchema = new Schema<IAuthSession>(
  {
    userId: { type: String, required: true },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      required: true,
    },
    token: {
      accessToken: { type: String, required: true },
      refreshToken: { type: String, required: false }, // Make refresh token optional
      expiresAt: { type: Date, required: true },
    },
  },
  { timestamps: true }
);

// Create index on userId and provider for fast lookups
authSessionSchema.index({ userId: 1, provider: 1 }, { unique: true });

// Explicitly export the schema for NestJS
export const AuthSessionSchema = authSessionSchema;

// Use a function to safely get the model
export function getAuthSessionModel(): Model<IAuthSession> {
  if (typeof window === 'undefined') {
    return models.AuthSession || model<IAuthSession>('AuthSession', authSessionSchema);
  }
  return null as any;
}

// Define a named export for backward compatibility
export const AuthSession = getAuthSessionModel();

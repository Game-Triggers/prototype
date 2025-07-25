import { Schema, model, Model, models } from 'mongoose';
// Import directly from relative path for compatibility with both Next.js and NestJS
import { UserRole, AuthProvider } from '../lib/schema-types';

// Re-export the enums for convenience
export { UserRole, AuthProvider };

// Import IUserDocument from our new helpers
import { IUserDocument } from '../backend/src/types/mongoose-helpers';

// Use the updated interface
export interface IUser extends IUserDocument {
  password?: string; // Add password field to the interface
  isActive?: boolean; // Account status field
  overlaySettings?: {
    position?: string;
    size?: string;
    opacity?: number;
    backgroundColor?: string;
  };
  overlayToken?: string;
  overlayLastSeen?: Date; // Track when overlay was last active
  overlayActive?: boolean; // Track if overlay is currently active
  campaignSelectionStrategy?: string; // Enhanced: Campaign selection strategy
  campaignRotationSettings?: {
    preferredStrategy: 'fair-rotation' | 'weighted' | 'time-rotation' | 'performance' | 'revenue-optimized';
    rotationIntervalMinutes: number;
    priorityWeights: {
      paymentRate: number;
      performance: number;
      fairness: number;
    };
    blackoutPeriods?: Array<{
      startTime: string; // HH:MM format
      endTime: string;   // HH:MM format
      days: string[];    // ['monday', 'tuesday', etc.]
    }>;
  };
  testCampaign?: {
    title: string;
    mediaUrl: string;
    mediaType: string;
    testMode: boolean;
    expiresAt: Date;
  };
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    // Add password field to the schema (not required as it's only for email auth)
    password: { type: String, select: false }, // Exclude from queries by default
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      required: true,
    },
    authProviderId: { type: String },
    channelUrl: { type: String },
    category: [{ type: String }],
    language: [{ type: String }],
    description: { type: String },
    // Account status
    isActive: { type: Boolean, default: true },
    // Overlay settings for streamers
    overlaySettings: {
      position: { type: String, default: 'bottom-right' }, // top-left, top-right, bottom-left, bottom-right
      size: { type: String, default: 'medium' }, // small, medium, large
      opacity: { type: Number, default: 80 }, // 0-100
      backgroundColor: { type: String, default: 'transparent' },
    },
    // Unique token for overlay access
    overlayToken: { type: String },
    // Overlay activity tracking fields
    overlayLastSeen: { type: Date },
    overlayActive: { type: Boolean, default: false },
    // Enhanced: Campaign selection strategy
    campaignSelectionStrategy: { 
      type: String, 
      enum: ['fair-rotation', 'weighted', 'time-rotation', 'performance', 'revenue-optimized'],
      default: 'fair-rotation' 
    },
    // Enhanced: Campaign rotation settings
    campaignRotationSettings: {
      preferredStrategy: { 
        type: String, 
        enum: ['fair-rotation', 'weighted', 'time-rotation', 'performance', 'revenue-optimized'],
        default: 'fair-rotation' 
      },
      rotationIntervalMinutes: { type: Number, default: 3 },
      priorityWeights: {
        paymentRate: { type: Number, default: 0.4 },
        performance: { type: Number, default: 0.3 },
        fairness: { type: Number, default: 0.3 }
      },
      blackoutPeriods: [{
        startTime: { type: String }, // HH:MM format
        endTime: { type: String },   // HH:MM format
        days: [{ type: String }]     // ['monday', 'tuesday', etc.]
      }]
    },
    // Test campaign data for overlay testing
    testCampaign: {
      title: { type: String },
      mediaUrl: { type: String },
      mediaType: { type: String },
      testMode: { type: Boolean },
      expiresAt: { type: Date }
    },
  },
  { timestamps: true }
);

// Explicitly export the schema for NestJS
export const UserSchema = userSchema;

// Use a function to safely get the User model
export function getUserModel(): Model<IUser> | null {
  if (typeof window === 'undefined') {
    return models.User || model<IUser>('User', userSchema);
  }
  return null;
}

// Define a named export for backward compatibility
export const User = getUserModel();

// No default export to avoid TypeScript issues
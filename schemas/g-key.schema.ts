import { Schema, Document } from 'mongoose';

export interface IGKey extends Document {
  userId: string;
  category: string;
  status: 'available' | 'locked' | 'cooloff';
  usageCount: number;
  lastUsed?: Date;
  cooloffEndsAt?: Date;
  lockedWith?: string; // Campaign ID when locked
  lockedAt?: Date;
  lastBrandId?: string; // Brand ID from the last completed campaign
  lastBrandCooloffHours?: number; // Highest cooloff period from campaigns with same brand
  createdAt: Date;
  updatedAt: Date;
}

export const GKeySchema = new Schema<IGKey>({
  userId: { type: String, required: true },
  category: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['available', 'locked', 'cooloff'], 
    default: 'available' 
  },
  usageCount: { type: Number, default: 0 },
  lastUsed: { type: Date },
  cooloffEndsAt: { type: Date },
  lockedWith: { type: String }, // Campaign ID
  lockedAt: { type: Date },
  lastBrandId: { type: String }, // Brand ID from last completed campaign
  lastBrandCooloffHours: { type: Number }, // Highest cooloff period for same brand
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound index for efficient queries
GKeySchema.index({ userId: 1, category: 1 }, { unique: true });
GKeySchema.index({ status: 1 });
GKeySchema.index({ cooloffEndsAt: 1 });

// Update the updatedAt field on save
GKeySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default GKeySchema;

import { Schema, Document } from 'mongoose';
export interface IGKey extends Document {
    userId: string;
    category: string;
    status: 'available' | 'locked' | 'cooloff';
    usageCount: number;
    lastUsed?: Date;
    cooloffEndsAt?: Date;
    lockedWith?: string;
    lockedAt?: Date;
    lastBrandId?: string;
    lastBrandCooloffHours?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const GKeySchema: Schema<IGKey, import("mongoose").Model<IGKey, any, any, any, Document<unknown, any, IGKey, any, {}> & IGKey & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IGKey, Document<unknown, {}, import("mongoose").FlatRecord<IGKey>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IGKey> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export default GKeySchema;
//# sourceMappingURL=g-key.schema.d.ts.map
import { Schema, Model } from 'mongoose';
import { AuthProvider } from '../lib/schema-types';
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
export declare const AuthSessionSchema: Schema<IAuthSession, Model<IAuthSession, any, any, any, import("mongoose").Document<unknown, any, IAuthSession, any, {}> & IAuthSession & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IAuthSession, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IAuthSession>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IAuthSession> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare function getAuthSessionModel(): Model<IAuthSession>;
export declare const AuthSession: Model<IAuthSession, {}, {}, {}, import("mongoose").Document<unknown, {}, IAuthSession, {}, {}> & IAuthSession & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=auth-session.schema.d.ts.map
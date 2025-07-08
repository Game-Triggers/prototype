import { Schema, Model } from 'mongoose';
import { CampaignStatus, MediaType } from '../lib/schema-types';
export { CampaignStatus, MediaType };
import { ICampaignDocument } from '../backend/src/types/mongoose-helpers';
export interface ICampaign extends ICampaignDocument {
}
export declare const CampaignSchema: Schema<ICampaign, Model<ICampaign, any, any, any, import("mongoose").Document<unknown, any, ICampaign> & ICampaign & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ICampaign, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ICampaign>> & import("mongoose").FlatRecord<ICampaign> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getCampaignModel(): Model<ICampaign>;
export declare const Campaign: Model<ICampaign, {}, {}, {}, import("mongoose").Document<unknown, {}, ICampaign> & ICampaign & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;

import { Schema, Model } from 'mongoose';
import { ParticipationStatus } from '../lib/schema-types';
import { ICampaignParticipationDocument } from '../backend/src/types/mongoose-helpers';
export { ParticipationStatus };
export interface ICampaignParticipation extends ICampaignParticipationDocument {
}
export declare const CampaignParticipationSchema: Schema<ICampaignParticipation, Model<ICampaignParticipation, any, any, any, import("mongoose").Document<unknown, any, ICampaignParticipation, any, {}> & ICampaignParticipation & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ICampaignParticipation, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ICampaignParticipation>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ICampaignParticipation> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getCampaignParticipationModel(): Model<ICampaignParticipation> | null;
export declare const CampaignParticipation: Model<ICampaignParticipation, {}, {}, {}, import("mongoose").Document<unknown, {}, ICampaignParticipation, {}, {}> & ICampaignParticipation & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any> | null;
//# sourceMappingURL=campaign-participation.schema.d.ts.map
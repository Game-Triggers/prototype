import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConflictRulesController } from './conflict-rules.controller';
import { ConflictRulesService } from './conflict-rules.service';
import {
  ConflictRuleSchema,
  ConflictViolationSchema,
} from '@schemas/conflict-rules.schema';
import { CampaignSchema } from '@schemas/campaign.schema';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ConflictRule', schema: ConflictRuleSchema },
      { name: 'ConflictViolation', schema: ConflictViolationSchema },
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
  ],
  controllers: [ConflictRulesController],
  providers: [ConflictRulesService],
  exports: [ConflictRulesService],
})
export class ConflictRulesModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignCompletionService } from './campaign-completion.service';
import { CampaignCompletionTaskService } from './campaign-completion-task.service';
import { CampaignMonitoringService } from './campaign-monitoring.service';
import { CampaignSchema } from '@schemas/campaign.schema';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';
import { UsersModule } from '../users/users.module';
import { ConflictRulesModule } from '../conflict-rules/conflict-rules.module';
import { ConflictRulesService } from '../conflict-rules/conflict-rules.service';
import { WalletModule } from '../wallet/wallet.module';
import { GKeyModule } from '../g-key/g-key.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
    UsersModule,
    ConflictRulesModule,
    WalletModule,
    GKeyModule,
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    CampaignCompletionService,
    CampaignCompletionTaskService,
    CampaignMonitoringService,
    {
      provide: 'ConflictRulesService',
      useExisting: ConflictRulesService,
    },
  ],
  exports: [CampaignsService, CampaignCompletionService, CampaignMonitoringService],
})
export class CampaignsModule {}

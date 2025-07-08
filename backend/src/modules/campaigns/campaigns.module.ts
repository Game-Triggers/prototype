import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignSchema } from '@schemas/campaign.schema';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';
import { UsersModule } from '../users/users.module';
import { ConflictRulesModule } from '../conflict-rules/conflict-rules.module';
import { ConflictRulesService } from '../conflict-rules/conflict-rules.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
    UsersModule,
    ConflictRulesModule,
    WalletModule,
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    {
      provide: 'ConflictRulesService',
      useExisting: ConflictRulesService,
    },
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}

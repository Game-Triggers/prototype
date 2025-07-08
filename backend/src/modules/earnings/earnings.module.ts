import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EarningsService } from './earnings.service';
import { EarningsController } from './earnings.controller';
import { CampaignSchema } from '@schemas/campaign.schema';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
  ],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}

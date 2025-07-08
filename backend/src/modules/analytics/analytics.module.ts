import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CampaignSchema } from '@schemas/campaign.schema';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
    UsersModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

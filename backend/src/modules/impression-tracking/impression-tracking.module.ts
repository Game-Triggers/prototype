import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';
import { ImpressionTrackingService } from './impression-tracking.service';
import { ImpressionTrackingTaskService } from './impression-tracking-task.service';
import { StreamVerificationModule } from '../stream-verification/stream-verification.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
    StreamVerificationModule,
    ScheduleModule.forRoot(),
    forwardRef(() => CampaignsModule),
  ],
  providers: [ImpressionTrackingService, ImpressionTrackingTaskService],
  exports: [ImpressionTrackingService],
})
export class ImpressionTrackingModule {}

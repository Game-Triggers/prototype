import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';
import { ImpressionTrackingService } from './impression-tracking.service';
import { ImpressionTrackingTaskService } from './impression-tracking-task.service';
import { StreamVerificationModule } from '../stream-verification/stream-verification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
    StreamVerificationModule,
    ScheduleModule.forRoot(),
  ],
  providers: [ImpressionTrackingService, ImpressionTrackingTaskService],
  exports: [ImpressionTrackingService],
})
export class ImpressionTrackingModule {}

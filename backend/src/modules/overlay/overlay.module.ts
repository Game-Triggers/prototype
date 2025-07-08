import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OverlayController } from './overlay.controller';
import { OverlayService } from './overlay.service';
import { CampaignSchema } from '@schemas/campaign.schema';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';
import { UserSchema } from '@schemas/user.schema';
import { EarningsModule } from '../earnings/earnings.module';
import { ImpressionTrackingModule } from '../impression-tracking/impression-tracking.module';
import { StreamVerificationModule } from '../stream-verification/stream-verification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
      { name: 'User', schema: UserSchema },
    ]),
    EarningsModule,
    ImpressionTrackingModule,
    StreamVerificationModule,
  ],
  controllers: [OverlayController],
  providers: [OverlayService],
  exports: [OverlayService],
})
export class OverlayModule {}

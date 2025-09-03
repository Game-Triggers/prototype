import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GKeyService } from './g-key.service';
import { GKeyController } from './g-key.controller';
import { GKeySchema } from '@schemas/g-key.schema';
import { CampaignSchema } from '@schemas/campaign.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'GKey', schema: GKeySchema },
      { name: 'Campaign', schema: CampaignSchema },
    ]),
  ],
  controllers: [GKeyController],
  providers: [GKeyService],
  exports: [GKeyService],
})
export class GKeyModule {}

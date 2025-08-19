import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { KYCService } from './kyc.service';
import { KYCController } from './kyc.controller';
import { WebhookController } from './webhook.controller';
import { CampaignEventsService } from './campaign-events.service';
import { NotificationService } from './notification.service';
import { AdminWalletService } from './admin-wallet.service';
import { AdminCampaignService } from './admin-campaign.service';
import { WalletSchema, TransactionSchema } from '@schemas/wallet.schema';
import { KYCSchema } from '@schemas/kyc.schema';
import { DisputeSchema, InvoiceSchema } from '@schemas/billing.schema';
import { CampaignSchema } from '@schemas/campaign.schema';
import { CampaignParticipationSchema } from '@schemas/campaign-participation.schema';
import { UserSchema } from '@schemas/user.schema';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Wallet', schema: WalletSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'KYC', schema: KYCSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Dispute', schema: DisputeSchema },
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignParticipation', schema: CampaignParticipationSchema },
    ]),
    NotificationModule,
  ],
  controllers: [
    WalletController,
    PaymentController,
    KYCController,
    WebhookController,
  ],
  providers: [
    WalletService,
    PaymentService,
    KYCService,
    CampaignEventsService,
    NotificationService,
    AdminWalletService,
    AdminCampaignService,
  ],
  exports: [
    WalletService,
    PaymentService,
    KYCService,
    CampaignEventsService,
    NotificationService,
    AdminWalletService,
    AdminCampaignService,
  ],
})
export class WalletModule {}

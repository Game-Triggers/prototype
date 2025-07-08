import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminFinanceController } from './admin-finance.controller';
import { AdminController } from './admin.controller';
import { AdminFinanceService } from './admin-finance.service';
import { WalletModule } from '../wallet/wallet.module';
import { WalletSchema, TransactionSchema } from '@schemas/wallet.schema';
import { UserSchema } from '@schemas/user.schema';
import { CampaignSchema } from '@schemas/campaign.schema';
import { KYCSchema } from '@schemas/kyc.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Wallet', schema: WalletSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'KYC', schema: KYCSchema },
    ]),
    WalletModule,
  ],
  controllers: [AdminFinanceController, AdminController],
  providers: [AdminFinanceService],
  exports: [AdminFinanceService],
})
export class AdminModule {}

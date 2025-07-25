import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OverlayModule } from './modules/overlay/overlay.module';
import { EarningsModule } from './modules/earnings/earnings.module';
import { UploadModule } from './modules/upload/upload.module';
import { StreamVerificationModule } from './modules/stream-verification/stream-verification.module';
import { ImpressionTrackingModule } from './modules/impression-tracking/impression-tracking.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminModule } from './modules/admin/admin.module';
import { ConflictRulesModule } from './modules/conflict-rules/conflict-rules.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '../.env', '../.env.local'], // Check both local and parent directory
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        console.log('MongoDB URI from config:', uri); // Debug log

        // Throw explicit error if URI is missing
        if (!uri) {
          throw new Error(
            'MONGODB_URI is undefined. Please check your .env file.',
          );
        }

        return {
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
      inject: [ConfigService],
    }),

    // Serve static files for campaign media
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Application modules
    UsersModule,
    AuthModule,
    CampaignsModule,
    AnalyticsModule,
    OverlayModule,
    EarningsModule,
    UploadModule,

    // New impression tracking and stream verification modules
    StreamVerificationModule,
    ImpressionTrackingModule,
    WalletModule,
    AdminModule,
    ConflictRulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

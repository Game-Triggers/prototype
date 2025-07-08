import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '@schemas/user.schema';
import { StreamVerificationService } from './services/stream-verification.service';
import { TwitchStreamVerifier } from './services/twitch-stream-verifier.service';
import { YouTubeStreamVerifier } from './services/youtube-stream-verifier.service';
import { StreamVerificationController } from './stream-verification.controller';
import { AuthTokenModule } from '../auth/auth-token.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    AuthTokenModule,
  ],
  controllers: [StreamVerificationController],
  providers: [
    StreamVerificationService,
    TwitchStreamVerifier,
    YouTubeStreamVerifier,
  ],
  exports: [StreamVerificationService],
})
export class StreamVerificationModule {}

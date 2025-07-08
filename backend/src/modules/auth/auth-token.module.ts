import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthTokenService } from './services/auth-token.service';
import { UserSchema } from '@schemas/user.schema';
import { AuthSessionSchema } from '@schemas/auth-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'AuthSession', schema: AuthSessionSchema },
    ]),
    HttpModule,
    ConfigModule,
  ],
  providers: [AuthTokenService],
  exports: [AuthTokenService],
})
export class AuthTokenModule {}

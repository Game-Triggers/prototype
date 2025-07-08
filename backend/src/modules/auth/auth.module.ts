import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/fixed-jwt.strategy';
import { TwitchStrategy } from './strategies/twitch.strategy';
import { YouTubeStrategy } from './strategies/youtube.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '@schemas/user.schema';
import { AuthTokenModule } from './auth-token.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    AuthTokenModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'testsecret',
        signOptions: { expiresIn: '30d' },
      }),
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TwitchStrategy,
    YouTubeStrategy,
    LocalStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}

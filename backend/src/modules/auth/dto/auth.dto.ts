import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  MinLength,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { AuthProvider, UserRole } from '@schemas/user.schema';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCredentialsDto {
  @ApiProperty({
    description: 'User email address',
    example: 'streamer@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'securePassword123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'User full name', example: 'Popular Streamer' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Company name (for brands)',
    example: 'Gaming Peripherals Inc.',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Company website (for brands)',
    example: 'https://gamingbrand.com',
  })
  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    enumName: 'UserRole',
    example: 'streamer',
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Channel URL for streamers',
    example: 'https://twitch.tv/popularstreamer',
  })
  @IsOptional()
  @IsString()
  channelUrl?: string;

  @ApiPropertyOptional({ description: 'Stream category', example: 'Gaming' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Stream language', example: 'English' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class LoginCredentialsDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

// DTO for OAuth profile data
export class OAuthProfileDto {
  @ApiProperty({
    description: 'User ID from the provider',
    example: '12345678',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  image?: string;
}

// DTO for OAuth token exchange
export class OAuthExchangeDto {
  @ApiProperty({
    description: 'OAuth access token from the provider',
    example: 'oauth2-token-from-twitch-or-youtube',
  })
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @ApiPropertyOptional({
    description: 'OAuth refresh token from the provider',
    example: 'refresh-token-from-provider',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'User profile information from the provider',
    type: OAuthProfileDto,
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => OAuthProfileDto)
  profile: OAuthProfileDto;
}

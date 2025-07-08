import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProvider, UserRole } from '@schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'User profile image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.STREAMER,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Authentication provider',
    enum: AuthProvider,
    enumName: 'AuthProvider',
    example: AuthProvider.TWITCH,
  })
  @IsNotEmpty()
  @IsEnum(AuthProvider)
  authProvider: AuthProvider;

  @ApiPropertyOptional({
    description: 'ID from the authentication provider',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  authProviderId?: string;

  @ApiPropertyOptional({
    description: 'Channel URL for streamers',
    example: 'https://twitch.tv/username',
  })
  @IsOptional()
  @IsString()
  channelUrl?: string;

  @ApiPropertyOptional({
    description: 'Stream categories',
    example: ['Gaming', 'Just Chatting'],
  })
  @IsOptional()
  @IsArray()
  category?: string[];

  @ApiPropertyOptional({
    description: 'Stream languages',
    example: ['English', 'Spanish'],
  })
  @IsOptional()
  @IsArray()
  language?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  channelUrl?: string;

  @IsOptional()
  @IsArray()
  category?: string[];

  @IsOptional()
  @IsArray()
  language?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class UserFilterDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  category?: string[];

  @IsOptional()
  @IsArray()
  language?: string[];
}

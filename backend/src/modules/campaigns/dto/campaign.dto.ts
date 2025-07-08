import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsMongoId,
  IsDate,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus, MediaType } from '@schemas/campaign.schema';
import { Transform, Type } from 'class-transformer';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign title',
    example: 'Summer Gaming Promotion',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed campaign description',
    example: 'Promote our new gaming products during your streams',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'MongoDB ID of the brand creating the campaign',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  brandId: string;

  @ApiProperty({
    description: 'Total campaign budget in INR',
    minimum: 0,
    example: 10000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiProperty({
    description: 'URL to the campaign media (image, video, etc)',
    example: 'https://example.com/media/campaign123.mp4',
  })
  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @ApiProperty({
    description: 'Type of media used in the campaign',
    enum: MediaType,
    enumName: 'MediaType',
    example: MediaType.VIDEO,
  })
  @IsNotEmpty()
  @IsEnum(MediaType)
  mediaType: MediaType;

  @ApiPropertyOptional({
    description: 'Campaign status',
    enum: CampaignStatus,
    enumName: 'CampaignStatus',
    default: CampaignStatus.DRAFT,
    example: CampaignStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Categories associated with the campaign',
    type: [String],
    example: ['Gaming', 'Technology'],
  })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  paymentRate: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['cpm', 'fixed'])
  paymentType: 'cpm' | 'fixed';
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingBudget?: number;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentRate?: number;

  @IsOptional()
  @IsString()
  @IsIn(['cpm', 'fixed'])
  paymentType?: 'cpm' | 'fixed';
}

export class CampaignFilterDto {
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  brandId?: string;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsString()
  adminAccess?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class JoinCampaignDto {
  @IsNotEmpty()
  @IsMongoId()
  campaignId: string;

  // streamerId is optional since it will be extracted from the JWT token
  @IsMongoId()
  streamerId?: string;
}

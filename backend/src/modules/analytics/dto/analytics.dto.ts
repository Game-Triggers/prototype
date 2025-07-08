import {
  IsString,
  IsOptional,
  IsMongoId,
  IsEnum,
  IsDate,
  IsInt,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum DateGrouping {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsMongoId()
  campaignId?: string;

  @IsOptional()
  @IsMongoId()
  streamerId?: string;

  @IsOptional()
  @IsMongoId()
  brandId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(DateGrouping)
  groupBy?: DateGrouping = DateGrouping.DAILY;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 30;
}

export class StreamerAnalyticsDto {
  @IsMongoId()
  streamerId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class BrandAnalyticsDto {
  @IsMongoId()
  brandId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class CampaignAnalyticsDto {
  @IsMongoId()
  campaignId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

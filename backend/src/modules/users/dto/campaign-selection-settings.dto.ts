import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class PriorityWeightsDto {
  @ApiProperty({ example: 0.4, description: 'Weight for payment rate factor' })
  @IsNumber()
  @Min(0)
  @Max(1)
  paymentRate: number;

  @ApiProperty({ example: 0.3, description: 'Weight for performance factor' })
  @IsNumber()
  @Min(0)
  @Max(1)
  performance: number;

  @ApiProperty({ example: 0.3, description: 'Weight for fairness factor' })
  @IsNumber()
  @Min(0)
  @Max(1)
  fairness: number;
}

class BlackoutPeriodDto {
  @ApiProperty({ example: '22:00', description: 'Start time in HH:MM format' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '06:00', description: 'End time in HH:MM format' })
  @IsString()
  endTime: string;

  @ApiProperty({
    example: ['monday', 'tuesday', 'wednesday'],
    description: 'Days of the week for blackout period',
  })
  @IsArray()
  @IsString({ each: true })
  days: string[];
}

class CampaignRotationSettingsDto {
  @ApiProperty({
    example: 'fair-rotation',
    enum: [
      'fair-rotation',
      'weighted',
      'time-rotation',
      'performance',
      'revenue-optimized',
    ],
    description: 'Preferred campaign selection strategy',
  })
  @IsString()
  preferredStrategy: string;

  @ApiProperty({ example: 3, description: 'Rotation interval in minutes' })
  @IsNumber()
  @Min(1)
  @Max(60)
  rotationIntervalMinutes: number;

  @ApiProperty({ description: 'Priority weights for weighted selection' })
  @ValidateNested()
  @Type(() => PriorityWeightsDto)
  priorityWeights: PriorityWeightsDto;

  @ApiProperty({
    description: 'Blackout periods when campaigns should not be displayed',
    type: [BlackoutPeriodDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlackoutPeriodDto)
  blackoutPeriods?: BlackoutPeriodDto[];
}

export class CampaignSelectionSettingsDto {
  @ApiProperty({
    example: 'fair-rotation',
    enum: [
      'fair-rotation',
      'weighted',
      'time-rotation',
      'performance',
      'revenue-optimized',
    ],
    description: 'Overall campaign selection strategy',
  })
  @IsString()
  campaignSelectionStrategy: string;

  @ApiProperty({ description: 'Campaign rotation settings' })
  @ValidateNested()
  @Type(() => CampaignRotationSettingsDto)
  campaignRotationSettings: CampaignRotationSettingsDto;
}

export class CampaignSelectionSettingsResponseDto {
  @ApiProperty({ description: 'Campaign selection strategy' })
  campaignSelectionStrategy: string;

  @ApiProperty({ description: 'Campaign rotation settings' })
  campaignRotationSettings: CampaignRotationSettingsDto;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Settings last updated timestamp',
  })
  updatedAt: Date;
}

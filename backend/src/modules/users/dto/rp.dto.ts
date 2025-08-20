import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RPActivityDto {
  @ApiProperty({
    description: 'Type of activity that earned RP',
    example: 'signup',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Amount of RP earned',
    example: 5,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'When the RP was earned',
    example: '2024-01-01T12:00:00Z',
  })
  @IsDateString()
  earnedAt: Date;
}

export class RPDto {
  @ApiProperty({
    description: 'Total RP accumulated',
    example: 75,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'RP earned today',
    example: 15,
  })
  @IsNumber()
  earnedToday: number;

  @ApiPropertyOptional({
    description: 'Last time RP was earned',
    example: '2024-01-01T12:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  lastEarned?: Date;

  @ApiProperty({
    description: 'Recent RP activities',
    type: [RPActivityDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RPActivityDto)
  activities: RPActivityDto[];
}

export class RPResponseDto {
  @ApiProperty({
    description: 'Total RP accumulated',
    example: 75,
  })
  total: number;

  @ApiProperty({
    description: 'RP earned today',
    example: 15,
  })
  earnedToday: number;

  @ApiPropertyOptional({
    description: 'Last time RP was earned',
    example: '2024-01-01T12:00:00Z',
  })
  lastEarned?: Date | null;

  @ApiProperty({
    description: 'Recent RP activities',
    type: [RPActivityDto],
  })
  activities: RPActivityDto[];
}

export class AddRPDto {
  @ApiProperty({
    description: 'Type of activity earning RP',
    example: 'signup',
  })
  @IsString()
  activityType: string;

  @ApiProperty({
    description: 'Amount of RP to add',
    example: 5,
  })
  @IsNumber()
  amount: number;
}

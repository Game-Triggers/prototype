import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConflictType, ConflictSeverity } from '@schemas/conflict-rules.schema';

export class CreateConflictRuleDto {
  @ApiProperty({ example: 'Gaming Category Exclusivity' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Prevents streamers from joining multiple gaming campaigns',
  })
  @IsString()
  description: string;

  @ApiProperty({
    enum: ConflictType,
    example: ConflictType.CATEGORY_EXCLUSIVITY,
  })
  @IsEnum(ConflictType)
  type: ConflictType;

  @ApiProperty({ enum: ConflictSeverity, example: ConflictSeverity.BLOCKING })
  @IsEnum(ConflictSeverity)
  severity: ConflictSeverity;

  @ApiProperty({
    description: 'Rule configuration object',
    example: {
      categories: ['gaming', 'tech'],
      cooldownPeriodDays: 30,
    },
  })
  @IsObject()
  config: Record<string, unknown>;

  @ApiProperty({
    description: 'Rule scope and applicability',
    example: {
      userRoles: ['streamer'],
    },
  })
  @IsObject()
  scope: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateConflictRuleDto {
  @ApiPropertyOptional({ example: 'Updated Gaming Category Exclusivity' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ConflictSeverity,
    example: ConflictSeverity.WARNING,
  })
  @IsOptional()
  @IsEnum(ConflictSeverity)
  severity?: ConflictSeverity;

  @ApiPropertyOptional({
    description: 'Updated rule configuration',
    example: {
      categories: ['gaming', 'tech', 'lifestyle'],
      cooldownPeriodDays: 15,
    },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Updated rule scope',
    example: {
      userRoles: ['streamer', 'brand'],
    },
  })
  @IsOptional()
  @IsObject()
  scope?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class OverrideViolationDto {
  @ApiProperty({ example: 'Manual override due to business exception' })
  @IsString()
  reason: string;
}

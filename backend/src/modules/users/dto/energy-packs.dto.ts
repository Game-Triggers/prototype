import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnergyPacksDto {
  @ApiProperty({
    description: 'Current available energy packs',
    example: 8,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  current?: number;

  @ApiProperty({
    description: 'Maximum energy packs allowed',
    example: 10,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maximum?: number;

  @ApiProperty({
    description: 'Daily used energy packs',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyUsed?: number;
}

export class EnergyPacksResponseDto {
  @ApiProperty({
    description: 'Current available energy packs',
    example: 8,
  })
  current: number;

  @ApiProperty({
    description: 'Maximum energy packs allowed',
    example: 10,
  })
  maximum: number;

  @ApiProperty({
    description: 'Last reset timestamp',
    example: '2025-08-18T00:00:00.000Z',
  })
  lastReset: string;

  @ApiProperty({
    description: 'Daily used energy packs',
    example: 2,
  })
  dailyUsed: number;

  @ApiProperty({
    description: 'Hours until next reset',
    example: 18,
  })
  hoursUntilReset: number;

  @ApiProperty({
    description: 'Minutes until next reset (within the hour)',
    example: 45,
  })
  minutesUntilReset: number;
}

export class ConsumeEnergyPackDto {
  @ApiProperty({
    description: 'Campaign ID that energy pack is being used for',
    example: '60d21b4667d0d8992e610c85',
  })
  campaignId: string;
}

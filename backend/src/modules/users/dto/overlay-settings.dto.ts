import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OverlaySettingsDto {
  @ApiPropertyOptional({
    description: 'Position of the overlay on screen',
    enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    example: 'top-right',
  })
  @IsString()
  @IsOptional()
  @IsIn(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
  position?: string | null;

  @ApiPropertyOptional({
    description: 'Size of the overlay',
    enum: ['small', 'medium', 'large'],
    example: 'medium',
  })
  @IsString()
  @IsOptional()
  @IsIn(['small', 'medium', 'large'])
  size?: string | null;

  @ApiPropertyOptional({
    description: 'Opacity percentage of the overlay',
    minimum: 20,
    maximum: 100,
    example: 75,
  })
  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(100)
  opacity?: number | null;

  @ApiPropertyOptional({
    description: 'Background color in hex or rgba format',
    example: '#ffffff',
  })
  @IsString()
  @IsOptional()
  backgroundColor?: string | null;
}

export class OverlaySettingsResponseDto {
  @ApiProperty({
    description: 'Position of the overlay on screen',
    enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    example: 'top-right',
  })
  position: string;

  @ApiProperty({
    description: 'Size of the overlay',
    enum: ['small', 'medium', 'large'],
    example: 'medium',
  })
  size: string;

  @ApiProperty({
    description: 'Opacity percentage of the overlay',
    minimum: 20,
    maximum: 100,
    example: 75,
  })
  opacity: number;

  @ApiProperty({
    description: 'Background color in hex or rgba format',
    example: '#ffffff',
  })
  backgroundColor: string;

  @ApiProperty({
    description: 'Token for accessing the overlay',
    example: 'abc123xyz456',
  })
  overlayToken: string;
}

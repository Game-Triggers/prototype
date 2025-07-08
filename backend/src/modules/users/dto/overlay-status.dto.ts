import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OverlayStatusResponseDto {
  @IsBoolean()
  active: boolean;

  @IsString()
  @IsOptional()
  lastSeen?: string;
}

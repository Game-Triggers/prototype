import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class XPActivityDto {
  @ApiProperty({
    description: 'Type of activity that earned XP',
    example: 'signup',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Amount of XP earned',
    example: 10,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'When the XP was earned',
    example: '2024-01-01T12:00:00Z',
  })
  @IsDateString()
  earnedAt: Date;
}

export class XPDto {
  @ApiProperty({
    description: 'Total XP accumulated',
    example: 150,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
<<<<<<< HEAD

    description: 'Current level based on XP',
    example: 3,
  })
  @IsNumber()
  level: number;

  @ApiProperty({
=======
>>>>>>> 4ce3f0d (feat: implement comprehensive RP (Reputation Points) system- Add RP context and state management with daily reset functionality- Create RP display component with green shield icon and hover tooltip- Implement RP constants with level calculation and activity rewards- Add backend RP DTOs, services, and API endpoints- Integrate RP system into navbar alongside XP, Energy, and Streak- Add RP field to user schema with activity tracking- Implement automatic RP rewards on user signup (5 RP)- Create debug/test interface for RP functionality- Design extensible system for future activity-based RP rewards- Add comprehensive error handling and loading states- Include real-time RP updates and daily progress tracking)
    description: 'XP earned today',
    example: 25,
  })
  @IsNumber()
  earnedToday: number;

  @ApiPropertyOptional({
    description: 'Last time XP was earned',
    example: '2024-01-01T12:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  lastEarned?: Date;

  @ApiProperty({
    description: 'Recent XP activities',
    type: [XPActivityDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => XPActivityDto)
  activities: XPActivityDto[];
}

export class XPResponseDto {
  @ApiProperty({
    description: 'Total XP accumulated',
    example: 150,
  })
  total: number;

  @ApiProperty({
<<<<<<< HEAD

    description: 'Current level based on XP',
    example: 3,
  })
  level: number;

  @ApiProperty({
=======
>>>>>>> 4ce3f0d (feat: implement comprehensive RP (Reputation Points) system- Add RP context and state management with daily reset functionality- Create RP display component with green shield icon and hover tooltip- Implement RP constants with level calculation and activity rewards- Add backend RP DTOs, services, and API endpoints- Integrate RP system into navbar alongside XP, Energy, and Streak- Add RP field to user schema with activity tracking- Implement automatic RP rewards on user signup (5 RP)- Create debug/test interface for RP functionality- Design extensible system for future activity-based RP rewards- Add comprehensive error handling and loading states- Include real-time RP updates and daily progress tracking)
    description: 'XP earned today',
    example: 25,
  })
  earnedToday: number;

  @ApiPropertyOptional({
    description: 'Last time XP was earned',
    example: '2024-01-01T12:00:00Z',
  })
  lastEarned?: Date | null;

  @ApiProperty({
    description: 'Recent XP activities',
    type: [XPActivityDto],
  })
  activities: XPActivityDto[];
}

export class AddXPDto {
  @ApiProperty({
    description: 'Type of activity earning XP',
    example: 'signup',
  })
  @IsString()
  activityType: string;

  @ApiProperty({
    description: 'Amount of XP to add',
    example: 10,
  })
  @IsNumber()
  amount: number;
}

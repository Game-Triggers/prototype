import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { StreamVerificationService } from './services/stream-verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('stream-verification')
@Controller('stream-verification')
export class StreamVerificationController {
  constructor(
    private readonly streamVerificationService: StreamVerificationService,
  ) {}

  @Get('status/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check if a streamer's stream is live" })
  @ApiParam({ name: 'userId', type: String, description: 'ID of the streamer' })
  @ApiResponse({ status: 200, description: 'Stream status information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Streamer not found' })
  async checkStreamStatus(
    @Req() req: RequestWithUser,
    @Param('userId') userId: string,
  ) {
    // Verify that the user is checking their own status or has admin rights
    if (
      !req.user ||
      (req.user.userId !== userId && req.user.role !== 'admin')
    ) {
      return {
        isLive: false,
        viewerCount: 0,
        error: 'Permission denied',
        platform: 'unknown',
      };
    }

    const streamStatus =
      await this.streamVerificationService.verifyStream(userId);

    return {
      isLive: streamStatus.isLive,
      viewerCount: streamStatus.viewerCount,
      platform: streamStatus.platform || 'unknown',
      lastChecked: new Date().toISOString(),
    };
  }
}

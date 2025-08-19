import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/test-notifications')
@ApiTags('admin-test-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TestNotificationController {
  private readonly logger = new Logger(TestNotificationController.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('campaign-activated')
  @ApiOperation({ summary: 'Test campaign activation notification' })
  @ApiResponse({ status: 200, description: 'Test notification triggered' })
  async testCampaignActivated(
    @Body() body: {
      campaignId: string;
      campaignName: string;
      brandUserId: string;
      budget: number;
    }
  ) {
    try {
      this.eventEmitter.emit('campaign.activated', {
        campaignId: body.campaignId,
        campaignName: body.campaignName,
        brandUserId: body.brandUserId,
        budget: body.budget,
      });

      this.logger.log(`Test campaign activation event emitted for campaign ${body.campaignId}`);
      
      return {
        success: true,
        message: 'Campaign activation notification test triggered',
        data: body,
      };
    } catch (error) {
      this.logger.error(`Failed to trigger test notification: ${error.message}`);
      throw error;
    }
  }

  @Post('earnings-credited')
  @ApiOperation({ summary: 'Test earnings credited notification' })
  @ApiResponse({ status: 200, description: 'Test notification triggered' })
  async testEarningsCredited(
    @Body() body: {
      userId: string;
      amount: number;
      campaignId?: string;
      campaignName?: string;
      reason: string;
    }
  ) {
    try {
      this.eventEmitter.emit('earnings.credited', {
        userId: body.userId,
        amount: body.amount,
        campaignId: body.campaignId,
        campaignName: body.campaignName,
        reason: body.reason,
      });

      this.logger.log(`Test earnings credited event emitted for user ${body.userId}`);
      
      return {
        success: true,
        message: 'Earnings credited notification test triggered',
        data: body,
      };
    } catch (error) {
      this.logger.error(`Failed to trigger test notification: ${error.message}`);
      throw error;
    }
  }

  @Post('streak-warning')
  @ApiOperation({ summary: 'Test streak warning notification' })
  @ApiResponse({ status: 200, description: 'Test notification triggered' })
  async testStreakWarning(
    @Body() body: {
      userId: string;
      currentStreak: number;
      hoursUntilBreak: number;
    }
  ) {
    try {
      this.eventEmitter.emit('streak.warning', {
        userId: body.userId,
        currentStreak: body.currentStreak,
        hoursUntilBreak: body.hoursUntilBreak,
      });

      this.logger.log(`Test streak warning event emitted for user ${body.userId}`);
      
      return {
        success: true,
        message: 'Streak warning notification test triggered',
        data: body,
      };
    } catch (error) {
      this.logger.error(`Failed to trigger test notification: ${error.message}`);
      throw error;
    }
  }

  @Post('campaign-budget-low')
  @ApiOperation({ summary: 'Test low budget warning notification' })
  @ApiResponse({ status: 200, description: 'Test notification triggered' })
  async testCampaignBudgetLow(
    @Body() body: {
      campaignId: string;
      campaignName: string;
      brandUserId: string;
      remainingBudget: number;
      threshold: number;
    }
  ) {
    try {
      this.eventEmitter.emit('campaign.budget.low', {
        campaignId: body.campaignId,
        campaignName: body.campaignName,
        brandUserId: body.brandUserId,
        remainingBudget: body.remainingBudget,
        threshold: body.threshold,
      });

      this.logger.log(`Test low budget event emitted for campaign ${body.campaignId}`);
      
      return {
        success: true,
        message: 'Low budget warning notification test triggered',
        data: body,
      };
    } catch (error) {
      this.logger.error(`Failed to trigger test notification: ${error.message}`);
      throw error;
    }
  }
}

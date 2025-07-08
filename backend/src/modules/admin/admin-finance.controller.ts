import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminFinanceService } from './admin-finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@schemas/user.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: any;
}

@ApiTags('admin-finance')
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminFinanceController {
  constructor(private readonly adminFinanceService: AdminFinanceService) {}

  /**
   * Helper method to extract user ID from request
   */
  private getUserId(req: RequestWithUser): string {
    return req.user?.userId || req.user?.sub || req.user?.id;
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Get finance overview',
    description: 'Get financial statistics and overview data',
  })
  @ApiResponse({ status: 200, description: 'Finance overview data' })
  async getFinanceOverview() {
    return this.adminFinanceService.getFinanceOverview();
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Get transactions with filters',
    description: 'Get all transactions with filtering options',
  })
  @ApiResponse({ status: 200, description: 'Filtered transactions list' })
  async getTransactions(
    @Query('status') status?: string,
    @Query('userRole') userRole?: string,
    @Query('transactionType') transactionType?: string,
    @Query('dateRange') dateRange?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      status,
      userRole,
      transactionType,
      dateRange,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    };

    return this.adminFinanceService.getTransactionsWithUsers(filters);
  }

  @Get('withdrawals')
  @ApiOperation({
    summary: 'Get withdrawal requests',
    description: 'Get all pending withdrawal requests',
  })
  @ApiResponse({ status: 200, description: 'Withdrawal requests list' })
  async getWithdrawalRequests() {
    return {
      withdrawals: await this.adminFinanceService.getWithdrawalRequests(),
    };
  }

  @Patch('withdrawals/:id')
  @ApiOperation({
    summary: 'Process withdrawal request',
    description: 'Approve or reject a withdrawal request',
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal processed successfully',
  })
  async processWithdrawal(
    @Param('id') withdrawalId: string,
    @Body() body: { action: 'approve' | 'reject'; notes?: string },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    if (!adminId) {
      throw new ForbiddenException('Admin ID not found');
    }

    const result = await this.adminFinanceService.processWithdrawalRequest(
      withdrawalId,
      body.action,
      adminId,
      body.notes,
    );

    return {
      success: true,
      message: `Withdrawal ${body.action}d successfully`,
      transaction: result,
    };
  }

  @Get('disputes')
  @ApiOperation({
    summary: 'Get payment disputes',
    description: 'Get all payment disputes',
  })
  @ApiResponse({ status: 200, description: 'Payment disputes list' })
  async getDisputes() {
    return this.adminFinanceService.getDisputeStatistics();
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({
    summary: 'Resolve payment dispute',
    description: 'Resolve a payment dispute',
  })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  async resolveDispute(
    @Param('id') disputeId: string,
    @Body() body: { resolution: string; action: 'approve' | 'reject' },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);

    // This would integrate with dispute resolution logic
    return {
      success: true,
      message: `Dispute ${body.action}d successfully`,
      disputeId,
      resolution: body.resolution,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    };
  }

  @Get('transactions/:id/audit')
  @ApiOperation({
    summary: 'Get transaction audit trail',
    description: 'Get detailed audit trail for a specific transaction',
  })
  @ApiResponse({ status: 200, description: 'Transaction audit trail' })
  async getTransactionAuditTrail(@Param('id') transactionId: string) {
    return {
      auditTrail:
        await this.adminFinanceService.getTransactionAuditTrail(transactionId),
    };
  }

  @Get('reports')
  @ApiOperation({
    summary: 'Generate finance report',
    description: 'Generate financial reports for specified date range',
  })
  @ApiResponse({ status: 200, description: 'Financial report data' })
  async generateReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('type') reportType: 'summary' | 'detailed' = 'summary',
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return {
      reportType,
      dateRange: { startDate: start, endDate: end },
      data: await this.adminFinanceService.generateFinanceReport(
        start,
        end,
        reportType,
      ),
    };
  }
}

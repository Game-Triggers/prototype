import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/enhanced-jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermissions,
  RequireAnyPermission,
  RequirePortal,
} from '../auth/decorators/permissions.decorator';
import { Permission, Portal } from '../../../../lib/eureka-roles';
import { RequestWithUser } from '../auth/interfaces/enhanced-request.interface';

/**
 * Example controller demonstrating the Eureka Role-Based Access Control system
 * 
 * This controller shows how to:
 * - Protect routes with specific permissions
 * - Use portal-based access control
 * - Handle different permission combinations
 * - Access user role information in controllers
 */
@Controller('example/rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RBACExampleController {
  /**
   * Example endpoint that requires specific permissions
   * Only users with CREATE_CAMPAIGN permission can access
   */
  @Post('campaigns')
  @RequirePermissions(Permission.CREATE_CAMPAIGN)
  async createCampaign(
    @Body() campaignData: any,
    @Request() req: RequestWithUser,
  ) {
    return {
      message: 'Campaign creation endpoint',
      userRole: req.userRole,
      userPortal: req.userPortal,
      campaignData,
    };
  }

  /**
   * Example endpoint requiring multiple permissions (AND logic)
   * User must have ALL specified permissions
   */
  @Put('campaigns/:id/approve')
  @RequirePermissions(Permission.APPROVE_CAMPAIGN, Permission.READ_CAMPAIGN)
  async approveCampaign(@Param('id') id: string, @Request() req: RequestWithUser) {
    return {
      message: `Campaign ${id} approved`,
      approvedBy: req.user.email,
      userRole: req.userRole,
    };
  }

  /**
   * Example endpoint requiring any of several permissions (OR logic)
   * User needs at least ONE of the specified permissions
   */
  @Get('campaigns/:id/analytics')
  @RequireAnyPermission(
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.VIEW_PERFORMANCE_METRICS,
  )
  async getCampaignAnalytics(@Param('id') id: string, @Request() req: RequestWithUser) {
    return {
      message: `Analytics for campaign ${id}`,
      viewedBy: req.user.email,
      userPermissions: req.userPermissions,
    };
  }

  /**
   * Example endpoint restricted to Brand Portal users
   */
  @Get('brand-dashboard')
  @RequirePortal(Portal.BRAND)
  async getBrandDashboard(@Request() req: RequestWithUser) {
    return {
      message: 'Brand portal dashboard data',
      portal: req.userPortal,
      userRole: req.userRole,
    };
  }

  /**
   * Example endpoint for Admin Portal users only
   */
  @Get('admin-stats')
  @RequirePortal(Portal.ADMIN)
  @RequireAnyPermission(
    Permission.VIEW_SYSTEM_LOGS,
    Permission.CONFIGURE_PLATFORM,
  )
  async getAdminStats(@Request() req: RequestWithUser) {
    return {
      message: 'Admin statistics',
      portal: req.userPortal,
      systemAccess: req.userPermissions.includes(Permission.CONFIGURE_PLATFORM),
    };
  }

  /**
   * Example endpoint for Publisher Portal users
   */
  @Get('publisher-earnings')
  @RequirePortal(Portal.PUBLISHER)
  @RequirePermissions(Permission.VIEW_BILLING)
  async getPublisherEarnings(@Request() req: RequestWithUser) {
    return {
      message: 'Publisher earnings data',
      portal: req.userPortal,
      publisherId: req.user.id,
    };
  }

  /**
   * Financial operations - only for users with financial permissions
   */
  @Post('financial/upload-funds')
  @RequirePermissions(Permission.UPLOAD_FUNDS)
  async uploadFunds(@Body() fundData: any, @Request() req: RequestWithUser) {
    return {
      message: 'Funds uploaded successfully',
      uploadedBy: req.user.email,
      amount: fundData.amount,
      userRole: req.userRole,
    };
  }

  /**
   * User management - requires user management permissions
   */
  @Post('users')
  @RequirePermissions(Permission.CREATE_USER)
  async createUser(@Body() userData: any, @Request() req: RequestWithUser) {
    return {
      message: 'User created successfully',
      createdBy: req.user.email,
      newUser: userData,
      creatorRole: req.userRole,
    };
  }

  /**
   * Role assignment - requires role assignment permission
   */
  @Put('users/:id/role')
  @RequirePermissions(Permission.ASSIGN_ROLES)
  async assignRole(
    @Param('id') userId: string,
    @Body() roleData: { role: string },
    @Request() req: RequestWithUser,
  ) {
    // In a real implementation, you would validate the role assignment
    // using the EurekaRoleService.validateRoleChange method
    return {
      message: `Role assigned to user ${userId}`,
      assignedBy: req.user.email,
      newRole: roleData.role,
      assignerRole: req.userRole,
    };
  }

  /**
   * Support operations - escalation capabilities
   */
  @Post('support/escalate/:ticketId')
  @RequirePermissions(Permission.ESCALATE_TICKETS)
  async escalateTicket(
    @Param('ticketId') ticketId: string,
    @Body() escalationData: any,
    @Request() req: RequestWithUser,
  ) {
    return {
      message: `Ticket ${ticketId} escalated`,
      escalatedBy: req.user.email,
      userRole: req.userRole,
      escalationReason: escalationData.reason,
    };
  }

  /**
   * Super admin operations - only for super admin role
   */
  @Delete('system/reset')
  @RequirePermissions(Permission.OVERRIDE_SYSTEM)
  async systemReset(@Request() req: RequestWithUser) {
    return {
      message: 'System reset initiated',
      initiatedBy: req.user.email,
      userRole: req.userRole,
      timestamp: new Date(),
    };
  }

  /**
   * Example of conditional logic based on user permissions
   */
  @Get('campaigns')
  @RequirePermissions(Permission.READ_CAMPAIGN)
  async getCampaigns(@Request() req: RequestWithUser) {
    const canViewDetailed = req.userPermissions?.includes(
      Permission.VIEW_DETAILED_ANALYTICS,
    );
    const canDelete = req.userPermissions?.includes(Permission.DELETE_CAMPAIGN);

    return {
      message: 'Campaigns retrieved',
      campaigns: [
        {
          id: 1,
          title: 'Sample Campaign',
          // Include detailed info only if user has permission
          ...(canViewDetailed && {
            detailedAnalytics: { impressions: 1000, clicks: 50 },
          }),
        },
      ],
      userCapabilities: {
        canViewDetailed,
        canDelete,
        canApprove: req.userPermissions?.includes(Permission.APPROVE_CAMPAIGN),
      },
      userRole: req.userRole,
      userPortal: req.userPortal,
    };
  }

  /**
   * Example health check endpoint that shows user info
   */
  @Get('user-info')
  async getUserInfo(@Request() req: RequestWithUser) {
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      eurekaRole: req.userRole,
      portal: req.userPortal,
      permissions: req.userPermissions,
      capabilities: {
        canDelete: req.userPermissions?.includes(Permission.DELETE_CAMPAIGN) || 
                   req.userPermissions?.includes(Permission.DELETE_USER),
        canManageUsers: req.userPermissions?.includes(Permission.ASSIGN_ROLES),
        canViewAnalytics: req.userPermissions?.includes(Permission.VIEW_ANALYTICS),
        canManageFinances: req.userPermissions?.includes(Permission.MANAGE_BUDGET),
      },
    };
  }
}

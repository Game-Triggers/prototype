import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ConflictRulesService,
  ConflictCheckResult,
} from './conflict-rules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@schemas/user.schema';
import {
  IConflictRule,
  IConflictViolation,
  ConflictType,
  ConflictSeverity,
} from '@schemas/conflict-rules.schema';
import {
  CreateConflictRuleDto,
  UpdateConflictRuleDto,
  OverrideViolationDto,
} from './dto/conflict-rules.dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId?: string;
    role?: UserRole;
    _id?: string;
  };
}

@ApiTags('conflict-rules')
@Controller('conflict-rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConflictRulesController {
  constructor(private readonly conflictRulesService: ConflictRulesService) {}

  @Post('check/:streamerId/:campaignId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STREAMER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Check campaign join conflicts',
    description: 'Check if a streamer can join a campaign without conflicts',
  })
  @ApiParam({ name: 'streamerId', description: 'Streamer ID' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Conflict check result',
  })
  async checkCampaignJoinConflicts(
    @Param('streamerId') streamerId: string,
    @Param('campaignId') campaignId: string,
  ): Promise<ConflictCheckResult> {
    try {
      return await this.conflictRulesService.checkCampaignJoinConflicts(
        streamerId,
        campaignId,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to check conflicts: ${error.message}`,
      );
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all conflict rules',
    description: 'Retrieve all conflict rules (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of conflict rules',
  })
  async getConflictRules(): Promise<IConflictRule[]> {
    return this.conflictRulesService.getConflictRules();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create conflict rule',
    description: 'Create a new conflict rule (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Conflict rule created successfully',
  })
  async createConflictRule(
    @Body() createDto: any, // Temporarily accept any body for testing
    @Req() req: RequestWithUser,
  ): Promise<IConflictRule> {
    try {
      const userId = req.user?.userId || req.user?._id;
      if (!userId) {
        throw new BadRequestException('User ID not found');
      }

      // Add default values for testing
      const ruleData = {
        name: createDto.name || 'Test Rule',
        description: createDto.description || 'Test Description',
        type: createDto.type || 'category_exclusivity',
        severity: createDto.severity || 'blocking',
        config: createDto.config || {},
        scope: createDto.scope || {},
        priority: createDto.priority || 1,
        isActive: createDto.isActive !== undefined ? createDto.isActive : true,
        createdBy: userId,
      };

      return await this.conflictRulesService.createConflictRule(ruleData);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create conflict rule: ${error.message}`,
      );
    }
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update conflict rule',
    description: 'Update an existing conflict rule (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Conflict rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Conflict rule updated successfully',
  })
  async updateConflictRule(
    @Param('id') ruleId: string,
    @Body() updateDto: any, // Temporarily accept any body for testing
  ): Promise<IConflictRule> {
    try {
      const updated = await this.conflictRulesService.updateConflictRule(
        ruleId,
        updateDto,
      );

      if (!updated) {
        throw new NotFoundException('Conflict rule not found');
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update conflict rule: ${error.message}`,
      );
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete conflict rule',
    description: 'Delete a conflict rule (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Conflict rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Conflict rule deleted successfully',
  })
  async deleteConflictRule(
    @Param('id') ruleId: string,
  ): Promise<{ success: boolean }> {
    try {
      const deleted =
        await this.conflictRulesService.deleteConflictRule(ruleId);

      if (!deleted) {
        throw new NotFoundException('Conflict rule not found');
      }

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete conflict rule: ${error.message}`,
      );
    }
  }

  @Get('violations/:streamerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STREAMER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get streamer violations',
    description: 'Get conflict violations for a specific streamer',
  })
  @ApiParam({ name: 'streamerId', description: 'Streamer ID' })
  @ApiResponse({
    status: 200,
    description: 'List of conflict violations',
  })
  async getStreamerViolations(
    @Param('streamerId') streamerId: string,
  ): Promise<IConflictViolation[]> {
    return this.conflictRulesService.getStreamerViolations(streamerId);
  }

  @Post('violations/:id/override')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Override violation',
    description: 'Override a conflict violation (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Violation ID' })
  @ApiResponse({
    status: 200,
    description: 'Violation overridden successfully',
  })
  async overrideViolation(
    @Param('id') violationId: string,
    @Body() overrideDto: OverrideViolationDto,
    @Req() req: RequestWithUser,
  ): Promise<IConflictViolation> {
    try {
      const adminId = req.user?.userId || req.user?._id;
      if (!adminId) {
        throw new BadRequestException('Admin ID not found');
      }

      const overridden = await this.conflictRulesService.overrideViolation(
        violationId,
        overrideDto.reason,
        adminId,
      );

      if (!overridden) {
        throw new NotFoundException('Violation not found');
      }

      return overridden;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to override violation: ${error.message}`,
      );
    }
  }

  @Get('violations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all violations',
    description: 'Get all conflict violations (Admin only)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'List of conflict violations',
  })
  async getAllViolations(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ): Promise<IConflictViolation[]> {
    return this.conflictRulesService.getAllViolations(status, limit);
  }
}

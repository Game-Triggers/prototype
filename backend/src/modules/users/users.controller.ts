import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto/users.dto';
import {
  OverlaySettingsDto,
  OverlaySettingsResponseDto,
} from './dto/overlay-settings.dto';
import {
  CampaignSelectionSettingsDto,
  CampaignSelectionSettingsResponseDto,
} from './dto/campaign-selection-settings.dto';
import {
  EnergyPacksResponseDto,
  ConsumeEnergyPackDto,
} from './dto/energy-packs.dto';
import {
  XPResponseDto,
  AddXPDto,
} from './dto/xp.dto';
import { RPResponseDto, AddRPDto } from './dto/rp.dto';
import { LevelService } from './services/level.service';
import { Request } from 'express';

// Define the Request with user interface
interface RequestWithUser extends Request {
  user?: { userId: string; email: string; role: string };
}

/**
 * Users Controller
 *
 * Manages user-related operations including profile management, overlay settings,
 * and user administration. This controller handles the core user entity operations
 * for all user types (brands, streamers, admins) on the Instreamly platform.
 *
 * Key functionalities:
 * - User profile CRUD operations
 * - User search and filtering
 * - Streamer-specific overlay configuration
 * - User data for dashboards and platform features
 * - User role management (Admin only)
 *
 * Used by: All platform users (streamers, brands, admins) for profile management
 * and specialized user-related operations.
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly levelService: LevelService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of users',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findAll(@Query() filterDto: UserFilterDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }

    return this.usersService.findOne(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '60d21b4667d0d8992e610c85',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the user information',
    schema: {
      example: {
        id: '60d21b4667d0d8992e610c85',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'streamer',
        image: 'https://example.com/avatar.jpg',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('profile/streamer/:id')
  @ApiOperation({ summary: 'Get streamer profile information' })
  @ApiParam({
    name: 'id',
    description: 'Streamer ID',
    example: '60d21b4667d0d8992e610c85',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the streamer profile',
    schema: {
      example: {
        id: '60d21b4667d0d8992e610c85',
        name: 'Popular Streamer',
        image: 'https://example.com/avatar.jpg',
        channelUrl: 'https://twitch.tv/popularstreamer',
        category: ['Gaming'],
        language: ['English'],
        statistics: {
          followers: 10000,
          averageViewers: 500,
          impressions: 25000,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Streamer not found' })
  async getStreamerProfile(@Param('id') id: string) {
    return this.usersService.getStreamerProfile(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '60d21b4667d0d8992e610c85',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully updated',
    schema: {
      example: {
        id: '60d21b4667d0d8992e610c85',
        email: 'updated@example.com',
        name: 'Updated Name',
        role: 'streamer',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot update other users unless admin',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Overlay settings endpoints
  @Get('me/overlay')
  @UseGuards(JwtAuthGuard)
  async getOverlaySettings(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.getOverlaySettings(userId);
  }

  @Put('me/overlay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update overlay settings for the current user' })
  @ApiBody({ type: OverlaySettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Overlay settings successfully updated',
    type: OverlaySettingsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateOverlaySettings(
    @Req() req: RequestWithUser,
    @Body() overlaySettingsDto: OverlaySettingsDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.updateOverlaySettings(userId, overlaySettingsDto);
  }

  @Post('me/overlay/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerateOverlayToken(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.regenerateOverlayToken(userId);
  }

  @Get('me/overlay/status')
  @UseGuards(JwtAuthGuard)
  async getOverlayStatus(
    @Req() req: RequestWithUser,
    @Query('overlayToken') overlayToken: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.getOverlayConnectionStatus(userId, overlayToken);
  }

  @Post('me/overlay/test')
  @UseGuards(JwtAuthGuard)
  async testOverlay(
    @Req() req: RequestWithUser,
    @Body() testData: { overlayToken: string; testCampaign: any },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.triggerTestAd(
      userId,
      testData.overlayToken,
      testData.testCampaign,
    );
  }

  // Campaign selection settings endpoints
  @Get('me/campaign-selection')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get campaign selection settings for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign selection settings retrieved successfully',
    type: CampaignSelectionSettingsResponseDto,
  })
  async getCampaignSelectionSettings(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.getCampaignSelectionSettings(userId);
  }

  @Put('me/campaign-selection')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update campaign selection settings for the current user',
  })
  @ApiBody({ type: CampaignSelectionSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Campaign selection settings successfully updated',
    type: CampaignSelectionSettingsResponseDto,
  })
  async updateCampaignSelectionSettings(
    @Req() req: RequestWithUser,
    @Body() settingsDto: CampaignSelectionSettingsDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.updateCampaignSelectionSettings(
      userId,
      settingsDto,
    );
  }

  // Streak endpoints
  @Post('me/streak/ping')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ping today activity to update streak once per day' })
  async pingStreak(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID is missing from authentication token');
    }
    return this.usersService.pingDailyStreak(userId);
  }

  @Get('me/streak')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user streak summary' })
  async getMyStreak(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID is missing from authentication token');
    }
    return this.usersService.getStreakSummary(userId);
  }
 
  // Energy Pack endpoints
  @Get('me/energy-packs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user energy packs' })
  @ApiResponse({
    status: 200,
    description: 'Energy packs retrieved successfully',
    type: EnergyPacksResponseDto,
  })
  async getEnergyPacks(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID is missing from authentication token');
    }
    return this.usersService.getEnergyPacks(userId);
  }

  @Post('me/energy-packs/consume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consume one energy pack' })
  @ApiBody({ type: ConsumeEnergyPackDto })
  @ApiResponse({
    status: 200,
    description: 'Energy pack consumed successfully',
    schema: {
      example: {
        success: true,
        remaining: 9,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No energy packs available' })
  async consumeEnergyPack(
    @Req() req: RequestWithUser,
    @Body() dto: ConsumeEnergyPackDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.consumeEnergyPack(userId, dto.campaignId);
  }

  // XP (Experience Points) endpoints
  @Get('me/xp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user XP data' })
  @ApiResponse({
    status: 200,
    description: 'XP data retrieved successfully',
    type: XPResponseDto,
  })
  async getXP(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.getXP(userId);
  }

  @Post('me/xp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add XP for an activity' })
  @ApiBody({ type: AddXPDto })
  @ApiResponse({
    status: 200,
    description: 'XP added successfully',
    type: XPResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid activity type or amount' })
  async addXP(
    @Req() req: RequestWithUser,
    @Body() dto: AddXPDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.addXP(userId, dto.activityType, dto.amount);
  }

  // RP (Reputation Points) endpoints
  @Get('me/rp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user RP data' })
  @ApiResponse({
    status: 200,
    description: 'RP data retrieved successfully',
    type: RPResponseDto,
  })
  async getMyRP(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.getRP(userId);
  }

  @Post('me/rp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add RP for an activity' })
  @ApiBody({ type: AddRPDto })
  @ApiResponse({
    status: 200,
    description: 'RP added successfully',
    type: RPResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid activity type or amount' })
  async addRP(
    @Req() req: RequestWithUser,
    @Body() dto: AddRPDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return this.usersService.addRP(userId, dto.activityType, dto.amount);
  }

  // Level System endpoints
  @Get('me/level')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user level data' })
  @ApiResponse({
    status: 200,
    description: 'Level data retrieved successfully',
  })
  async getMyLevel(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return await this.levelService.getUserLevelData(userId);
  }

  @Post('me/level/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check for level up and update if necessary' })
  @ApiResponse({
    status: 200,
    description: 'Level check completed',
  })
  async checkMyLevelUp(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }
    return await this.levelService.checkForLevelUp(userId);
  }
}

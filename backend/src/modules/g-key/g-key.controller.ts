import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GKeyService } from './g-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { KEY_CATEGORIES } from '../../constants/key-constants';

@ApiTags('G-Keys')
@Controller('g-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GKeyController {
  constructor(private readonly gKeyService: GKeyService) {}

  /**
   * DEBUG: Get all available categories
   */
  @Get('debug/categories')
  @ApiOperation({
    summary: 'Debug: Get all categories',
    description: 'Get all available G-key categories for debugging',
  })
  async getDebugCategories() {
    return {
      totalCategories: KEY_CATEGORIES.length,
      categories: KEY_CATEGORIES.map(cat => ({
        category: cat.category,
        displayName: cat.displayName,
        defaultCooloffHours: cat.defaultCooloffHours
      }))
    };
  }

  /**
   * Get all keys for the authenticated user
   */
  @Get()
  @ApiOperation({
    summary: 'Get user keys',
    description: 'Get all keys for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Keys retrieved successfully',
  })
  async getUserKeys(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    console.log(`=== GKeyController.getUserKeys called for user ${userId} with role ${userRole} ===`);
    
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    // Only streamers have G-Keys
    if (userRole !== 'streamer') {
      console.log(`User role ${userRole} is not streamer, returning empty array`);
      return [];
    }

    console.log(`Calling gKeyService.getUserKeys for user ${userId}`);
    return this.gKeyService.getUserKeys(userId);
  }

  /**
   * Get keys summary for dashboard
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get keys summary',
    description: 'Get keys summary with counts by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Keys summary retrieved successfully',
  })
  async getKeysSummary(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    // Only streamers have G-Keys
    if (userRole !== 'streamer') {
      return {
        total: 0,
        available: 0,
        locked: 0,
        cooloff: 0,
        keys: [],
      };
    }

    return this.gKeyService.getKeysSummary(userId);
  }

  /**
   * Initialize keys for a user (if not already initialized)
   */
  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize user keys',
    description: 'Initialize keys for a user if not already done',
  })
  @ApiResponse({
    status: 200,
    description: 'Keys initialized successfully',
  })
  async initializeKeys(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    // Only streamers can initialize G-Keys
    if (userRole !== 'streamer') {
      throw new BadRequestException('Only streamers can initialize G-Keys');
    }

    return this.gKeyService.initializeKeysForUser(userId);
  }

  /**
   * Get status of a specific key category
   */
  @Get('category/:category')
  @ApiOperation({
    summary: 'Get key status for category',
    description: 'Get the status of a key for a specific category',
  })
  @ApiResponse({
    status: 200,
    description: 'Key status retrieved successfully',
  })
  async getKeyStatus(
    @Param('category') category: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.gKeyService.getKeyStatus(userId, category);
  }

  /**
   * Check if user has available key for category
   */
  @Get('available/:category')
  @ApiOperation({
    summary: 'Check key availability',
    description: 'Check if user has an available key for a category',
  })
  @ApiResponse({
    status: 200,
    description: 'Key availability checked successfully',
  })
  async hasAvailableKey(
    @Param('category') category: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    const hasKey = await this.gKeyService.hasAvailableKey(userId, category);
    return { available: hasKey };
  }

  /**
   * Update expired cooloffs (maintenance endpoint)
   */
  @Post('update-cooloffs')
  @ApiOperation({
    summary: 'Update expired cooloffs',
    description: 'Update keys that have completed their cooloff period',
  })
  @ApiResponse({
    status: 200,
    description: 'Cooloffs updated successfully',
  })
  async updateExpiredCooloffs() {
    const updatedCount = await this.gKeyService.updateExpiredCooloffs();
    return {
      message: `Updated ${updatedCount} keys from cooloff to available`,
    };
  }

  /**
   * Force unlock a G-key (debug/admin endpoint)
   */
  @Post('force-unlock/:category')
  @ApiOperation({
    summary: 'Force unlock G-key',
    description: 'Force unlock a G-key for debugging purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'G-key force unlocked successfully',
  })
  async forceUnlockKey(
    @Param('category') category: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    const unlockedKey = await this.gKeyService.forceUnlockKey(userId, category);
    return {
      message: `G-key for category "${category}" has been force unlocked`,
      key: unlockedKey,
    };
  }

  /**
   * Debug G-key status with campaign analysis
   */
  @Get('debug/:category')
  @ApiOperation({
    summary: 'Debug G-key status',
    description: 'Get detailed debug information about a G-key status',
  })
  async debugGKeyStatus(
    @Param('category') category: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.gKeyService.debugKeyStatus(userId, category);
  }
}

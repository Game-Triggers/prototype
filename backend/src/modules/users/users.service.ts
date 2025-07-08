import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser, UserRole } from '@schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto/users.dto';
import { ensureDocument } from '../../types/mongoose-helpers';
import {
  OverlaySettingsDto,
  OverlaySettingsResponseDto,
} from './dto/overlay-settings.dto';
import {
  CampaignSelectionSettingsDto,
  CampaignSelectionSettingsResponseDto,
} from './dto/campaign-selection-settings.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<IUser>) {}

  async create(createUserDto: CreateUserDto): Promise<IUser> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  async findAll(filterDto: UserFilterDto): Promise<IUser[]> {
    const { role, search, category, language } = filterDto;
    const query: any = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category.length > 0) {
      query.category = { $in: category };
    }

    if (language && language.length > 0) {
      query.language = { $in: language };
    }

    return this.userModel.find(query).exec();
  }

  async findOne(id: string): Promise<IUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Convert to plain object to ensure all fields are included in API response
    // This fixes an issue where Mongoose document direct property access
    // wasn't working correctly for newly added schema fields
    return user.toObject() as IUser;
  }

  async findByEmail(
    email: string,
    includePassword: boolean = false,
  ): Promise<IUser | null> {
    const query = this.userModel.findOne({ email });

    // Explicitly select password field if needed for authentication
    if (includePassword) {
      query.select('+password');
    }

    return query.exec();
  }

  async findByAuthProviderId(providerId: string): Promise<IUser | null> {
    const user = await this.userModel
      .findOne({ authProviderId: providerId })
      .exec();
    return user;
  }

  async getStreamerProfile(id: string): Promise<IUser> {
    const streamer = await this.userModel.findById(id).exec();
    if (
      !streamer ||
      ensureDocument<IUser>(streamer).role !== UserRole.STREAMER
    ) {
      throw new NotFoundException(`Streamer with ID ${id} not found`);
    }
    return streamer;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<IUser> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  // Methods used by analytics service
  async countByRole(role: string): Promise<number> {
    return this.userModel.countDocuments({ role }).exec();
  }

  async countNewUsers(
    since: Date,
  ): Promise<{ newStreamers: number; newBrands: number }> {
    const [streamers, brands] = await Promise.all([
      this.userModel
        .countDocuments({
          role: 'streamer',
          createdAt: { $gte: since },
        })
        .exec(),
      this.userModel
        .countDocuments({
          role: 'brand',
          createdAt: { $gte: since },
        })
        .exec(),
    ]);

    return {
      newStreamers: streamers,
      newBrands: brands,
    };
  }

  // Get current user's overlay settings
  async getOverlaySettings(
    userId: string,
  ): Promise<OverlaySettingsResponseDto> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException(
        'Only streamers can access overlay settings',
      );
    }

    // Initialize overlay token if it doesn't exist
    if (!user.overlayToken) {
      user.overlayToken = this.generateOverlayToken();
      await user.save();
    }

    // Ensure we return non-null values
    return {
      position: user.overlaySettings?.position || 'bottom-right',
      size: user.overlaySettings?.size || 'medium',
      opacity: user.overlaySettings?.opacity || 80,
      backgroundColor: user.overlaySettings?.backgroundColor || 'transparent',
      overlayToken: user.overlayToken,
    };
  }

  // Update user's overlay settings
  async updateOverlaySettings(
    userId: string,
    settingsDto: OverlaySettingsDto,
  ): Promise<OverlaySettingsResponseDto> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException(
        'Only streamers can update overlay settings',
      );
    }

    // Initialize overlay token if it doesn't exist
    if (!user.overlayToken) {
      user.overlayToken = this.generateOverlayToken();
    }

    // Update settings with new values or keep existing ones
    user.overlaySettings = {
      position:
        settingsDto.position ||
        user.overlaySettings?.position ||
        'bottom-right',
      size: settingsDto.size || user.overlaySettings?.size || 'medium',
      opacity: settingsDto.opacity ?? user.overlaySettings?.opacity ?? 80,
      backgroundColor:
        settingsDto.backgroundColor ||
        user.overlaySettings?.backgroundColor ||
        'transparent',
    };

    await user.save();

    // Return properly typed response
    return {
      position: user.overlaySettings.position || 'bottom-right',
      size: user.overlaySettings.size || 'medium',
      opacity: user.overlaySettings.opacity || 80,
      backgroundColor: user.overlaySettings.backgroundColor || 'transparent',
      overlayToken: user.overlayToken,
    };
  }

  // Regenerate overlay token
  async regenerateOverlayToken(
    userId: string,
  ): Promise<{ overlayToken: string }> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException(
        'Only streamers can regenerate overlay tokens',
      );
    }

    // Generate new token
    const newToken = this.generateOverlayToken();
    user.overlayToken = newToken;
    await user.save();

    // Note: We do NOT update campaign participation browserSourceTokens because:
    // 1. Each participation has its own unique token (required by unique index)
    // 2. The overlay service uses the user's overlayToken to find campaigns
    // 3. Individual participation tokens are used for specific tracking purposes
    // 4. The main overlay URL uses the user's overlayToken, not participation tokens

    console.log(
      `Regenerated overlay token for user ${userId}. ` +
        `Main overlay URL will now use: /api/overlay/${newToken}`,
    );

    return { overlayToken: user.overlayToken };
  }

  // Helper method to generate a unique token
  private generateOverlayToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Check overlay connection status
  async getOverlayConnectionStatus(userId: string, overlayToken: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException(
        'Only streamers can check overlay status',
      );
    }

    // Verify that the token belongs to this user
    if (user.overlayToken !== overlayToken) {
      throw new UnauthorizedException('Invalid overlay token');
    }

    // Check if the overlay is active (has been seen in the last 2 minutes)
    const isActive =
      user.overlayActive &&
      user.overlayLastSeen &&
      new Date().getTime() - user.overlayLastSeen.getTime() < 2 * 60 * 1000;

    // Return the status
    return {
      active: isActive,
      lastSeen: user.overlayLastSeen
        ? user.overlayLastSeen.toISOString()
        : null,
    };
  }

  // Record overlay activity (called when overlay loads or pings)
  async recordOverlayActivity(token: string): Promise<boolean> {
    const user = await this.userModel.findOne({ overlayToken: token }).exec();

    if (!user) {
      return false;
    }

    // Update the last seen timestamp and set active flag
    user.overlayLastSeen = new Date();
    user.overlayActive = true;
    await user.save();

    return true;
  }

  // Trigger test ad for overlay
  async triggerTestAd(
    userId: string,
    overlayToken: string,
    testCampaign: any,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException('Only streamers can test overlays');
    }

    // Verify that the token belongs to this user
    if (user.overlayToken !== overlayToken) {
      throw new UnauthorizedException('Invalid overlay token');
    }

    // Check if overlay is active
    const isActive =
      user.overlayActive &&
      user.overlayLastSeen &&
      new Date().getTime() - user.overlayLastSeen.getTime() < 2 * 60 * 1000;

    if (!isActive) {
      return {
        success: false,
        message:
          'Overlay is not active. Make sure it is added to your streaming software.',
      };
    }

    // Store test campaign data temporarily (for 10 seconds)
    user.testCampaign = {
      title: testCampaign.title || 'Test Campaign',
      mediaUrl:
        testCampaign.mediaUrl ||
        'https://via.placeholder.com/300x200/3498DB/FFFFFF?text=Test+Ad',
      mediaType: testCampaign.mediaType || 'image',
      testMode: true,
      expiresAt: new Date(new Date().getTime() + 10000), // 10 seconds from now
    };

    await user.save();

    // Return success response
    return {
      success: true,
      message: 'Test ad sent to overlay',
    };
  }

  // Get campaign selection settings
  async getCampaignSelectionSettings(
    userId: string,
  ): Promise<CampaignSelectionSettingsResponseDto> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException(
        'Only streamers can access campaign selection settings',
      );
    }

    // Return response
    return {
      campaignSelectionStrategy:
        user.campaignSelectionStrategy || 'fair-rotation',
      campaignRotationSettings: user.campaignRotationSettings || {
        preferredStrategy: 'fair-rotation',
        rotationIntervalMinutes: 3,
        priorityWeights: {
          paymentRate: 0.4,
          performance: 0.3,
          fairness: 0.3,
        },
        blackoutPeriods: [],
      },
      updatedAt: user.updatedAt || new Date(),
    };
  }

  // Update campaign selection settings
  async updateCampaignSelectionSettings(
    userId: string,
    settingsDto: CampaignSelectionSettingsDto,
  ): Promise<CampaignSelectionSettingsResponseDto> {
    console.log('updateCampaignSelectionSettings called with:', {
      userId,
      settingsDto,
    });

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException(
        'Only streamers can update campaign selection settings',
      );
    }

    console.log('Current user before update:', {
      id: user._id,
      email: user.email,
      campaignSelectionStrategy: user.campaignSelectionStrategy,
      campaignRotationSettings: user.campaignRotationSettings,
    });

    // Use atomic update to avoid duplicate key errors
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            campaignSelectionStrategy: settingsDto.campaignSelectionStrategy,
            campaignRotationSettings: {
              preferredStrategy:
                settingsDto.campaignRotationSettings.preferredStrategy,
              rotationIntervalMinutes:
                settingsDto.campaignRotationSettings.rotationIntervalMinutes,
              priorityWeights: {
                paymentRate:
                  settingsDto.campaignRotationSettings.priorityWeights
                    .paymentRate,
                performance:
                  settingsDto.campaignRotationSettings.priorityWeights
                    .performance,
                fairness:
                  settingsDto.campaignRotationSettings.priorityWeights.fairness,
              },
              blackoutPeriods:
                settingsDto.campaignRotationSettings.blackoutPeriods || [],
            },
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(
        `User with ID ${userId} not found after update`,
      );
    }

    console.log('Updated user after update:', {
      id: updatedUser._id,
      email: updatedUser.email,
      campaignSelectionStrategy: updatedUser.campaignSelectionStrategy,
      campaignRotationSettings: updatedUser.campaignRotationSettings,
    });

    // Return response
    return {
      campaignSelectionStrategy:
        updatedUser.campaignSelectionStrategy || 'fair-rotation',
      campaignRotationSettings: updatedUser.campaignRotationSettings || {
        preferredStrategy: 'fair-rotation',
        rotationIntervalMinutes: 3,
        priorityWeights: {
          paymentRate: 0.4,
          performance: 0.3,
          fairness: 0.3,
        },
        blackoutPeriods: [],
      },
      updatedAt: updatedUser.updatedAt || new Date(),
    };
  }
}

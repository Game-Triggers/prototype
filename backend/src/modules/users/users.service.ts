import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
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
import {
  EnergyPacksDto,
  EnergyPacksResponseDto,
  ConsumeEnergyPackDto,
} from './dto/energy-packs.dto';
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
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (ensureDocument<IUser>(user).role !== UserRole.STREAMER) {
      throw new UnauthorizedException(
        'Only streamers can update campaign selection settings',
      );
    }

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

  /** Normalize a date to UTC midnight */
  private toUtcDay(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /** Returns date for N days before given date (UTC) */
  private addDaysUTC(d: Date, delta: number): Date {
    const dt = new Date(d);
    dt.setUTCDate(dt.getUTCDate() + delta);
    return this.toUtcDay(dt);
  }

  /** Update user's daily streak once per day. If already counted for today, it's a no-op. */
  async pingDailyStreak(userId: string): Promise<{
    current: number;
    longest: number;
    lastDate: string | null;
    updated: boolean;
    history: string[]; // ISO dates (UTC midnight)
    last7Days: { date: string; active: boolean }[];
  }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const today = this.toUtcDay(new Date());
    const last = user.streakLastDate
      ? this.toUtcDay(new Date(user.streakLastDate))
      : null;

    let current = user.streakCurrent || 0;
    let longest = user.streakLongest || 0;
    let updated = false;

    // If already updated today, return summary
    if (last && last.getTime() === today.getTime()) {
      const historySet = new Set(
        (user.streakHistory || []).map((d) =>
          this.toUtcDay(new Date(d)).toISOString(),
        ),
      );
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = this.addDaysUTC(today, i - 6);
        const iso = date.toISOString();
        return { date: iso, active: historySet.has(iso) };
      });
      return {
        current,
        longest,
        lastDate: last.toISOString(),
        updated: false,
        history: Array.from(historySet),
        last7Days,
      };
    }

    // Determine if yesterday was last date to continue streak
    const yesterday = this.addDaysUTC(today, -1);
    if (last && last.getTime() === yesterday.getTime()) {
      current = current + 1;
    } else {
      current = 1; // reset
    }

    if (current > longest) longest = current;

    // Maintain history with unique UTC days, keep last 60 days
    const historyDates = (user.streakHistory || []).map((d) =>
      this.toUtcDay(new Date(d)).toISOString(),
    );
    const todayIso = today.toISOString();
    const set = new Set(historyDates);
    set.add(todayIso);
    const history = Array.from(set)
      .map((iso) => new Date(iso))
      .sort((a, b) => a.getTime() - b.getTime())
      .slice(-60)
      .map((d) => d.toISOString());

    // Persist changes
    user.streakCurrent = current;
    user.streakLongest = longest;
    user.streakLastDate = today;
    user.streakHistory = history.map((iso) => new Date(iso));
    await user.save();
    updated = true;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = this.addDaysUTC(today, i - 6);
      const iso = date.toISOString();
      return { date: iso, active: set.has(iso) };
    });

    return {
      current,
      longest,
      lastDate: todayIso,
      updated,
      history,
      last7Days,
    };
  }

  /** Get streak summary without updating state */
  async getStreakSummary(userId: string): Promise<{
    current: number;
    longest: number;
    lastDate: string | null;
    last7Days: { date: string; active: boolean }[]; // Today at index 6
  }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const today = this.toUtcDay(new Date());
    const historySet = new Set(
      (user.streakHistory || [])
        .map((d) => this.toUtcDay(new Date(d)).toISOString())
    );

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = this.addDaysUTC(today, i - 6); // oldest first, today last
      const iso = date.toISOString();
      return { date: iso, active: historySet.has(iso) };
    });

    return {
      current: user.streakCurrent || 0,
      longest: user.streakLongest || 0,
      lastDate: user.streakLastDate ? this.toUtcDay(new Date(user.streakLastDate)).toISOString() : null,
      last7Days,
    };
  }


  // Helper function to calculate time until next reset (at midnight 12:00 AM)
  private getTimeUntilReset(lastReset: Date) {
    const now = new Date();
    const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if we need to reset (if it's a new day since last reset)
    const shouldReset = currentDay.getTime() > lastResetDay.getTime();
    
    // Calculate time until next midnight
    const nextMidnight = new Date(now);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    
    const diffMs = nextMidnight.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(diffMs / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hoursUntilReset: Math.max(0, hoursUntilReset),
      minutesUntilReset: Math.max(0, minutesUntilReset),
      shouldReset
    };
  }

  async getEnergyPacks(userId: string): Promise<EnergyPacksResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Initialize energy packs if not exists
    if (!user.energyPacks) {
      user.energyPacks = {
        current: 10,
        maximum: 10,
        lastReset: new Date(),
        dailyUsed: 0
      };
      await user.save();
    }

    const { hoursUntilReset, minutesUntilReset, shouldReset } = this.getTimeUntilReset(user.energyPacks.lastReset);

    // Reset energy packs if 24 hours have passed
    if (shouldReset) {
      user.energyPacks.current = user.energyPacks.maximum;
      user.energyPacks.dailyUsed = 0;
      user.energyPacks.lastReset = new Date();
      await user.save();
    }

    return {
      current: user.energyPacks.current,
      maximum: user.energyPacks.maximum,
      lastReset: user.energyPacks.lastReset.toISOString(),
      dailyUsed: user.energyPacks.dailyUsed,
      hoursUntilReset,
      minutesUntilReset
    };
  }

  async consumeEnergyPack(userId: string, campaignId: string): Promise<{ success: boolean; remaining: number }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Initialize energy packs if not exists
    if (!user.energyPacks) {
      user.energyPacks = {
        current: 10,
        maximum: 10,
        lastReset: new Date(),
        dailyUsed: 0
      };
    }

    const { shouldReset } = this.getTimeUntilReset(user.energyPacks.lastReset);

    // Reset energy packs if 24 hours have passed
    if (shouldReset) {
      user.energyPacks.current = user.energyPacks.maximum;
      user.energyPacks.dailyUsed = 0;
      user.energyPacks.lastReset = new Date();
    }

    // Check if user has energy packs available
    if (user.energyPacks.current <= 0) {
      throw new BadRequestException('No energy packs available. Energy packs reset every 24 hours.');
    }

    // Consume one energy pack
    user.energyPacks.current -= 1;
    user.energyPacks.dailyUsed += 1;

    await user.save();

    return {
      success: true,
      remaining: user.energyPacks.current
    };
  }
}

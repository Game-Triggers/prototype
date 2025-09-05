import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IGKey } from '@schemas/g-key.schema';
import { ICampaign } from '@schemas/campaign.schema';
import { KEY_CATEGORIES } from '../../constants/key-constants';

@Injectable()
export class GKeyService {
  private readonly logger = new Logger(GKeyService.name);

  constructor(
    @InjectModel('GKey') private readonly gKeyModel: Model<IGKey>,
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
  ) {}

  /**
   * Initialize keys for a new user
   */
  async initializeKeysForUser(userId: string) {
    const existingKeys = await this.gKeyModel.find({ userId }).exec();

    if (existingKeys.length > 0) {
      return existingKeys;
    }

    // Create a key for each category
    const keysToCreate = KEY_CATEGORIES.map((categoryInfo) => ({
      userId,
      category: categoryInfo.category,
      status: 'available' as const,
      usageCount: 0,
    }));

    return this.gKeyModel.insertMany(keysToCreate);
  }

  /**
   * Get all keys for a user
   */
  async getUserKeys(userId: string) {
    this.logger.log(`=== getUserKeys called for user ${userId} ===`);
    
    // First, check and update any expired cooloffs before fetching
    await this.updateExpiredCooloffs();
    
    let keys = await this.gKeyModel.find({ userId }).exec();
    this.logger.log(`Found ${keys.length} existing keys`);

    // Initialize keys if they don't exist at all
    if (keys.length === 0) {
      this.logger.log('No existing keys found, initializing all keys');
      keys = await this.initializeKeysForUser(userId);
      return keys;
    }

    // Check if user has keys for all categories and add missing ones
    const existingCategories = keys.map((key) => key.category);
    const missingCategories = KEY_CATEGORIES.filter(
      (categoryInfo) => !existingCategories.includes(categoryInfo.category),
    );

    this.logger.log(
      `Expected ${KEY_CATEGORIES.length} categories, found ${existingCategories.length} existing`,
    );
    if (missingCategories.length > 0) {
      this.logger.log(
        `Adding ${missingCategories.length} missing categories for user ${userId}: ${missingCategories.map((c) => c.category).join(', ')}`,
      );

      const missingKeys = missingCategories.map((categoryInfo) => ({
        userId,
        category: categoryInfo.category,
        status: 'available' as const,
        usageCount: 0,
      }));

      const newKeys = await this.gKeyModel.insertMany(missingKeys);
      keys = [...keys, ...newKeys];
      this.logger.log(
        `Successfully added ${newKeys.length} new keys. Total keys now: ${keys.length}`,
      );
    } else {
      this.logger.log('All categories already exist for this user');
    }

    return keys;
  }

  /**
   * Check if user has an available key for a specific category
   * Now includes same brand exception logic
   */
  async hasAvailableKey(
    userId: string,
    category: string,
    brandId?: string,
  ): Promise<boolean> {
    const key = await this.gKeyModel
      .findOne({
        userId,
        category,
      })
      .exec();

    if (!key) {
      return false;
    }

    // Available status - always can join
    if (key.status === 'available') {
      return true;
    }

    // Same brand exception - if in cooloff but same brand, allow joining
    if (key.status === 'cooloff' && brandId && key.lastBrandId === brandId) {
      return true;
    }

    return false;
  }

  /**
   * Consume a key when joining a campaign
   * Now handles same brand exception logic
   */
  async consumeKey(userId: string, campaignId: string): Promise<IGKey> {
    // Get campaign details to find categories
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.categories || campaign.categories.length === 0) {
      throw new BadRequestException('Campaign has no categories defined');
    }

    // Try to find a key for any of the campaign's categories
    let targetKey: IGKey | null = null;
    for (const category of campaign.categories) {
      // Convert campaign category to lowercase to match G-Key category format
      const normalizedCategory = category.toLowerCase();
      const key = await this.gKeyModel
        .findOne({
          userId,
          category: normalizedCategory,
        })
        .exec();

      if (key) {
        // Check if key is available or same brand exception applies
        if (key.status === 'available') {
          targetKey = key;
          break;
        } else if (
          key.status === 'cooloff' &&
          key.lastBrandId === campaign.brandId?.toString()
        ) {
          // Same brand exception - can join immediately
          targetKey = key;
          break;
        }
      }
    }

    if (!targetKey) {
      // Convert categories to lowercase for display in error message
      const normalizedCategories = campaign.categories.map((cat) =>
        cat.toLowerCase(),
      );
      throw new ConflictException(
        `No available keys for campaign categories: ${normalizedCategories.join(', ')}. Key may be locked with another campaign or in cooloff for a different brand.`,
      );
    }

    // Lock the key
    targetKey.status = 'locked';
    targetKey.lockedWith = campaignId;
    targetKey.lockedAt = new Date();

    return targetKey.save();
  }

  /**
   * Release a key when leaving a campaign (puts it in cooloff)
   * Now implements highest cooloff period logic for same brand
   */
  async releaseKey(
    userId: string,
    campaignId: string,
    cooloffHours?: number,
  ): Promise<IGKey> {
    const lockedKey = await this.gKeyModel
      .findOne({
        userId,
        lockedWith: campaignId,
        status: 'locked',
      })
      .exec();

    if (!lockedKey) {
      throw new NotFoundException('No locked key found for this campaign');
    }

    // Get campaign details to find brand
    const campaign = await this.campaignModel.findById(campaignId).exec();
    const brandId = campaign?.brandId?.toString();

    // Set cooloff end date using campaign-specific or default cooloff period
    const cooloffHoursToUse = cooloffHours || 720; // Default 30 days (720 hours)

    // Implement highest cooloff period logic for same brand
    let finalCooloffHours = cooloffHoursToUse;
    if (brandId && lockedKey.lastBrandId === brandId) {
      // Same brand - use the highest cooloff period
      const currentBrandCooloff = lockedKey.lastBrandCooloffHours ?? 0;
      finalCooloffHours = Math.max(cooloffHoursToUse, currentBrandCooloff);
      lockedKey.lastBrandCooloffHours = finalCooloffHours;
    } else {
      // Different brand or first time - set new brand and cooloff
      lockedKey.lastBrandId = brandId;
      lockedKey.lastBrandCooloffHours = cooloffHoursToUse;
    }

    // Put key in cooloff period
    lockedKey.status = 'cooloff';
    lockedKey.lockedWith = undefined;
    lockedKey.lockedAt = undefined;
    lockedKey.lastUsed = new Date();
    lockedKey.usageCount += 1;

    lockedKey.cooloffEndsAt = new Date(
      Date.now() + finalCooloffHours * 60 * 60 * 1000,
    );

    this.logger.log(
      `G-Key ${lockedKey.category} for user ${userId} set to cooloff for ${finalCooloffHours} hours (brand: ${brandId})`,
    );

    return lockedKey.save();
  }

  /**
   * Check and update keys that have completed cooloff
   */
  async updateExpiredCooloffs(): Promise<number> {
    const now = new Date();

    const result = await this.gKeyModel
      .updateMany(
        {
          status: 'cooloff',
          cooloffEndsAt: { $lte: now },
        },
        {
          $set: { status: 'available' },
          $unset: { cooloffEndsAt: 1 },
        },
      )
      .exec();

    return result.modifiedCount;
  }

  /**
   * Scheduled task to automatically expire cooloffs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredCooloffs() {
    try {
      const expiredCount = await this.updateExpiredCooloffs();
      if (expiredCount > 0) {
        this.logger.log(`Expired ${expiredCount} G-Key cooloffs`);
      }
    } catch (error) {
      this.logger.error('Failed to expire G-Key cooloffs:', error);
    }
  }

  /**
   * Get key status for a specific category with brand information
   */
  async getKeyStatus(userId: string, category: string): Promise<IGKey | null> {
    return this.gKeyModel.findOne({ userId, category }).exec();
  }

  /**
   * Get detailed key status with cooloff time remaining and brand info
   */
  async getKeyStatusWithDetails(
    userId: string,
    category: string,
  ): Promise<{
    status: string;
    lastBrandId?: string;
    cooloffEndsAt?: Date;
    cooloffTimeRemaining?: number;
  } | null> {
    const key = await this.gKeyModel.findOne({ userId, category }).exec();
    if (!key) {
      return null;
    }

    const result: any = {
      status: key.status,
      lastBrandId: key.lastBrandId,
      cooloffEndsAt: key.cooloffEndsAt,
    };

    if (key.status === 'cooloff' && key.cooloffEndsAt) {
      const now = new Date();
      const remaining = key.cooloffEndsAt.getTime() - now.getTime();
      result.cooloffTimeRemaining = Math.max(0, remaining);
    }

    return result;
  }

  /**
   * Force unlock a key (admin function)
   */
  async forceUnlockKey(userId: string, category: string): Promise<IGKey> {
    const key = await this.gKeyModel.findOne({ userId, category }).exec();

    if (!key) {
      throw new NotFoundException('Key not found');
    }

    key.status = 'available';
    key.lockedWith = undefined;
    key.lockedAt = undefined;
    key.cooloffEndsAt = undefined;

    return key.save();
  }

  /**
   * Debug key status with detailed analysis
   */
  async debugKeyStatus(
    userId: string,
    category: string,
  ): Promise<{
    userId: string;
    category: string;
    status: string;
    lockedWith?: string;
    lockedAt?: Date;
    cooloffEndsAt?: Date;
    lastBrandId?: string;
    lastUsed?: Date;
    usageCount: number;
    cooloffAnalysis?: {
      hasExpired: boolean;
      timeUntilExpiry: number;
      minutesUntilExpiry: number;
    };
    campaignAnalysis?: {
      campaignExists: boolean;
      campaignTitle?: string;
      campaignStatus?: string;
      campaignCategories?: string[];
    };
    activeCampaignsInCategory: Array<{
      id: string;
      title: string;
      status: string;
      categories: string[];
    }>;
  }> {
    const key = await this.gKeyModel.findOne({ userId, category }).exec();

    if (!key) {
      throw new NotFoundException('Key not found');
    }

    const result: any = {
      userId,
      category: key.category,
      status: key.status,
      lockedWith: key.lockedWith,
      lockedAt: key.lockedAt,
      cooloffEndsAt: key.cooloffEndsAt,
      lastBrandId: key.lastBrandId,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount || 0,
      activeCampaignsInCategory: [],
    };

    // Analyze cooloff status
    if (key.status === 'cooloff' && key.cooloffEndsAt) {
      const now = new Date();
      const cooloffEnd = new Date(key.cooloffEndsAt);
      result.cooloffAnalysis = {
        hasExpired: now > cooloffEnd,
        timeUntilExpiry: cooloffEnd.getTime() - now.getTime(),
        minutesUntilExpiry: Math.round(
          (cooloffEnd.getTime() - now.getTime()) / (1000 * 60),
        ),
      };
    }

    // Analyze locked status
    if (key.status === 'locked' && key.lockedWith) {
      const campaign = await this.campaignModel.findById(key.lockedWith).exec();
      result.campaignAnalysis = {
        campaignExists: !!campaign,
        campaignTitle: campaign?.title,
        campaignStatus: campaign?.status,
        campaignCategories: campaign?.categories,
      };
    }

    // Check for active gaming campaigns
    const activeCampaigns = await this.campaignModel
      .find({
        status: { $in: ['active', 'approved'] },
        categories: { $regex: new RegExp(category, 'i') },
      })
      .exec();

    result.activeCampaignsInCategory = activeCampaigns.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      status: c.status,
      categories: c.categories || [],
    }));

    return result;
  }

  /**
   * Get keys summary for dashboard with cooloff time remaining
   */
  async getKeysSummary(userId: string): Promise<{
    total: number;
    available: number;
    locked: number;
    cooloff: number;
    keys: any[];
  }> {
    // Update expired cooloffs first to ensure accurate status
    await this.updateExpiredCooloffs();
    
    const keys = await this.getUserKeys(userId);

    // Add cooloff time remaining and formatted time display for keys in cooloff
    const keysWithDetails = keys.map((key) => {
      const keyObj = key.toObject();

      // Add usage/completion count
      keyObj['completionCount'] = key.usageCount || 0;

      if (key.status === 'cooloff' && key.cooloffEndsAt) {
        const now = new Date();
        const remaining = key.cooloffEndsAt.getTime() - now.getTime();
        keyObj['cooloffTimeRemaining'] = Math.max(0, remaining);
        keyObj['cooloffTimeFormatted'] = this.formatCooloffTime(
          Math.max(0, remaining),
        );

        // Calculate time elapsed since cooloff started
        if (key.lastUsed) {
          const elapsed = now.getTime() - key.lastUsed.getTime();
          keyObj['cooloffTimeElapsed'] = elapsed;
          keyObj['cooloffTimeElapsedFormatted'] =
            this.formatCooloffTime(elapsed);
        }
      }

      return keyObj;
    });

    return {
      total: keys.length,
      available: keys.filter((k) => k.status === 'available').length,
      locked: keys.filter((k) => k.status === 'locked').length,
      cooloff: keys.filter((k) => k.status === 'cooloff').length,
      keys: keysWithDetails,
    };
  }

  /**
   * Format cooloff time remaining into human-readable format
   */
  private formatCooloffTime(milliseconds: number): string {
    if (milliseconds <= 0) return '0 minutes';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      if (remainingHours > 0) {
        return `${days}d ${remainingHours}h`;
      }
      return `${days} day${days === 1 ? '' : 's'}`;
    }

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      if (remainingMinutes > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }

    if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }

    return '< 1 minute';
  }
}

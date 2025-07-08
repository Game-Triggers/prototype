import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IConflictRule,
  IConflictViolation,
  ConflictType,
  ConflictSeverity,
} from '@schemas/conflict-rules.schema';
import { ICampaign } from '@schemas/campaign.schema';
import { ICampaignParticipation } from '@schemas/campaign-participation.schema';

export interface ConflictCheckResult {
  allowed: boolean;
  violations: IConflictViolation[];
  warnings: string[];
  blockedBy?: string[];
}

@Injectable()
export class ConflictRulesService {
  private readonly logger = new Logger(ConflictRulesService.name);

  constructor(
    @InjectModel('ConflictRule')
    private conflictRuleModel: Model<IConflictRule>,
    @InjectModel('ConflictViolation')
    private conflictViolationModel: Model<IConflictViolation>,
    @InjectModel('Campaign') private campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private participationModel: Model<ICampaignParticipation>,
  ) {}

  /**
   * Check if a streamer can join a campaign without conflicts
   */
  async checkCampaignJoinConflicts(
    streamerId: string,
    campaignId: string,
  ): Promise<ConflictCheckResult> {
    const result: ConflictCheckResult = {
      allowed: true,
      violations: [],
      warnings: [],
      blockedBy: [],
    };

    try {
      // Get campaign details
      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get streamer's active participations
      const activeParticipations = await this.participationModel
        .find({ streamerId, status: 'active' })
        .populate('campaignId');

      // Get all active conflict rules
      const activeRules = await this.conflictRuleModel
        .find({ isActive: true })
        .sort({ priority: -1 });

      // Check each rule
      for (const rule of activeRules) {
        const violation = await this.checkRule(
          rule,
          streamerId,
          campaign,
          activeParticipations,
        );

        if (violation) {
          result.violations.push(violation);

          // Handle based on severity
          switch (violation.severity) {
            case ConflictSeverity.BLOCKING:
              result.allowed = false;
              result.blockedBy?.push(rule.name);
              break;
            case ConflictSeverity.WARNING:
              result.warnings.push(violation.message);
              break;
            case ConflictSeverity.ADVISORY:
              this.logger.log(
                `Advisory conflict detected: ${violation.message}`,
              );
              break;
          }

          // Save violation record
          await this.saveViolation(violation);

          // Update rule statistics
          await this.updateRuleStats(rule._id as string, violation.severity);
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Error checking campaign join conflicts:', error);
      throw error;
    }
  }

  /**
   * Check a specific conflict rule
   */
  private async checkRule(
    rule: IConflictRule,
    streamerId: string,
    campaign: ICampaign,
    activeParticipations: ICampaignParticipation[],
  ): Promise<IConflictViolation | null> {
    // Check if rule applies to this streamer/campaign
    if (!this.isRuleApplicable(rule, streamerId, campaign)) {
      return null;
    }

    switch (rule.type) {
      case ConflictType.CATEGORY_EXCLUSIVITY:
        return this.checkCategoryExclusivity(
          rule,
          streamerId,
          campaign,
          activeParticipations,
        );

      case ConflictType.BRAND_EXCLUSIVITY:
        return this.checkBrandExclusivity(
          rule,
          streamerId,
          campaign,
          activeParticipations,
        );

      case ConflictType.COOLDOWN_PERIOD:
        return this.checkCooldownPeriod(rule, streamerId, campaign);

      case ConflictType.SIMULTANEOUS_LIMIT:
        return this.checkSimultaneousLimit(
          rule,
          streamerId,
          campaign,
          activeParticipations,
        );

      default:
        return null;
    }
  }

  /**
   * Check if rule applies to this scenario
   */
  private isRuleApplicable(
    rule: IConflictRule,
    streamerId: string,
    campaign: ICampaign,
  ): boolean {
    const { scope } = rule;

    // Check streamer-specific rules
    if (scope.streamerIds && scope.streamerIds.length > 0) {
      if (!scope.streamerIds.includes(streamerId)) {
        return false;
      }
    }

    // Check brand-specific rules
    if (scope.brandIds && scope.brandIds.length > 0) {
      if (!scope.brandIds.includes(campaign.brandId.toString())) {
        return false;
      }
    }

    // Check campaign criteria
    if (scope.campaignCriteria) {
      const criteria = scope.campaignCriteria;

      if (criteria.minBudget && campaign.budget < criteria.minBudget) {
        return false;
      }

      if (criteria.maxBudget && campaign.budget > criteria.maxBudget) {
        return false;
      }

      if (
        criteria.paymentTypes &&
        !criteria.paymentTypes.includes(campaign.paymentType)
      ) {
        return false;
      }

      if (
        criteria.categories &&
        !criteria.categories.some((cat) => campaign.categories?.includes(cat))
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check category exclusivity conflicts
   */
  private async checkCategoryExclusivity(
    rule: IConflictRule,
    streamerId: string,
    campaign: ICampaign,
    activeParticipations: ICampaignParticipation[],
  ): Promise<IConflictViolation | null> {
    const { categories, excludedCategories } = rule.config;

    if (!categories || !campaign.categories) {
      return null;
    }

    // Check if campaign is in restricted categories
    const hasRestrictedCategory = campaign.categories.some((cat) =>
      categories.includes(cat),
    );

    if (!hasRestrictedCategory) {
      return null;
    }

    // Check for conflicting active campaigns
    const conflictingCampaigns: string[] = [];
    const conflictingCategories: string[] = [];

    for (const participation of activeParticipations) {
      const activeCampaign = participation.campaignId as unknown as ICampaign;

      if (activeCampaign.categories) {
        const hasConflict = activeCampaign.categories.some(
          (cat) =>
            categories.includes(cat) ||
            (excludedCategories && excludedCategories.includes(cat)),
        );

        if (hasConflict) {
          conflictingCampaigns.push(activeCampaign._id.toString());
          conflictingCategories.push(
            ...activeCampaign.categories.filter(
              (cat) =>
                categories.includes(cat) ||
                (excludedCategories && excludedCategories.includes(cat)),
            ),
          );
        }
      }
    }

    if (conflictingCampaigns.length > 0) {
      return {
        streamerId,
        campaignId: campaign._id.toString(),
        ruleId: rule._id as string,
        conflictType: ConflictType.CATEGORY_EXCLUSIVITY,
        severity: rule.severity,
        message: `Category exclusivity conflict: Cannot join campaigns in ${conflictingCategories.join(', ')} simultaneously`,
        conflictingCampaigns,
        conflictingCategories: [...new Set(conflictingCategories)],
        status: 'pending',
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Check brand exclusivity conflicts
   */
  private async checkBrandExclusivity(
    rule: IConflictRule,
    streamerId: string,
    campaign: ICampaign,
    activeParticipations: ICampaignParticipation[],
  ): Promise<IConflictViolation | null> {
    const { brands, excludedBrands } = rule.config;

    if (!brands) {
      return null;
    }

    const campaignBrandId = campaign.brandId.toString();

    // Check if campaign brand is in restricted brands
    const hasRestrictedBrand = brands.includes(campaignBrandId);

    if (!hasRestrictedBrand) {
      return null;
    }

    // Check for conflicting active campaigns
    const conflictingCampaigns: string[] = [];
    const conflictingBrands: string[] = [];

    for (const participation of activeParticipations) {
      const activeCampaign = participation.campaignId as unknown as ICampaign;
      const activeBrandId = activeCampaign.brandId.toString();

      const hasConflict =
        brands.includes(activeBrandId) ||
        (excludedBrands && excludedBrands.includes(activeBrandId));

      if (hasConflict) {
        conflictingCampaigns.push(activeCampaign._id.toString());
        conflictingBrands.push(activeBrandId);
      }
    }

    if (conflictingCampaigns.length > 0) {
      return {
        streamerId,
        campaignId: campaign._id.toString(),
        ruleId: rule._id as string,
        conflictType: ConflictType.BRAND_EXCLUSIVITY,
        severity: rule.severity,
        message: `Brand exclusivity conflict: Cannot join campaigns from competing brands simultaneously`,
        conflictingCampaigns,
        conflictingBrands: [...new Set(conflictingBrands)],
        status: 'pending',
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Check cooldown period conflicts
   */
  private async checkCooldownPeriod(
    rule: IConflictRule,
    streamerId: string,
    campaign: ICampaign,
  ): Promise<IConflictViolation | null> {
    const { cooldownPeriodHours, cooldownPeriodDays, categories } = rule.config;

    if (!cooldownPeriodHours && !cooldownPeriodDays) {
      return null;
    }

    // Calculate cooldown period in milliseconds
    const cooldownMs =
      (cooldownPeriodDays || 0) * 24 * 60 * 60 * 1000 +
      (cooldownPeriodHours || 0) * 60 * 60 * 1000;

    const cutoffDate = new Date(Date.now() - cooldownMs);

    // Find recent participations in conflicting categories
    const recentParticipations = await this.participationModel
      .find({
        streamerId,
        updatedAt: { $gt: cutoffDate },
        status: { $in: ['completed', 'paused'] },
      })
      .populate('campaignId');

    for (const participation of recentParticipations) {
      const recentCampaign = participation.campaignId as unknown as ICampaign;

      if (categories && recentCampaign.categories) {
        const hasConflict = recentCampaign.categories.some(
          (cat) =>
            categories.includes(cat) && campaign.categories?.includes(cat),
        );

        if (hasConflict) {
          return {
            streamerId,
            campaignId: campaign._id.toString(),
            ruleId: rule._id as string,
            conflictType: ConflictType.COOLDOWN_PERIOD,
            severity: rule.severity,
            message: `Cooldown period active: Must wait ${cooldownPeriodDays || 0} days, ${cooldownPeriodHours || 0} hours before joining another campaign in this category`,
            conflictingCampaigns: [recentCampaign._id.toString()],
            conflictingCategories: recentCampaign.categories.filter(
              (cat) =>
                categories.includes(cat) && campaign.categories?.includes(cat),
            ),
            status: 'pending',
            detectedAt: new Date(),
          };
        }
      }
    }

    return null;
  }

  /**
   * Check simultaneous campaign limits
   */
  private checkSimultaneousLimit(
    rule: IConflictRule,
    streamerId: string,
    campaign: ICampaign,
    activeParticipations: ICampaignParticipation[],
  ): IConflictViolation | null {
    const { maxSimultaneousCampaigns, maxCampaignsPerCategory } = rule.config;

    // Check total simultaneous campaigns limit
    if (
      maxSimultaneousCampaigns &&
      activeParticipations.length >= maxSimultaneousCampaigns
    ) {
      return {
        streamerId,
        campaignId: campaign._id.toString(),
        ruleId: rule._id as string,
        conflictType: ConflictType.SIMULTANEOUS_LIMIT,
        severity: rule.severity,
        message: `Simultaneous campaign limit exceeded: Maximum ${maxSimultaneousCampaigns} campaigns allowed`,
        conflictingCampaigns: activeParticipations.map((p) =>
          p.campaignId.toString(),
        ),
        status: 'pending',
        detectedAt: new Date(),
      };
    }

    // Check per-category limits
    if (maxCampaignsPerCategory && campaign.categories) {
      for (const category of campaign.categories) {
        const categoryCount = activeParticipations.filter((p) => {
          const activeCampaign = p.campaignId as unknown as ICampaign;
          return activeCampaign.categories?.includes(category);
        }).length;

        if (categoryCount >= maxCampaignsPerCategory) {
          return {
            streamerId,
            campaignId: campaign._id.toString(),
            ruleId: rule._id as string,
            conflictType: ConflictType.SIMULTANEOUS_LIMIT,
            severity: rule.severity,
            message: `Category limit exceeded: Maximum ${maxCampaignsPerCategory} campaigns allowed in ${category}`,
            conflictingCampaigns: activeParticipations
              .filter((p) => {
                const activeCampaign = p.campaignId as unknown as ICampaign;
                return activeCampaign.categories?.includes(category);
              })
              .map((p) => p.campaignId.toString()),
            conflictingCategories: [category],
            status: 'pending',
            detectedAt: new Date(),
          };
        }
      }
    }

    return null;
  }

  /**
   * Save a conflict violation
   */
  private async saveViolation(violation: IConflictViolation): Promise<void> {
    try {
      await this.conflictViolationModel.create(violation);
    } catch (error) {
      this.logger.error('Error saving conflict violation:', error);
    }
  }

  /**
   * Update rule statistics
   */
  private async updateRuleStats(
    ruleId: string,
    severity: ConflictSeverity,
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        $inc: { timesTriggered: 1 },
        lastApplied: new Date(),
      };

      if (severity === ConflictSeverity.BLOCKING) {
        updateData.$inc = {
          ...(updateData.$inc as Record<string, number>),
          conflictsBlocked: 1,
        };
      } else if (severity === ConflictSeverity.WARNING) {
        updateData.$inc = {
          ...(updateData.$inc as Record<string, number>),
          conflictsWarned: 1,
        };
      }

      await this.conflictRuleModel.findByIdAndUpdate(ruleId, updateData);
    } catch (error) {
      this.logger.error('Error updating rule statistics:', error);
    }
  }

  /**
   * Create a new conflict rule
   */
  async createConflictRule(
    ruleData: Partial<IConflictRule>,
  ): Promise<IConflictRule> {
    const rule = new this.conflictRuleModel(ruleData);
    return rule.save();
  }

  /**
   * Get all conflict rules
   */
  async getConflictRules(): Promise<IConflictRule[]> {
    return this.conflictRuleModel.find().sort({ priority: -1, createdAt: -1 });
  }

  /**
   * Update a conflict rule
   */
  async updateConflictRule(
    ruleId: string,
    updates: Partial<IConflictRule>,
  ): Promise<IConflictRule | null> {
    return this.conflictRuleModel.findByIdAndUpdate(ruleId, updates, {
      new: true,
    });
  }

  /**
   * Delete a conflict rule
   */
  async deleteConflictRule(ruleId: string): Promise<boolean> {
    const result = await this.conflictRuleModel.findByIdAndDelete(ruleId);
    return !!result;
  }

  /**
   * Get conflict violations for a streamer
   */
  async getStreamerViolations(
    streamerId: string,
  ): Promise<IConflictViolation[]> {
    return this.conflictViolationModel
      .find({ streamerId })
      .sort({ detectedAt: -1 })
      .populate('ruleId');
  }

  /**
   * Override a conflict violation (admin action)
   */
  async overrideViolation(
    violationId: string,
    overrideReason: string,
    adminId: string,
  ): Promise<IConflictViolation | null> {
    return this.conflictViolationModel.findByIdAndUpdate(
      violationId,
      {
        status: 'overridden',
        overrideReason,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      { new: true },
    );
  }

  /**
   * Get all violations (admin function)
   */
  async getAllViolations(
    status?: string,
    limit?: number,
  ): Promise<IConflictViolation[]> {
    const query = this.conflictViolationModel.find();

    if (status) {
      query.where('status').equals(status);
    }

    if (limit) {
      query.limit(limit);
    }

    return query
      .sort({ detectedAt: -1 })
      .populate('ruleId')
      .populate('streamerId')
      .populate('campaignId');
  }
}

# Conflict Rules Implementation Summary

## What We've Built for Conflict Rules

### 1. **Core Conflict Rules System**

**Schema (`schemas/conflict-rules.schema.ts`)**:
- `ConflictRule` - Defines rules for campaign conflicts
- `ConflictViolation` - Tracks when rules are violated
- Support for 4 conflict types:
  - **Category Exclusivity** - Prevent streamers from joining competing categories simultaneously
  - **Brand Exclusivity** - Prevent streamers from working with competing brands
  - **Cooldown Periods** - Enforce waiting periods between similar campaigns
  - **Simultaneous Limits** - Limit how many campaigns a streamer can join at once

**Rule Configuration Options**:
- Categories to restrict
- Cooldown periods (hours/days)
- Maximum simultaneous campaigns
- Maximum campaigns per category
- Time-based restrictions (blackout periods)
- Geographic restrictions

### 2. **Conflict Detection Service**

**ConflictRulesService (`backend/src/modules/conflict-rules/conflict-rules.service.ts`)**:
- `checkCampaignJoinConflicts()` - Main conflict detection method
- Rule evaluation with different severity levels:
  - **Blocking** - Prevents campaign joining
  - **Warning** - Shows warning but allows joining
  - **Advisory** - Logs for analytics only

**Integration**:
- Integrated into `CampaignsService.joinCampaign()` method
- Automatically checks conflicts before allowing streamers to join campaigns
- Graceful degradation if conflict service is unavailable

### 3. **Admin Management Interface**

**Admin Component (`components/admin/conflict-rules-management.tsx`)**:
- Create, edit, and delete conflict rules
- Toggle rules active/inactive
- View conflict statistics
- Monitor violations
- Override violations when needed

### 4. **Example Conflict Rules**

Here are some practical examples of conflict rules you can implement:

#### **Category Exclusivity Rule**
```json
{
  "name": "Tech Brand Exclusivity",
  "description": "Streamers cannot promote competing tech brands simultaneously",
  "type": "category_exclusivity",
  "severity": "blocking",
  "config": {
    "categories": ["Technology", "Gaming Hardware", "Software"]
  }
}
```

#### **Cooldown Period Rule**
```json
{
  "name": "Energy Drink Cooldown",
  "description": "7-day cooldown between energy drink campaigns",
  "type": "cooldown_period",
  "severity": "blocking",
  "config": {
    "categories": ["Energy Drinks", "Beverages"],
    "cooldownPeriodDays": 7
  }
}
```

#### **Simultaneous Limit Rule**
```json
{
  "name": "Maximum Active Campaigns",
  "description": "Streamers can only participate in 3 campaigns simultaneously",
  "type": "simultaneous_limit",
  "severity": "warning",
  "config": {
    "maxSimultaneousCampaigns": 3
  }
}
```

### 5. **Integration Points**

**Campaign Joining Process**:
1. Streamer attempts to join campaign
2. System checks all active conflict rules
3. Evaluates conflicts based on rule configuration
4. Either blocks, warns, or allows joining
5. Logs violations for analytics

**Frontend Experience**:
- Streamers see clear error messages when blocked
- Warning messages for advisory conflicts
- Brands can see conflict statistics in admin panel

### 6. **API Endpoints**

- `POST /api/nest/conflict-rules/check/:streamerId/:campaignId` - Check conflicts
- `GET /api/nest/conflict-rules` - List all rules (Admin)
- `POST /api/nest/conflict-rules` - Create rule (Admin)
- `PUT /api/nest/conflict-rules/:id` - Update rule (Admin)
- `DELETE /api/nest/conflict-rules/:id` - Delete rule (Admin)
- `GET /api/nest/conflict-rules/violations/:streamerId` - Get violations
- `POST /api/nest/conflict-rules/violations/:id/override` - Override violation (Admin)

### 7. **How Platform Owners Use This**

**For Category Exclusivity**:
- Set up rules preventing streamers from promoting Coca-Cola and Pepsi simultaneously
- Block streamers from working with Apple and Samsung campaigns at the same time
- Prevent conflicts between competing gaming platforms

**For Cool-down Periods**:
- Enforce 30-day breaks between automotive campaigns
- Require 7-day cooldowns between financial service promotions
- Set monthly limits on alcohol/tobacco related content

**For Simultaneous Limits**:
- Limit streamers to maximum 5 active campaigns to maintain quality
- Restrict newcomers to 2 campaigns until they prove reliability
- Set category-specific limits (max 1 financial campaign at a time)

### 8. **Real-World Scenarios**

**Scenario 1: Tech Brand Competition**
- Streamer is promoting Intel gaming PCs
- Tries to join AMD gaming campaign
- System blocks with message: "Category exclusivity conflict: Cannot join campaigns in Technology, Gaming Hardware simultaneously"

**Scenario 2: Cooldown Enforcement**
- Streamer finished Red Bull campaign yesterday
- Tries to join Monster Energy campaign
- System blocks with message: "Cooldown period active: Must wait 7 days before joining another campaign in Energy Drinks category"

**Scenario 3: Overload Prevention**
- Streamer already has 5 active campaigns
- Tries to join 6th campaign
- System shows warning: "You already have the maximum recommended number of active campaigns. Consider completing some before joining new ones."

### 9. **Configuration for Your Platform**

To set up conflict rules for your platform:

1. **Access Admin Panel**: `/dashboard/admin/conflict-rules`
2. **Create Category Rules**: Define competing categories
3. **Set Cooldown Periods**: Based on your industry requirements
4. **Configure Limits**: Set reasonable simultaneous campaign limits
5. **Monitor Violations**: Check analytics to refine rules

This system ensures that your marketplace maintains advertiser trust while protecting streamers from overcommitment and conflicting brand associations.

## Next Steps

1. **Test the conflict detection** when streamers join campaigns
2. **Set up initial conflict rules** for your main categories
3. **Monitor violation analytics** to refine rule effectiveness
4. **Add frontend warnings** to show streamers potential conflicts before they join
5. **Implement brand-specific conflict preferences** for premium advertisers

The conflict rules system is now ready to enforce platform policies and maintain advertiser relationships while giving you full control over campaign participation restrictions.

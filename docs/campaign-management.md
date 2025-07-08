# Campaign Management Guide for Gametriggers

This document outlines the processes and implementation details for campaign creation and modification in the Gametriggers platform.

## Table of Contents
1. [Overview](#overview)
2. [Campaign Data Structure](#campaign-data-structure)
3. [Campaign Creation Process](#campaign-creation-process)
4. [Campaign Modification Process](#campaign-modification-process)
5. [API Endpoints](#api-endpoints)
6. [Frontend Implementation](#frontend-implementation)
7. [Backend Implementation](#backend-implementation)
8. [Campaign Participation](#campaign-participation)
9. [Testing Guidelines](#testing-guidelines)

## Overview

The campaign management system allows brands to create and modify advertising campaigns that can be joined by streamers. This system is at the core of the Gametriggers platform, connecting advertisers with content creators.

Campaigns represent advertising opportunities with defined parameters, assets, and compensation models that brands can offer to streamers for in-stream promotions.

## Campaign Data Structure

Based on the schema files in your project, a campaign likely includes:

```typescript
// Simplified representation of Campaign schema
interface Campaign {
  _id: string;
  name: string;
  description: string;
  brand: string | ObjectId; // Reference to brand's user account
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  remainingBudget: number;
  startDate: Date;
  endDate: Date;
  targetAudience: {
    countries: string[];
    ageRanges: string[];
    interests: string[];
  };
  assets: {
    images: string[]; // URLs to image assets
    videos: string[]; // URLs to video assets
    overlayType: 'banner' | 'full-screen' | 'corner';
    displayDuration: number; // in seconds
  };
  requirements: {
    minViewers: number;
    minFollowers: number;
    contentCategories: string[];
  };
  compensation: {
    type: 'per-view' | 'flat-rate' | 'hybrid';
    ratePerView: number;
    flatRate: number;
    details: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Campaign Creation Process

### Flow Overview

1. Brand authenticates into the dashboard
2. Brand navigates to campaign creation form
3. Brand fills out campaign details (multi-step form)
4. Brand uploads creative assets
5. Brand sets targeting criteria and budget
6. Brand submits campaign for review
7. Platform admin approves campaign (optional)
8. Campaign becomes available for streamer applications

### Implementation Details

#### Step 1: Form Collection
The campaign creation form collects all necessary information:
- Basic campaign information (name, description, dates)
- Budget allocation
- Target audience details
- Creative assets (images, videos, overlay specifications)
- Streamer requirements
- Compensation model

#### Step 2: Asset Upload
Assets are uploaded to `/api/upload` which stores files in the `public/uploads/` directory, organized by type (images/videos).

#### Step 3: Campaign Creation
On form submission, data is sent to the campaign creation API endpoint for processing and storage in MongoDB.

#### Step 4: Validation
The backend validates all inputs including:
- Budget constraints
- Date ranges
- Asset formats and sizes
- Payment model parameters

## Campaign Modification Process

### Flow Overview

1. Brand navigates to campaign dashboard
2. Brand selects a campaign to edit
3. Brand modifies allowed fields (depends on campaign status)
4. Brand submits changes
5. System validates changes
6. System updates campaign in database
7. Notifications sent to participating streamers (if applicable)

### Implementation Details

#### Editable Fields by Campaign Status

- **Draft**: All fields are editable
- **Active**: Limited editing (budget increase, end date extension, creative assets)
- **Paused**: Most fields editable except core parameters
- **Completed**: No editing allowed

#### Validation Rules

- Cannot reduce budget below amount already allocated to streamers
- Cannot shorten campaign duration if streamers are already participating
- New assets must meet the same validation criteria as during creation

## API Endpoints

### Campaign Management Endpoints

```
POST   /api/campaigns                # Create new campaign
GET    /api/campaigns                # List all campaigns (with filters)
GET    /api/campaigns/:id            # Get campaign details
PUT    /api/campaigns/:id            # Update campaign
DELETE /api/campaigns/:id            # Delete campaign (draft only)
POST   /api/campaigns/:id/pause      # Pause campaign
POST   /api/campaigns/:id/activate   # Activate campaign
```

### Brand-specific Endpoints

```
GET    /api/campaigns/brand          # Get brand's campaigns
POST   /api/campaigns/brand/create   # Brand-specific campaign creation
```

### Streamer-specific Endpoints

```
GET    /api/campaigns/streamer       # Get available campaigns for streamer
POST   /api/campaigns/:id/apply      # Apply to participate in campaign
```

## Frontend Implementation

### Components

- `CampaignForm`: Multi-step form component for campaign creation/editing
- `CampaignCard`: Display card for campaigns in listings
- `AssetUploader`: Component for handling image/video uploads
- `CampaignDashboard`: Overview of campaign performance

### UI Workflow

1. Use ShadcnUI components for consistent form elements
2. Implement multi-step form with progress indicators
3. Provide real-time validation feedback
4. Show preview of campaign appearance in stream
5. Include budget calculator based on parameters

### Implementation Example

```tsx
// Simple example of campaign creation form component
const CampaignCreationForm = () => {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    // Other fields...
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Submit to API
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData),
    });
    
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      {step === 1 && (
        // Step 1 form fields
      )}
      {step === 2 && (
        // Step 2 form fields
      )}
      {/* More steps */}
    </form>
  );
};
```

## Backend Implementation

### NestJS Controllers and Services

The campaign functionality is implemented through NestJS modules in the `app/api/nest/` directory:

- **CampaignController**: Handles HTTP requests for campaign operations
- **CampaignService**: Contains business logic for campaign management
- **CampaignRepository**: Handles database operations for campaigns

### Example Service Implementation

```typescript
@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
  ) {}

  async create(createCampaignDto: CreateCampaignDto, userId: string): Promise<Campaign> {
    const campaign = new this.campaignModel({
      ...createCampaignDto,
      brand: userId,
      status: 'draft',
      remainingBudget: createCampaignDto.budget,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return campaign.save();
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    // Validate modification is allowed
    const campaign = await this.campaignModel.findById(id);
    
    // Validation logic based on campaign status
    
    return this.campaignModel.findByIdAndUpdate(id, {
      ...updateCampaignDto,
      updatedAt: new Date(),
    }, { new: true });
  }
}
```

### Validation

Use class-validator for DTO validation:

```typescript
export class CreateCampaignDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  // Additional validation rules for other fields
}
```

## Campaign Participation

Campaigns connect to streamers through the campaign-participation schema which tracks:

- Which streamers have joined a campaign
- Performance metrics (views, interactions)
- Payment status and amounts
- Delivery schedule

### Participation Process

1. Streamer discovers campaign in marketplace
2. Streamer applies to join campaign
3. System or brand approves participation (depends on configuration)
4. Streamer receives overlay code/link for their streaming software
5. System tracks ad displays during streams
6. System calculates earnings based on performance

## Testing Guidelines

### Unit Tests

- Test campaign creation with valid/invalid data
- Test modification permissions based on campaign status
- Test budget calculations and constraints

### Integration Tests

- Test complete campaign creation flow
- Test streamer application process
- Test campaign modification scenarios

### End-to-End Tests

- Create a campaign as a brand
- Apply as a streamer
- Verify overlay functionality
- Track metrics and payment calculations

## Best Practices

1. **Validate all inputs**: Ensure all campaign parameters meet requirements
2. **Use transactions**: When updating campaign data that affects multiple collections
3. **Implement proper error handling**: Return meaningful error messages
4. **Optimize asset delivery**: Ensure campaign assets load quickly in overlays
5. **Implement caching**: Cache active campaigns for faster retrieval
6. **Set up proper indexes**: Optimize database queries for campaign listing and filtering

---

This guide provides an overview of the campaign management system. For implementation details, refer to the actual code in the repository.

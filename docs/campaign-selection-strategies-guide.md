# Campaign Selection Strategies - Complete Guide

## Overview

The Campaign Selection Strategies system determines which campaign ads are displayed to streamers when they have multiple active campaign participations. This system ensures optimal campaign exposure, fair distribution, and revenue optimization.

## How It Works

### 1. **Strategy Selection Flow**
```
1. Streamer requests overlay data
2. System checks for active campaign participations
3. If multiple campaigns exist → Apply selection strategy
4. Selected campaign is displayed in overlay
5. Impression/click tracking occurs
```

### 2. **Available Strategies**

#### **A. Fair Rotation (Default)**
- **Purpose**: Equal exposure for all campaigns
- **Algorithm**: Time-based rotation with 3-minute intervals
- **Logic**: 
  - Campaigns sorted by ID for consistent ordering
  - Current time divided by interval determines which campaign shows
  - Each campaign gets equal time slots
- **Best For**: Balanced exposure, fairness to all brands

#### **B. Weighted Selection**
- **Purpose**: Smart selection based on multiple factors
- **Factors**:
  - **Payment Rate** (40%): Higher paying campaigns get priority
  - **Performance** (30%): Campaigns with better CTR get bonus
  - **Fairness** (30%): Recently shown campaigns get lower priority
- **Algorithm**: Weighted random selection based on combined score
- **Best For**: Balancing revenue with performance and fairness

#### **C. Time Rotation**
- **Purpose**: Strict time-based cycling
- **Algorithm**: Each campaign gets exactly equal time slots
- **Interval**: 3 minutes per campaign (configurable)
- **Logic**: `campaignIndex = floor(currentTime / intervalMs) % campaignCount`
- **Best For**: Guaranteed equal time distribution

#### **D. Performance-Based**
- **Purpose**: Prioritize high-performing campaigns
- **Metrics**:
  - **Click-Through Rate (CTR)** (40%)
  - **Earnings per Impression** (60%)
- **Algorithm**: Sort by performance score with slight randomness
- **Best For**: Maximizing engagement and click-through rates

#### **E. Revenue-Optimized**
- **Purpose**: Maximize streamer earnings
- **Calculation**:
  - Expected revenue per impression
  - Historical CTR performance multiplier
  - Payment type consideration (CPM vs Fixed)
- **Algorithm**: Select highest expected revenue with randomness
- **Best For**: Maximizing streamer income

### 3. **Blackout Periods**

Streamers can configure blackout periods to pause campaign display:

```typescript
blackoutPeriods: [
  {
    startTime: "22:00",
    endTime: "06:00", 
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
]
```

- **Features**:
  - Time-based (HH:MM format)
  - Day-specific configuration
  - Handles overnight periods (23:00 to 01:00)
  - Returns 'none' strategy during blackout

### 4. **Configuration**

#### **User Settings (Database)**
```typescript
// In users collection
{
  campaignSelectionStrategy: "revenue-optimized",
  campaignRotationSettings: {
    preferredStrategy: "revenue-optimized",
    rotationIntervalMinutes: 3,
    priorityWeights: {
      paymentRate: 0.4,
      performance: 0.3,
      fairness: 0.3
    },
    blackoutPeriods: [...]
  }
}
```

#### **Frontend Configuration**
- Located in: `app/dashboard/settings/overlay/page.tsx`
- Component: `CampaignSelectionSettings`
- API: `/api/user/me/campaign-selection` (GET/PUT)

## Current Status for karma_sapiens

### **IMPORTANT: Token Types**

There are **two different types of overlay tokens**:

1. **User Overlay Token** (enables campaign selection strategies):
   - Token: `ad4b9dcfceb742801ce7a23980087ac629a39965d922bc5c2ac9bb7584a8c5cd`
   - URL: `/api/overlay/ad4b9dcf.../data`
   - **Behavior**: Applies campaign selection strategies and rotates between multiple campaigns

2. **Campaign-Specific Browser Source Token** (shows specific campaign only):
   - Token: `0f44b311d2a3777b161a8c9ab3efe78b3122b03a1ea7de83a7b0fe628d34cb1e`
   - URL: `/api/overlay/0f44b311.../data`
   - **Behavior**: Always shows the specific campaign (RGB Gaming Keyboard), bypasses selection strategies

### **Why RGB Gaming Keyboard Shows for >3 minutes**

You were using the **campaign-specific token** (`0f44b311...`) which is hardcoded to show only the RGB Gaming Keyboard campaign. This bypasses all selection strategies!

**To see campaign rotation working:**
- Use the **user overlay token**: `ad4b9dcfceb742801ce7a23980087ac629a39965d922bc5c2ac9bb7584a8c5cd`
- This will rotate between "Hinge" and "RGB Gaming Keyboard" every 3 minutes

### Current Settings:

```javascript
// Current user settings from database:
{
  "campaignSelectionStrategy": "fair-rotation",
  "campaignRotationSettings": {
    "preferredStrategy": "fair-rotation", 
    "rotationIntervalMinutes": 3,
    "priorityWeights": {
      "paymentRate": 0.4,
      "performance": 0.3, 
      "fairness": 0.3
    },
    "blackoutPeriods": []
  }
}
```

### Active Campaigns:
1. **"Hinge"** - Payment: 1660 CPM (higher paying)
2. **"RGB Gaming Keyboard"** - Payment: 1245 CPM (lower paying)

## Testing Campaign Selection

### 1. **Use the Correct Token Type**

❌ **WRONG** (Campaign-specific token - no rotation):
```
http://localhost:3000/api/overlay/0f44b311d2a3777b161a8c9ab3efe78b3122b03a1ea7de83a7b0fe628d34cb1e/data
```

✅ **CORRECT** (User overlay token - with rotation):
```
http://localhost:3000/api/overlay/ad4b9dcfceb742801ce7a23980087ac629a39965d922bc5c2ac9bb7584a8c5cd/data
```

### 2. **Test Rotation Timing**

With fair rotation (3-minute intervals):
- **0-3 minutes**: Should show "Hinge" (higher campaign ID)
- **3-6 minutes**: Should show "RGB Gaming Keyboard" 
- **6-9 minutes**: Should show "Hinge" again
- **9-12 minutes**: Should show "RGB Gaming Keyboard" again

### 3. **Check Current Strategy**
```bash
# Query user settings
db.users.findOne(
  {"email": "kyadav.9643@gmail.com"}, 
  {campaignSelectionStrategy: 1, campaignRotationSettings: 1}
)
```

### 4. **Test Strategy Changes**
- Go to: `http://localhost:3000/dashboard/settings/overlay`
- Navigate to "Campaign Selection Settings" section
- Change strategy and save
- Test overlay with USER token: `/api/overlay/ad4b9dcf.../data`

### 5. **Monitor Selection Logic**
Backend logs show strategy selection:
```
Using campaign selection strategy: fair-rotation for streamer: 6864d4187d06a675f2abb714
Selected campaign via fair rotation: RGB Gaming Keyboard (1/2)
```

## Key Features

✅ **Multiple Selection Algorithms**: 5 different strategies
✅ **Blackout Period Support**: Time and day-based pausing
✅ **Performance Tracking**: CTR and earnings metrics
✅ **Weighted Scoring**: Configurable factor weights
✅ **Fair Distribution**: Prevents campaign monopolization
✅ **Revenue Optimization**: Maximize streamer earnings
✅ **Frontend Configuration**: Easy-to-use settings UI
✅ **Real-time Application**: Immediate strategy changes

## Debug Information

Current implementation includes extensive logging:
- Strategy selection reasons
- Campaign scoring details  
- Blackout period checks
- Performance calculations
- Revenue optimization logic

Would you like me to:
1. **Test a specific strategy** with karma_sapiens?
2. **Explain any strategy in detail**?
3. **Show how to configure settings**?
4. **Add new strategies or features**?

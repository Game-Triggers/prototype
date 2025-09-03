# 🚀 Campaign Auto-Completion Manual Trigger API Testing Guide

## 📋 Overview

The campaign auto-completion system provides manual trigger endpoints for testing and immediate execution of completion checks. These endpoints allow you to bypass the scheduled 5-minute interval and trigger completion checks immediately.

## 🔑 Authentication

All endpoints require authentication. You need:
- Bearer token in Authorization header
- Admin role for global triggers
- Brand/Admin role for individual campaign checks

## 🎯 Available Manual Trigger Endpoints

### 1. **Trigger Global Campaign Completion Check** (Admin Only)
```http
POST /api/v1/campaigns/completion-check/trigger
Authorization: Bearer <your-admin-token>
Content-Type: application/json
```

**Description:** Triggers an immediate check of ALL active campaigns for completion criteria.

**Response:**
```json
{
  "success": true,
  "message": "Campaign completion check completed successfully"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3001/api/v1/campaigns/completion-check/trigger" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 2. **Check Specific Campaign for Completion** (Admin/Brand)
```http
POST /api/v1/campaigns/{campaignId}/completion-check
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Description:** Check if a specific campaign meets completion criteria and mark it complete if applicable.

**Response:**
```json
{
  "campaignId": "64f8d3c97e1d2a001f9a5e8c",
  "wasCompleted": true,
  "reason": "Campaign reached impression target (1001/606)"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3001/api/v1/campaigns/64f8d3c97e1d2a001f9a5e8c/completion-check" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 3. **Get Campaign Completion Status** (Any authenticated user)
```http
GET /api/v1/campaigns/{campaignId}/completion-status
Authorization: Bearer <your-token>
```

**Description:** Retrieve detailed completion criteria and current status for a campaign.

**Response:**
```json
{
  "campaignId": "64f8d3c97e1d2a001f9a5e8c",
  "status": "active",
  "isEligibleForCompletion": true,
  "completionReason": "Impression target exceeded",
  "metrics": {
    "totalImpressions": 1001,
    "totalClicks": 45,
    "activeParticipants": 3,
    "budgetUsedPercentage": "83.2%",
    "remainingBudget": 168
  },
  "criteria": {
    "impressionTarget": 606,
    "budgetThreshold": 800
  },
  "lastChecked": "2025-08-30T20:49:35.000Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/campaigns/64f8d3c97e1d2a001f9a5e8c/completion-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Testing Scenarios

### Scenario 1: Test Your Campaign with 1,001 Impressions
Since you mentioned your campaign has 1,001 impressions exceeding the 606 target:

```bash
# 1. Check current status
curl -X GET "http://localhost:3001/api/v1/campaigns/YOUR_CAMPAIGN_ID/completion-status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Trigger completion check for that specific campaign
curl -X POST "http://localhost:3001/api/v1/campaigns/YOUR_CAMPAIGN_ID/completion-check" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Verify it was completed
curl -X GET "http://localhost:3001/api/v1/campaigns/YOUR_CAMPAIGN_ID/completion-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Scenario 2: Global Check (Admin only)
```bash
# Trigger check for all campaigns
curl -X POST "http://localhost:3001/api/v1/campaigns/completion-check/trigger" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🔍 Expected Completion Criteria

The system checks these criteria for auto-completion:

1. **Impression Target:** `budget / paymentRate * 1000`
   - Your campaign: `budget/paymentRate*1000 = 606 impressions`
   - Current: `1001 impressions` ✅ **EXCEEDS TARGET**

2. **Budget Threshold:** 80% of total budget used
3. **Time Limits:** Campaign end date reached

---

## 📊 Completion Process

When a campaign is marked complete:

1. **Campaign Status:** Changed to `"completed"`
2. **G-Keys Released:** All locked G-keys for that category move to cooloff period
3. **Earnings Released:** Streamer earnings are made available for withdrawal
4. **Notifications:** Sent to brand and participating streamers

---

## 🛠️ Testing Tools

### Postman Collection
```json
{
  "info": {
    "name": "Campaign Completion Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Global Completion Check",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": "{{base_url}}/api/v1/campaigns/completion-check/trigger"
      }
    }
  ]
}
```

### Environment Variables
```json
{
  "base_url": "http://localhost:3001",
  "admin_token": "YOUR_ADMIN_JWT_TOKEN",
  "brand_token": "YOUR_BRAND_JWT_TOKEN",
  "campaign_id": "YOUR_CAMPAIGN_ID"
}
```

---

## 🚨 Troubleshooting

### Common Issues:

1. **401 Unauthorized:** Check your JWT token
2. **403 Forbidden:** Admin role required for global trigger
3. **404 Not Found:** Verify campaign ID exists
4. **500 Server Error:** MongoDB connection issues

### Debug Logs:
When you trigger the endpoints, watch the server logs for:
```
[Nest] DEBUG [CampaignCompletionService] === ENTERING checkAllCampaignsForCompletion METHOD ===
[Nest] DEBUG [CampaignCompletionService] Found 3 active campaigns to check
[Nest] DEBUG [CampaignCompletionService] Campaign 64f8d3c9... meets completion criteria: Impression target exceeded
```

---

## 🎉 Next Steps

1. **Start MongoDB** (or use mock module for testing)
2. **Get authentication token** for your user
3. **Find your campaign ID** from the database
4. **Test the endpoints** using the examples above
5. **Verify G-keys** are released to cooloff period

Your campaign with 1,001 impressions should be automatically completed once you trigger the check!

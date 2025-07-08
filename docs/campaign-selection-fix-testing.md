# Campaign Selection Strategy - Fix Implementation & Testing Guide

## ✅ **Fix Applied:**

**Problem**: Campaign-specific browser source tokens were bypassing selection strategies.

**Solution**: Enhanced the backend to apply selection strategies even when using campaign-specific tokens if the streamer has multiple active campaigns.

## 🔧 **What Changed:**

### Before:
```
Campaign-specific token → Always shows that specific campaign (no rotation)
User overlay token → Applies selection strategies (rotation)
```

### After:
```
Campaign-specific token → If multiple campaigns exist, applies selection strategies
User overlay token → Applies selection strategies (unchanged)
```

## 🧪 **Testing the Fix:**

### 1. **Test Revenue-Optimized Strategy**

Current setting: `revenue-optimized` strategy should prefer "Hinge" (1660 CPM > 1245 CPM)

**Test URL:**
```
http://localhost:3000/api/overlay/0f44b311d2a3777b161a8c9ab3efe78b3122b03a1ea7de83a7b0fe628d34cb1e/data
```

**Expected Result:** Should show "Hinge" campaign (higher payment rate)

### 2. **Test Fair Rotation Strategy**

Change back to fair rotation:
```javascript
// Set strategy back to fair rotation
db.users.updateOne(
  {"email": "kyadav.9643@gmail.com"},
  {"$set": {"campaignSelectionStrategy": "fair-rotation"}}
)
```

**Expected Result:** Should rotate between campaigns every 3 minutes

### 3. **Test Performance-Based Strategy**

"Hinge" has 5 impressions vs "RGB Gaming Keyboard" with 0 impressions:
```javascript
db.users.updateOne(
  {"email": "kyadav.9643@gmail.com"},
  {"$set": {"campaignSelectionStrategy": "performance"}}
)
```

**Expected Result:** Should prefer "Hinge" (better performance history)

## 📊 **Campaign Data for karma_sapiens:**

```
Campaign 1: "Hinge"
- Payment: 1660 CPM (higher)
- Impressions: 5 (better performance)
- Campaign ID: 685f9273332f9dae98cbd254

Campaign 2: "RGB Gaming Keyboard"  
- Payment: 1245 CPM (lower)
- Impressions: 0 (no performance data)
- Campaign ID: 68626579d05bf40ec8267ffd
```

## 🎯 **Expected Behavior by Strategy:**

| Strategy | Expected Campaign | Reason |
|----------|-------------------|---------|
| `fair-rotation` | Alternates every 3min | Time-based rotation |
| `revenue-optimized` | "Hinge" | Higher CPM (1660 > 1245) |
| `performance` | "Hinge" | Better performance (5 impressions > 0) |
| `weighted` | "Hinge" | Higher payment + better performance |
| `time-rotation` | Alternates every 3min | Strict time intervals |

## 🔍 **Debug Information:**

Backend logs will now show:
```
Campaign participation found with token: 686511bdf5a1848d4e97338c
Streamer has 2 active participations
Multiple campaigns found - applying selection strategy
Using campaign selection strategy: revenue-optimized for streamer: 6864d4187d06a675f2abb714
Selected campaign via revenue optimization: Hinge (expected: $0.0017)
Strategy selected campaign: 6864d4ee7d06a675f2abb716 (requested was: 686511bdf5a1848d4e97338c)
Showing campaign: Hinge (strategy: revenue-optimized)
```

## ✅ **Verification Steps:**

1. **Check current strategy in database:**
   ```javascript
   db.users.findOne(
     {"email": "kyadav.9643@gmail.com"}, 
     {"campaignSelectionStrategy": 1}
   )
   ```

2. **Test campaign-specific token (should now apply strategies):**
   ```
   http://localhost:3000/api/overlay/0f44b311d2a3777b161a8c9ab3efe78b3122b03a1ea7de83a7b0fe628d34cb1e/data
   ```

3. **Test user overlay token (should still work):**
   ```
   http://localhost:3000/api/overlay/ad4b9dcfceb742801ce7a23980087ac629a39965d922bc5c2ac9bb7584a8c5cd/data
   ```

4. **Change strategies via frontend:**
   ```
   http://localhost:3000/dashboard/settings/overlay
   ```

## 🎉 **Result:**

Now both token types will apply campaign selection strategies when multiple campaigns exist, giving you the rotation and optimization behavior you expect!

**Test it out and let me know if you see the campaigns rotating or if revenue-optimized shows "Hinge" instead of "RGB Gaming Keyboard"!**

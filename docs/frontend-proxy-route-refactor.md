# Frontend Proxy Route Refactor - Campaign Selection Settings

## Overview
This document outlines the refactoring of the frontend overlay settings page to use Next.js API proxy routes instead of calling the backend API directly through the API client.

## Changes Made

### 1. Updated Frontend (`app/dashboard/settings/overlay/page.tsx`)

**Before:**
- Used `usersApi.updateCampaignSelectionSettings()` from the API client
- Passed authentication tokens manually
- Made direct calls to the backend API

**After:**
- Uses `fetch('/api/user/me/campaign-selection')` proxy route
- Relies on server-side authentication via NextAuth session
- Improved error handling and type safety

### 2. Loading Campaign Selection Settings

**Before:**
```typescript
const userProfile = await usersApi.getUserProfile(
  session.accessToken as string,
  session.refreshToken as string
) as any;
```

**After:**
```typescript
const campaignResponse = await fetch('/api/user/me/campaign-selection', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 3. Updating Campaign Selection Settings

**Before:**
```typescript
await usersApi.updateCampaignSelectionSettings(
  settings,
  session?.accessToken as string,
  session?.refreshToken as string
);
```

**After:**
```typescript
const response = await fetch('/api/user/me/campaign-selection', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(settings),
});
```

## Benefits

1. **Improved Security**: Authentication is handled server-side, no client-side token management
2. **Better Error Handling**: Centralized error handling in the proxy route
3. **Consistent Architecture**: Follows the same pattern as other API routes in the application
4. **Type Safety**: Better TypeScript support and error handling
5. **Maintainability**: Easier to maintain and debug

## Files Modified

- `app/dashboard/settings/overlay/page.tsx` - Updated frontend logic
- `app/api/user/me/campaign-selection/route.ts` - Proxy route (already existed)

## Testing

The changes maintain full backward compatibility with existing functionality while providing a more robust and secure implementation.

## Note

The `usersApi` import is still required for other overlay-related functionality (checkOverlayStatus, getOverlaySettings, regenerateOverlayToken, updateOverlaySettings, triggerTestAd).

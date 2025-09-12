# Temporary Fund Adding Feature

This document explains how to use the temporary fund adding feature for testing wallet functionality without integrating with a real payment gateway.

## Overview

The temporary fund adding feature allows developers and testers to add funds to user wallets instantly for testing purposes. This feature mimics real transactions but doesn't require actual payment processing.

## Features

### 1. User Wallet Dashboard
- **Location**: Brand user wallet dashboard
- **Endpoint**: `/api/wallet/temp-add-funds`
- **Features**:
  - Quick amount buttons (₹1,000, ₹5,000, ₹10,000, ₹25,000)
  - Custom amount input
  - Payment method selection (UPI, Card, Net Banking, Bank Transfer)
  - Clear indication that it's for testing

### 2. Admin Panel
- **Location**: Admin wallet management panel
- **Features**:
  - Quick add funds buttons for any user
  - Preset amounts: ₹1,000, ₹5,000, ₹10,000, ₹25,000
  - Custom amount input
  - Instant fund addition with proper transaction records

## API Endpoints

### POST `/api/wallet/temp-add-funds`
**Description**: Add temporary funds to user wallet

**Request Body**:
```json
{
  "amount": 1000,
  "paymentMethod": "upi",
  "description": "Test fund addition"
}
```

**Response**:
```json
{
  "transactionId": "507f1f77bcf86cd799439011",
  "amount": 1000.0,
  "balance": 6000.0,
  "message": "Funds added successfully",
  "paymentMethod": "upi",
  "description": "Temporary funds added via upi",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST `/api/admin/wallets/{userId}/adjust`
**Description**: Admin manual balance adjustment (existing endpoint)

**Request Body**:
```json
{
  "amount": 1000,
  "reason": "Quick test funds addition - ₹1000",
  "type": "manual_adjustment"
}
```

## Usage Instructions

### For Brand Users
1. Navigate to the wallet dashboard
2. Go to "Add Funds" tab
3. Notice the blue "Testing Mode" banner
4. Either:
   - Click one of the quick amount buttons (₹1,000, ₹5,000, etc.)
   - Enter a custom amount
5. Select a payment method
6. Click "Add Temporary Funds"
7. Funds will be added instantly with success notifications

### For Admins
1. Go to Admin Panel > Wallet Management
2. Search for a user
3. Click "View" on the user you want to add funds to
4. Click "Quick Add Funds" button
5. Either:
   - Click preset amount buttons
   - Enter custom amount and click "Add"
6. Funds will be added instantly with proper transaction records

## Transaction Records

All temporary fund additions create proper transaction records with:
- Unique transaction IDs (prefixed with `temp_` for easy identification)
- Proper transaction type (DEPOSIT)
- Payment method tracking
- Descriptions indicating it's a temporary/test transaction
- Audit trail with timestamps and user information

## Security Considerations

- Only authenticated users can add funds to their own wallets
- Only brand users can access the temp-add-funds endpoint
- All transactions are logged for audit purposes
- Clear indications that these are test transactions
- No special permissions required for temp funds (unlike regular fund uploads)

## Development Notes

- The feature uses the same wallet service as real transactions
- Transaction IDs are prefixed with `temp_` to distinguish from real payments
- All wallet balance calculations work exactly as they would with real payments
- Easy to disable/remove when real payment gateway is implemented

## Migration to Real Payment Gateway

When ready to implement a real payment gateway:

1. Replace the `/api/wallet/temp-add-funds` endpoint with real payment integration
2. Update the frontend to use the payment gateway flow
3. Remove or hide the "Testing Mode" indicators
4. Update button text from "Add Temporary Funds" to "Add Funds"
5. Consider keeping the admin quick funds feature for support purposes

## Error Handling

The system includes proper error handling for:
- Invalid amounts (negative or zero)
- Missing payment methods
- Authentication failures
- Insufficient permissions
- Server errors

All errors are displayed to users with appropriate messages and logged for debugging.

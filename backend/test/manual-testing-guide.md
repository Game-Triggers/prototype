# Manual Testing Guide - Payment & Earnings System

## Quick Start Testing with cURL

### Prerequisites
1. Make sure the development server is running: `npm run dev:unified`
2. Server should be accessible at `http://localhost:3000`

## Step-by-Step Testing Guide

### 1. Test Wallet Balance (No Authentication Required for Demo)

```bash
# Test getting wallet balance (will create wallet if not exists)
curl -X GET "http://localhost:3000/api/wallet/balance" \
  -H "Content-Type: application/json"
```

### 2. Test Payment Intent Creation

```bash
# Create a payment intent for ₹10,000
curl -X POST "http://localhost:3000/api/payments/create-intent" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "inr", 
    "paymentMethod": "card",
    "metadata": {
      "purpose": "wallet_topup"
    }
  }'
```

Expected Response:
```json
{
  "clientSecret": "pi_mock_XXXXXXX_secret_mock",
  "paymentIntentId": "pi_mock_XXXXXXX",
  "amount": 10000,
  "currency": "inr"
}
```

### 3. Test UPI Payment

```bash
# Process UPI payment for ₹2,000
curl -X POST "http://localhost:3000/api/payments/upi" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2000,
    "upiId": "testuser@paytm",
    "metadata": {
      "purpose": "wallet_topup"
    }
  }'
```

Expected Response:
```json
{
  "success": true,
  "transactionId": "UPI_XXXXXXX",
  "amount": 2000,
  "status": "completed",
  "upiRef": "UPIXXXXXXX"
}
```

### 4. Test Wallet Transaction History

```bash
# Get transaction history
curl -X GET "http://localhost:3000/api/wallet/transactions?limit=10&offset=0" \
  -H "Content-Type: application/json"
```

### 5. Test KYC Submission

```bash
# Submit KYC documents
curl -X POST "http://localhost:3000/api/kyc/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pan",
    "documentNumber": "ABCDE1234F",
    "personalInfo": {
      "fullName": "Test User",
      "dateOfBirth": "1990-01-01",
      "address": "123 Test Street, Test City",
      "phone": "9876543210",
      "nationality": "Indian"
    },
    "bankDetails": {
      "accountNumber": "1234567890",
      "ifscCode": "HDFC0000123",
      "accountHolderName": "Test User",
      "bankName": "HDFC Bank"
    }
  }'
```

### 6. Test KYC Status Check

```bash
# Check KYC status
curl -X GET "http://localhost:3000/api/kyc/status" \
  -H "Content-Type: application/json"
```

### 7. Test Withdrawal Request

```bash
# Create withdrawal request
curl -X POST "http://localhost:3000/api/wallet/withdraw" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "bankAccount": "1234567890",
    "ifscCode": "HDFC0000123", 
    "accountHolderName": "Test User",
    "notes": "Test withdrawal"
  }'
```

### 8. Test Admin Finance Overview (Admin Role Required)

```bash
# Get finance overview
curl -X GET "http://localhost:3000/api/admin/finance/overview" \
  -H "Content-Type: application/json"
```

## Testing with Different Scenarios

### Scenario 1: Brand Wallet Top-up Flow
```bash
# 1. Check initial balance
curl -X GET "http://localhost:3000/api/wallet/balance"

# 2. Create payment intent
curl -X POST "http://localhost:3000/api/payments/create-intent" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "currency": "inr", "paymentMethod": "card"}'

# 3. Check balance after payment (in real scenario, webhook would update this)
curl -X GET "http://localhost:3000/api/wallet/balance"

# 4. Check transaction history
curl -X GET "http://localhost:3000/api/wallet/transactions"
```

### Scenario 2: Streamer Earnings & Withdrawal
```bash
# 1. Check initial streamer balance
curl -X GET "http://localhost:3000/api/wallet/balance"

# 2. Submit KYC for higher withdrawal limits
curl -X POST "http://localhost:3000/api/kyc/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pan",
    "documentNumber": "WXYZ5678K",
    "personalInfo": {"fullName": "Streamer User", "phone": "9876543210"}
  }'

# 3. Request withdrawal
curl -X POST "http://localhost:3000/api/wallet/withdraw" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "bankAccount": "9876543210",
    "ifscCode": "ICICI000456",
    "accountHolderName": "Streamer User"
  }'

# 4. Check updated balance
curl -X GET "http://localhost:3000/api/wallet/balance"
```

### Scenario 3: Error Handling Tests

```bash
# Test insufficient balance withdrawal
curl -X POST "http://localhost:3000/api/wallet/withdraw" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 999999,
    "bankAccount": "1234567890",
    "ifscCode": "HDFC0000123",
    "accountHolderName": "Test User"
  }'

# Test invalid UPI ID
curl -X POST "http://localhost:3000/api/payments/upi" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "upiId": "invalid-upi-id",
    "metadata": {"test": "invalid"}
  }'

# Test negative amount
curl -X POST "http://localhost:3000/api/payments/create-intent" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": -1000,
    "currency": "inr",
    "paymentMethod": "card"
  }'
```

## Expected Mock Responses

### Successful Payment Intent:
- `clientSecret`: Mock string starting with "pi_mock_"
- `paymentIntentId`: Mock payment intent ID
- `amount`: Requested amount
- `currency`: "inr"

### Successful UPI Payment:
- `success`: true (90% of time)
- `transactionId`: "UPI_" + timestamp + random
- `status`: "completed" or "failed"
- `upiRef`: Reference number if successful

### Successful Withdrawal:
- `transactionId`: Generated transaction ID
- `status`: "pending"
- `amount`: Requested amount
- `estimatedProcessingTime`: "2-3 business days"

### KYC Submission:
- `status`: "submitted"
- `submittedAt`: Current timestamp
- `withdrawalLimit`: Increased limit

## Verification Steps

After each test:
1. ✅ Check HTTP status code (200/201 for success)
2. ✅ Verify response structure matches expected format
3. ✅ Check that balance updates are logical
4. ✅ Confirm transaction history shows new entries
5. ✅ Validate error messages for invalid inputs

## Common Issues & Troubleshooting

### Issue: "Cannot find module"
- **Solution**: Make sure you're in the correct directory and dependencies are installed

### Issue: "Connection refused"
- **Solution**: Ensure development server is running on localhost:3000

### Issue: "Unauthorized" errors
- **Solution**: Check if authentication middleware is properly configured

### Issue: Mock payments not working
- **Solution**: Verify PaymentService is in mock mode (no STRIPE_SECRET_KEY set)

## Automated Testing

Run the automated test script:
```bash
cd backend/test
node test-payment-system.js
```

This will execute all test cases automatically and generate a detailed report.

## Next Steps

1. **Load Testing**: Use tools like Apache Bench or Artillery to test under load
2. **Integration Testing**: Test with real frontend components
3. **Database Testing**: Verify data persistence and consistency
4. **Security Testing**: Test authentication and authorization
5. **Performance Testing**: Monitor response times and memory usage

The mock payment system allows you to test all functionality without needing real payment gateway credentials!

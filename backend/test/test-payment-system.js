#!/usr/bin/env node

/**
 * Automated Test Script for Payment & Earnings System
 * Run with: node test-payment-system.js
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const LOG_FILE = 'test-results.log';

// Test configuration
const config = {
  baseUrl: BASE_URL,
  timeout: 10000,
  testUsers: {
    brand: {
      email: 'testbrand@example.com',
      password: 'password123',
      name: 'Test Brand User',
      role: 'brand'
    },
    streamer: {
      email: 'teststreamer@example.com', 
      password: 'password123',
      name: 'Test Streamer User',
      role: 'streamer'
    },
    admin: {
      email: 'testadmin@example.com',
      password: 'password123',
      name: 'Test Admin User',
      role: 'admin'
    }
  }
};

// Test state
let testState = {
  tokens: {},
  paymentIntentId: null,
  withdrawalId: null,
  errors: [],
  results: []
};

// Utility functions
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${isError ? 'ERROR' : 'INFO'}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
  
  if (isError) {
    testState.errors.push(message);
  }
}

function logResult(testName, success, details = '') {
  const result = { testName, success, details, timestamp: new Date().toISOString() };
  testState.results.push(result);
  log(`${testName}: ${success ? '✅ PASS' : '❌ FAIL'} ${details}`);
}

async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios({
      method,
      url: `${config.baseUrl}${endpoint}`,
      data,
      headers,
      timeout: config.timeout
    });

    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testWalletBalance(userType) {
  const token = testState.tokens[userType];
  const result = await apiCall('GET', '/api/wallet/balance', null, token);
  
  if (result.success) {
    logResult(`Get ${userType} wallet balance`, true, `Balance: ₹${result.data.balance}`);
    return result.data;
  } else {
    logResult(`Get ${userType} wallet balance`, false, result.error);
    return null;
  }
}

async function testPaymentIntent(amount = 10000) {
  const token = testState.tokens.brand;
  const paymentData = {
    amount,
    currency: 'inr',
    paymentMethod: 'card',
    metadata: { purpose: 'test_topup' }
  };

  const result = await apiCall('POST', '/api/payments/create-intent', paymentData, token);
  
  if (result.success) {
    testState.paymentIntentId = result.data.paymentIntentId;
    logResult('Create payment intent', true, `Intent ID: ${result.data.paymentIntentId}`);
    return result.data;
  } else {
    logResult('Create payment intent', false, result.error);
    return null;
  }
}

async function testUPIPayment(amount = 2000) {
  const token = testState.tokens.brand;
  const upiData = {
    amount,
    upiId: 'testuser@paytm',
    metadata: { purpose: 'test_upi' }
  };

  const result = await apiCall('POST', '/api/payments/upi', upiData, token);
  
  if (result.success) {
    logResult('Process UPI payment', true, `Success: ${result.data.success}, TxnID: ${result.data.transactionId}`);
    return result.data;
  } else {
    logResult('Process UPI payment', false, result.error);
    return null;
  }
}

async function testWithdrawalRequest(amount = 1000) {
  const token = testState.tokens.streamer;
  const withdrawalData = {
    amount,
    bankAccount: '1234567890',
    ifscCode: 'HDFC0000123',
    accountHolderName: 'Test Streamer',
    notes: 'Automated test withdrawal'
  };

  const result = await apiCall('POST', '/api/wallet/withdraw', withdrawalData, token);
  
  if (result.success) {
    testState.withdrawalId = result.data.transactionId;
    logResult('Create withdrawal request', true, `Request ID: ${result.data.transactionId}`);
    return result.data;
  } else {
    logResult('Create withdrawal request', false, result.error);
    return null;
  }
}

async function testKYCSubmission() {
  const token = testState.tokens.streamer;
  const kycData = {
    documentType: 'pan',
    documentNumber: 'ABCDE1234F',
    personalInfo: {
      fullName: 'Test Streamer',
      dateOfBirth: '1990-01-01',
      address: '123 Test Street, Test City',
      phone: '9876543210',
      nationality: 'Indian'
    },
    bankDetails: {
      accountNumber: '1234567890',
      ifscCode: 'HDFC0000123',
      accountHolderName: 'Test Streamer',
      bankName: 'HDFC Bank'
    }
  };

  const result = await apiCall('POST', '/api/kyc/submit', kycData, token);
  
  if (result.success) {
    logResult('Submit KYC documents', true, `Status: ${result.data.status}`);
    return result.data;
  } else {
    logResult('Submit KYC documents', false, result.error);
    return null;
  }
}

async function testAdminFinanceOverview() {
  const token = testState.tokens.admin;
  const result = await apiCall('GET', '/api/admin/finance/overview', null, token);
  
  if (result.success) {
    logResult('Get admin finance overview', true, `Revenue: ₹${result.data.totalRevenue || 0}`);
    return result.data;
  } else {
    logResult('Get admin finance overview', false, result.error);
    return null;
  }
}

async function testTransactionHistory(userType) {
  const token = testState.tokens[userType];
  const result = await apiCall('GET', '/api/wallet/transactions?limit=5', null, token);
  
  if (result.success) {
    logResult(`Get ${userType} transaction history`, true, `Count: ${result.data.transactions?.length || 0}`);
    return result.data;
  } else {
    logResult(`Get ${userType} transaction history`, false, result.error);
    return null;
  }
}

// Authentication helper - simulate login
async function simulateLogin(userType) {
  // For this test, we'll simulate successful authentication
  // In a real scenario, you'd call the actual login endpoint
  const mockToken = `mock_${userType}_token_${Date.now()}`;
  testState.tokens[userType] = mockToken;
  logResult(`Login ${userType} user`, true, 'Mock authentication successful');
  return mockToken;
}

// Main test execution
async function runTests() {
  console.clear();
  log('Starting Payment & Earnings System Tests...');
  log('='.repeat(60));

  // Clear previous log
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
  }

  try {
    // Step 1: Authentication
    log('\n📝 Step 1: User Authentication');
    await simulateLogin('brand');
    await simulateLogin('streamer');
    await simulateLogin('admin');

    // Step 2: Wallet Balance Checks
    log('\n💰 Step 2: Wallet Balance Checks');
    await testWalletBalance('brand');
    await testWalletBalance('streamer');

    // Step 3: Payment Operations
    log('\n💳 Step 3: Payment Operations');
    await testPaymentIntent(10000);
    await testUPIPayment(2000);

    // Step 4: Transaction History
    log('\n📊 Step 4: Transaction History');
    await testTransactionHistory('brand');
    await testTransactionHistory('streamer');

    // Step 5: KYC Operations
    log('\n📋 Step 5: KYC Operations');
    await testKYCSubmission();

    // Step 6: Withdrawal Operations
    log('\n💸 Step 6: Withdrawal Operations');
    await testWithdrawalRequest(1000);

    // Step 7: Admin Operations
    log('\n👨‍💼 Step 7: Admin Operations');
    await testAdminFinanceOverview();

    // Summary
    log('\n' + '='.repeat(60));
    log('TEST SUMMARY');
    log('='.repeat(60));
    
    const totalTests = testState.results.length;
    const passedTests = testState.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    log(`Total Tests: ${totalTests}`);
    log(`Passed: ${passedTests} ✅`);
    log(`Failed: ${failedTests} ❌`);
    log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

    if (testState.errors.length > 0) {
      log('\nErrors encountered:');
      testState.errors.forEach((error, index) => {
        log(`${index + 1}. ${error}`, true);
      });
    }

    // Save detailed results
    const detailedResults = {
      summary: {
        totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100
      },
      results: testState.results,
      errors: testState.errors,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('test-results.json', JSON.stringify(detailedResults, null, 2));
    log('\nDetailed results saved to test-results.json');

  } catch (error) {
    log(`Fatal error during test execution: ${error.message}`, true);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, true);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at ${promise}: ${reason}`, true);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(() => {
    log('\nTest execution completed!');
    process.exit(testState.errors.length > 0 ? 1 : 0);
  });
}

module.exports = { runTests, testState, config };

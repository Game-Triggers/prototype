/**
 * Campaign Completion API Test Client
 * 
 * Quick test script to verify the manual trigger endpoints work correctly.
 * Run with: node test-completion-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Configure these with your actual values
const CONFIG = {
  // Replace with your actual JWT tokens
  ADMIN_TOKEN: 'your-admin-jwt-token-here',
  BRAND_TOKEN: 'your-brand-jwt-token-here',
  CAMPAIGN_ID: 'your-campaign-id-here', // The one with 1001 impressions
};

class CampaignCompletionTester {
  constructor() {
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async testGlobalCompletionCheck() {
    console.log('🔄 Testing Global Completion Check (Admin only)...');
    try {
      const response = await this.axios.post('/campaigns/completion-check/trigger', {}, {
        headers: { Authorization: `Bearer ${CONFIG.ADMIN_TOKEN}` }
      });
      
      console.log('✅ Global completion check succeeded:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('❌ Global completion check failed:');
      console.error(error.response?.data || error.message);
      return null;
    }
  }

  async testSpecificCampaignCheck(campaignId) {
    console.log(`🔄 Testing specific campaign check: ${campaignId}...`);
    try {
      const response = await this.axios.post(`/campaigns/${campaignId}/completion-check`, {}, {
        headers: { Authorization: `Bearer ${CONFIG.BRAND_TOKEN}` }
      });
      
      console.log('✅ Specific campaign check succeeded:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('❌ Specific campaign check failed:');
      console.error(error.response?.data || error.message);
      return null;
    }
  }

  async testGetCompletionStatus(campaignId) {
    console.log(`🔄 Testing completion status check: ${campaignId}...`);
    try {
      const response = await this.axios.get(`/campaigns/${campaignId}/completion-status`, {
        headers: { Authorization: `Bearer ${CONFIG.BRAND_TOKEN}` }
      });
      
      console.log('✅ Completion status check succeeded:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('❌ Completion status check failed:');
      console.error(error.response?.data || error.message);
      return null;
    }
  }

  async testServerHealth() {
    console.log('🔄 Testing server health...');
    try {
      const response = await axios.get(`${BASE_URL.replace('/api/v1', '')}/api/v1`);
      console.log('✅ Server is running and accessible');
      return true;
    } catch (error) {
      console.error('❌ Server health check failed:');
      console.error(error.message);
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Starting Campaign Completion API Tests...\n');

    // Check server health first
    const serverHealthy = await this.testServerHealth();
    if (!serverHealthy) {
      console.log('❌ Server is not accessible. Make sure it\'s running on localhost:3001');
      return;
    }

    console.log('\n' + '='.repeat(50));

    // Test 1: Get completion status
    if (CONFIG.CAMPAIGN_ID !== 'your-campaign-id-here') {
      await this.testGetCompletionStatus(CONFIG.CAMPAIGN_ID);
      console.log('\n' + '='.repeat(50));
    } else {
      console.log('⚠️  Skipping specific campaign tests - please set CONFIG.CAMPAIGN_ID');
    }

    // Test 2: Check specific campaign
    if (CONFIG.CAMPAIGN_ID !== 'your-campaign-id-here' && CONFIG.BRAND_TOKEN !== 'your-brand-jwt-token-here') {
      await this.testSpecificCampaignCheck(CONFIG.CAMPAIGN_ID);
      console.log('\n' + '='.repeat(50));
    } else {
      console.log('⚠️  Skipping specific campaign completion check - please set CONFIG.BRAND_TOKEN and CONFIG.CAMPAIGN_ID');
    }

    // Test 3: Global completion check (admin only)
    if (CONFIG.ADMIN_TOKEN !== 'your-admin-jwt-token-here') {
      await this.testGlobalCompletionCheck();
    } else {
      console.log('⚠️  Skipping global completion check - please set CONFIG.ADMIN_TOKEN');
    }

    console.log('\n🎉 Testing completed!');
    console.log('\n📝 Configuration needed:');
    console.log('1. Set CONFIG.ADMIN_TOKEN with your admin JWT token');
    console.log('2. Set CONFIG.BRAND_TOKEN with your brand JWT token');
    console.log('3. Set CONFIG.CAMPAIGN_ID with your campaign ID (the one with 1001 impressions)');
  }
}

// Example usage without configuration (just server health check)
async function quickTest() {
  const tester = new CampaignCompletionTester();
  
  console.log('🏃‍♂️ Quick test - checking if server is running...');
  const serverHealthy = await tester.testServerHealth();
  
  if (serverHealthy) {
    console.log('\n✅ Server is running! You can now:');
    console.log('1. Configure the tokens and campaign ID in this file');
    console.log('2. Run: node test-completion-api.js');
    console.log('3. Or use the cURL examples from the documentation');
  }
}

// Run the test
if (require.main === module) {
  // Check if configuration is provided
  const hasConfig = CONFIG.ADMIN_TOKEN !== 'your-admin-jwt-token-here' || 
                   CONFIG.BRAND_TOKEN !== 'your-brand-jwt-token-here' ||
                   CONFIG.CAMPAIGN_ID !== 'your-campaign-id-here';

  if (hasConfig) {
    const tester = new CampaignCompletionTester();
    tester.runFullTest().catch(console.error);
  } else {
    quickTest().catch(console.error);
  }
}

module.exports = CampaignCompletionTester;

const { Logger } = require('@nestjs/common');

// Simple test to verify service instantiation without NestJS DI
class MockCampaignCompletionService {
  constructor() {
    this.logger = new Logger('MockCampaignCompletionService');
    this.logger.debug('=== MockCampaignCompletionService constructed successfully ===');
  }

  async checkAllCampaignsForCompletion() {
    this.logger.debug('=== ENTERING checkAllCampaignsForCompletion METHOD ===');
    return 'Mock completion check executed';
  }
}

class MockCampaignCompletionTaskService {
  constructor() {
    this.logger = new Logger('MockCampaignCompletionTaskService');
    this.campaignCompletionService = new MockCampaignCompletionService();
    this.logger.debug('=== MockCampaignCompletionTaskService constructed successfully ===');
  }

  async onModuleInit() {
    this.logger.debug('=== MockCampaignCompletionTaskService onModuleInit called ===');
  }

  async handleCron() {
    this.logger.debug('=== ENTERING handleCron METHOD ===');
    try {
      const result = await this.campaignCompletionService.checkAllCampaignsForCompletion();
      this.logger.debug('Completion check result:', result);
    } catch (error) {
      this.logger.error('Error during scheduled check:', error);
    }
  }

  async triggerManualCheck() {
    this.logger.debug('=== Manual check triggered ===');
    return { success: true, message: 'Manual check completed' };
  }
}

// Test the services
async function testServices() {
  console.log('Starting service instantiation test...');
  
  const taskService = new MockCampaignCompletionTaskService();
  await taskService.onModuleInit();
  await taskService.handleCron();
  
  const result = await taskService.triggerManualCheck();
  console.log('Test result:', result);
  
  console.log('Service instantiation test completed successfully!');
}

testServices().catch(console.error);

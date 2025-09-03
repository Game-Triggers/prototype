#!/usr/bin/env node

/**
 * Test script to create sample notifications
 * Run with: node test-notifications.js
 */

async function createTestNotifications() {
  const baseUrl = 'http://localhost:3001/notifications';
  
  // Sample user ID - you'll need to replace this with a real user ID from your database
  // Get user ID from environment variable
  const testUserId = process.env.TEST_USER_ID;
  if (!testUserId) {
    console.error('Error: Please set the TEST_USER_ID environment variable.');
    process.exit(1);
  }
  
  // Sample notifications to create
  const notifications = [
    {
      userId: testUserId,
      title: 'Welcome to the Platform!',
      message: 'Thank you for joining our platform. Get started by exploring campaigns.',
      type: 'system',
      priority: 'medium',
      actionUrl: '/dashboard/campaigns'
    },
    {
      userId: testUserId,
      title: 'New Campaign Available',
      message: 'A new gaming campaign is now available that matches your profile.',
      type: 'campaign',
      priority: 'high',
      actionUrl: '/dashboard/campaigns/browse'
    },
    {
      userId: testUserId,
      title: 'Earnings Credited',
      message: 'You have earned ₹250 from completing campaign milestones.',
      type: 'earnings',
      priority: 'medium',
      actionUrl: '/dashboard/wallet',
      data: { amount: 250 }
    },
    {
      userId: testUserId,
      title: 'Withdrawal Request Approved',
      message: 'Your withdrawal request of ₹1,000 has been approved and is being processed.',
      type: 'withdrawal',
      priority: 'high',
      actionUrl: '/dashboard/wallet',
      data: { amount: 1000 }
    },
    {
      userId: testUserId,
      title: 'Low Campaign Budget Warning',
      message: 'Your campaign budget is running low. Only ₹500 remaining.',
      type: 'campaign',
      priority: 'urgent',
      actionUrl: '/dashboard/campaigns/my-campaigns',
      data: { remainingBudget: 500 }
    }
  ];

  console.log('Creating test notifications...');
  
  for (const notification of notifications) {
    try {
      const response = await fetch(`${baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real scenario, you'd need proper authentication headers
        },
        body: JSON.stringify(notification)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✓ Created notification:', notification.title);
      } else {
        console.error('✗ Failed to create notification:', notification.title, response.status);
      }
    } catch (error) {
      console.error('✗ Error creating notification:', notification.title, error.message);
    }
  }
  
  console.log('Test notifications creation completed.');
}

// Run the test
if (require.main === module) {
  createTestNotifications();
}

import jwt from 'jsonwebtoken';

// Test script to verify G-Key locking mechanism through Next.js API routes
async function testGKeyLocking() {
  const baseUrl = 'http://localhost:3000/api';
  
  // Create a test JWT token for the streamer user
  const tokenPayload = {
    sub: "68ad751fc9fd409f425b04fc",
    email: "trainee01@gametriggers.com",
    hasUser: false
  };
  
  // Use the actual JWT secret from backend/.env
  const token = jwt.sign(tokenPayload, 'your_secure_nextauth_secret_here_12345678901234567890');
  
  console.log('🔍 Testing G-Key Locking Mechanism through Next.js API...\n');
  
  try {
    // Step 1: Get initial G-Keys status
    console.log('📋 Step 1: Getting initial G-Keys status...');
    let response = await fetch(`${baseUrl}/g-keys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed to fetch G-Keys: ${response.status} ${response.statusText}`);
      console.log('Error details:', errorText);
      return;
    }
    
    let gKeys = await response.json();
    console.log('✅ Initial G-Keys retrieved:', gKeys.length, 'keys found');
    
    // Find an available key
    const availableKey = gKeys.find(key => key.status === 'available');
    if (!availableKey) {
      console.log('❌ No available keys found.');
      console.log('Current key statuses:', gKeys.map(k => `${k.category}: ${k.status}`));
      return;
    }
    
    console.log(`🔑 Found available key: ${availableKey.category} (${availableKey.status})`);
    
    // Step 2: Get available campaigns
    console.log('\n📋 Step 2: Getting available campaigns...');
    response = await fetch(`${baseUrl}/campaigns/streamer/available`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed to fetch campaigns: ${response.status} ${response.statusText}`);
      console.log('Error details:', errorText);
      return;
    }
    
    const campaigns = await response.json();
    console.log('✅ Available campaigns retrieved:', campaigns.length, 'campaigns found');
    
    if (campaigns.length === 0) {
      console.log('❌ No campaigns available for testing');
      return;
    }
    
    // Find a campaign that matches our available key category
    const matchingCampaign = campaigns.find(campaign => 
      campaign.targetCategories && campaign.targetCategories.includes(availableKey.category)
    );
    
    if (!matchingCampaign) {
      console.log(`❌ No campaigns found matching category: ${availableKey.category}`);
      console.log('Available campaign categories:', 
        campaigns.map(c => c.targetCategories).filter(Boolean).flat()
      );
      
      // Let's try with any campaign to test the mechanism
      const anyCampaign = campaigns[0];
      if (anyCampaign.targetCategories && anyCampaign.targetCategories.length > 0) {
        const targetCategory = anyCampaign.targetCategories[0];
        const keyForCategory = gKeys.find(k => k.category === targetCategory && k.status === 'available');
        if (keyForCategory) {
          console.log(`🔄 Using campaign: ${anyCampaign.title} (${targetCategory}) instead`);
          return testWithSpecificCampaign(anyCampaign, keyForCategory, baseUrl, token);
        }
      }
      return;
    }
    
    return testWithSpecificCampaign(matchingCampaign, availableKey, baseUrl, token);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

async function testWithSpecificCampaign(campaign, gKey, baseUrl, token) {
  console.log(`🎯 Found matching campaign: ${campaign.title} (${campaign.targetCategories.join(', ')})`);
  
  // Step 3: Join the campaign (this should lock the G-Key)
  console.log('\n📋 Step 3: Joining campaign to test G-Key locking...');
  let response = await fetch(`${baseUrl}/campaigns/${campaign._id}/join`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Failed to join campaign: ${response.status} ${response.statusText}`);
    console.log('Error details:', errorText);
    return;
  }
  
  const joinResult = await response.json();
  console.log('✅ Successfully joined campaign:', joinResult.message || 'Joined');
  
  // Step 4: Check G-Keys status after joining
  console.log('\n📋 Step 4: Checking G-Keys status after joining campaign...');
  response = await fetch(`${baseUrl}/g-keys`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Failed to fetch G-Keys after join: ${response.status} ${response.statusText}`);
    console.log('Error details:', errorText);
    return;
  }
  
  const updatedGKeys = await response.json();
  const lockedKey = updatedGKeys.find(key => key.category === gKey.category);
  
  if (!lockedKey) {
    console.log('❌ Key not found after campaign join');
    return;
  }
  
  console.log(`🔒 Key status after join: ${lockedKey.category} -> ${lockedKey.status}`);
  if (lockedKey.status === 'locked') {
    console.log(`✅ SUCCESS: Key is properly locked!`);
    console.log(`   Locked with campaign: ${lockedKey.lockedWith}`);
    console.log(`   Locked at: ${lockedKey.lockedAt}`);
  } else {
    console.log(`❌ FAILURE: Key status is ${lockedKey.status}, expected 'locked'`);
  }
  
  console.log('\n G-Key locking test completed!');
}

// Run the test
testGKeyLocking().catch(console.error);

#!/usr/bin/env node

const http = require('http');

function testCampaignActivation() {
  const data = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/campaigns/68a5b4f9e13510d9873b575d/activate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = http.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    console.log(`headers:`, res.headers);

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Response:', responseData);
      
      // Check the campaign status in database after API call
      checkCampaignStatus();
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(data);
  req.end();
}

function checkCampaignStatus() {
  setTimeout(() => {
    const { MongoClient } = require('mongodb');
    
    const client = new MongoClient('mongodb://localhost:27017/gametriggers');
    client.connect().then(async () => {
      try {
        const db = client.db('gametriggers');
        const campaigns = db.collection('campaigns');
        
        const campaign = await campaigns.findOne({ _id: require('mongodb').ObjectId('68a5b4f9e13510d9873b575d') });
        console.log('\nCampaign after activation attempt:');
        console.log('Status:', campaign?.status);
        console.log('submittedForReviewAt:', campaign?.submittedForReviewAt);
        
      } catch (error) {
        console.error('DB check error:', error);
      } finally {
        await client.close();
      }
    });
  }, 1000);
}

console.log('Testing campaign activation endpoint...');
testCampaignActivation();

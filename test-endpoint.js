#!/usr/bin/env node

/**
 * Test script for the /api/collect endpoint
 * Usage: node test-endpoint.js <endpoint-url> <auth-token>
 */

const endpoint = process.argv[2] || 'http://localhost:8788/api/collect';
const token = process.argv[3] || 'your-token-here';

const testData = {
  request_details: {
    client_ip: '127.0.0.1',
    user_agent: 'Test-Script/1.0'
  },
  payload: {
    source: 'test-script',
    summary: 'Testing the endpoint',
    data: {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a test payload'
    }
  }
};

async function testEndpoint() {
  try {
    console.log('Testing endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);

    if (response.ok) {
      console.log('✅ Test passed!');
    } else {
      console.log('❌ Test failed!');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testEndpoint();

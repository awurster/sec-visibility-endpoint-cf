#!/usr/bin/env node

/**
 * Production test script for /api/collect endpoint
 * Usage: node test-prod.js
 * 
 * Reads from environment variables:
 * - AUTH_TOKEN: Your authentication token
 * - HOSTNAME: Your Cloudflare Pages hostname (without .pages.dev)
 * - Or set FULL_URL to override the complete endpoint URL
 */

// Load environment variables from .env if available
import { readFileSync } from 'fs';
try {
    const envFile = readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key]) {
            process.env[key] = value.trim();
        }
    });
} catch (e) {
    // .env file doesn't exist, that's fine
}

const token = process.env.AUTH_TOKEN || process.argv[2] || 'YOUR_AUTH_TOKEN_HERE';
const hostname = process.env.HOSTNAME || 'sec-visibility-endpoint-cf.iasw';
const PROD_URL = process.env.FULL_URL || `https://${hostname}.workers.dev/api/collect`;

const testData = {
    request_details: {
        client_ip: '1.3.2.4',
        user_agent: 'Mozilla/5.0 (Production Test)',
        timestamp: new Date().toISOString()
    },
    payload: {
        source: 'production-test',
        summary: 'Testing production endpoint functionality',
        data: {
            test_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: 'Production endpoint verification',
            environment: 'prod'
        }
    }
};

async function testProdEndpoint() {
    console.log('🚀 Testing production endpoint...');
    console.log('URL:', PROD_URL);
    console.log('Hostname:', hostname);
    console.log('Token:', token.length > 8 ? token.substring(0, 8) + '...' : '[NOT SET]');
    console.log('Using env file:', process.env.AUTH_TOKEN ? '✅' : '❌');
    console.log('');

    try {
        const response = await fetch(PROD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Production-Test-Script/1.0'
            },
            body: JSON.stringify(testData)
        });

        console.log('📊 Response Details:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Response Body:', responseText);
        console.log('');

        if (response.status === 200) {
            console.log('✅ SUCCESS: Production endpoint is working!');
        } else if (response.status === 401 || response.status === 403) {
            console.log('🔐 AUTH ISSUE: Check your AUTH_TOKEN');
        } else if (response.status === 404) {
            console.log('❌ NOT FOUND: Check the endpoint URL');
        } else {
            console.log('❌ FAILED: Unexpected response');
        }

    } catch (error) {
        console.error('💥 ERROR:', error.message);

        if (error.message.includes('fetch')) {
            console.log('🔗 Check if the URL is accessible');
        }
    }
}

// Also test alternative URL patterns
async function testAlternativeURLs() {
    const alternativeURLs = [
        `https://${hostname}.workers.dev/api/collect`,
        `https://${hostname}.pages.dev/api/collect`
    ];

    console.log('\n🔄 Testing alternative URL patterns:');

    for (const testURL of alternativeURLs) {
        console.log(`\nTesting: ${testURL}`);
        try {
            const response = await fetch(testURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            console.log('Status:', response.status);
            const responseText = await response.text();
            console.log('Response:', responseText);

            if (response.status === 200) {
                console.log('✅ THIS URL WORKS!');
                return testURL; // Return the working URL
            }

        } catch (error) {
            console.log('❌ Failed:', error.message);
        }
    }
    return null;
}

console.log('🛡️ Production Endpoint Test');
console.log('==========================');

testProdEndpoint().then(() => testAlternativeURLs()); 
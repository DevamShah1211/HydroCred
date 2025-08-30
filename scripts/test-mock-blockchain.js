#!/usr/bin/env node

/**
 * Test script for the mock blockchain system
 * Run with: node scripts/test-mock-blockchain.js
 */

const BASE_URL = 'http://localhost:5055';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`✅ ${method} ${endpoint}:`, response.status);
    if (data.success) {
      console.log(`   Response:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`   Error:`, data.error);
    }

    return { success: response.ok, data };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Mock Blockchain System\n');

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  await testEndpoint('/api/health');
  console.log('');

  // Test 2: Get initial mock data
  console.log('2. Testing mock data endpoint...');
  await testEndpoint('/api/mock/data');
  console.log('');

  // Test 3: Issue credits
  console.log('3. Testing credit issuance...');
  const issueResult = await testEndpoint('/api/mock/issue', 'POST', {
    to: '0x2345678901234567890123456789012345678901',
    amount: 100,
    issuedBy: '0x1234567890123456789012345678901234567890'
  });
  console.log('');

  // Test 4: Get ledger data
  console.log('4. Testing ledger endpoint...');
  await testEndpoint('/api/ledger');
  console.log('');

  // Test 5: Transfer credits
  if (issueResult.success) {
    console.log('5. Testing credit transfer...');
    await testEndpoint('/api/mock/transfer', 'POST', {
      from: '0x2345678901234567890123456789012345678901',
      to: '0x3456789012345678901234567890123456789012',
      tokenId: 1
    });
    console.log('');
  }

  // Test 6: Retire credits
  console.log('6. Testing credit retirement...');
  await testEndpoint('/api/mock/retire', 'POST', {
    tokenId: 1,
    retiredBy: '0x3456789012345678901234567890123456789012'
  });
  console.log('');

  // Test 7: Get owned tokens
  console.log('7. Testing owned tokens endpoint...');
  await testEndpoint('/api/mock/tokens/0x2345678901234567890123456789012345678901');
  console.log('');

  // Test 8: Check roles
  console.log('8. Testing role checking...');
  await testEndpoint('/api/mock/role/certifier/0x1234567890123456789012345678901234567890');
  await testEndpoint('/api/mock/role/admin/0x1234567890123456789012345678901234567890');
  console.log('');

  // Test 9: Add new certifier
  console.log('9. Testing add certifier...');
  await testEndpoint('/api/mock/add-certifier', 'POST', {
    address: '0x5678901234567890123456789012345678901234'
  });
  console.log('');

  // Test 10: Get updated mock data
  console.log('10. Testing updated mock data...');
  await testEndpoint('/api/mock/data');
  console.log('');

  // Test 11: Reset blockchain
  console.log('11. Testing blockchain reset...');
  await testEndpoint('/api/mock/reset', 'POST');
  console.log('');

  // Test 12: Verify reset
  console.log('12. Verifying reset...');
  await testEndpoint('/api/mock/data');
  console.log('');

  console.log('🎉 All tests completed!');
  console.log('\n💡 To test the frontend:');
  console.log('   1. Start the app: npm run dev');
  console.log('   2. Open: http://localhost:5173');
  console.log('   3. Use the mock wallet switcher (bottom-right)');
  console.log('   4. Test different roles and transactions');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ for fetch support');
  console.log('   Please upgrade Node.js or use a polyfill');
  process.exit(1);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('🚀 Server is running, starting tests...\n');
      await runTests();
    } else {
      console.log('❌ Server responded but health check failed');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Server is not running');
    console.log('   Please start the backend with: npm run dev');
    console.log('   Or start just the backend: npm -w backend run dev');
    process.exit(1);
  }
}

checkServer().catch(console.error);
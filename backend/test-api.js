const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data with unique email
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: `testuser${Date.now()}`,
  full_name: 'Test User'
};

let authToken = null;

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
const testHealth = async () => {
  console.log('🔍 Testing health endpoint...');
  const result = await makeAuthRequest('GET', '/health');
  console.log(result.success ? '✅ Health check passed' : '❌ Health check failed');
  return result.success;
};

const testRegistration = async () => {
  console.log('🔍 Testing user registration...');
  const result = await makeAuthRequest('POST', '/auth/register', testUser);
  if (result.success) {
    console.log('✅ Registration successful');
    return true;
  } else {
    console.log('❌ Registration failed:', result.error);
    return false;
  }
};

const testLogin = async () => {
  console.log('🔍 Testing user login...');
  const result = await makeAuthRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Login successful, token received');
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
};

const testGetSessions = async () => {
  console.log('🔍 Testing get sessions...');
  const result = await makeAuthRequest('GET', '/sessions');
  if (result.success) {
    console.log(`✅ Retrieved ${result.data.sessions?.length || 0} sessions`);
    return true;
  } else {
    console.log('❌ Get sessions failed:', result.error);
    return false;
  }
};

const testGetUsers = async () => {
  console.log('🔍 Testing get users...');
  const result = await makeAuthRequest('GET', '/users');
  if (result.success) {
    console.log(`✅ Retrieved ${result.data.length} users`);
    return true;
  } else {
    console.log('❌ Get users failed:', result.error);
    return false;
  }
};

const testGetStats = async () => {
  console.log('🔍 Testing get statistics...');
  const result = await makeAuthRequest('GET', '/stats');
  if (result.success) {
    console.log('✅ Statistics retrieved successfully');
    return true;
  } else {
    console.log('❌ Get stats failed:', result.error);
    return false;
  }
};

const testSearch = async () => {
  console.log('🔍 Testing search functionality...');
  const result = await makeAuthRequest('GET', '/search?q=music');
  if (result.success) {
    console.log('✅ Search functionality working');
    return true;
  } else {
    console.log('❌ Search failed:', result.error);
    return false;
  }
};

const testNotifications = async () => {
  console.log('🔍 Testing notifications...');
  const result = await makeAuthRequest('GET', '/notifications');
  if (result.success) {
    console.log(`✅ Retrieved ${result.data.length} notifications`);
    return true;
  } else {
    console.log('❌ Get notifications failed:', result.error);
    return false;
  }
};

const testAnalytics = async () => {
  console.log('🔍 Testing analytics endpoint...');
  const result = await makeAuthRequest('GET', '/analytics');
  if (result.success) {
    console.log('✅ Analytics data retrieved successfully');
    console.log(`📊 Analytics data:`, JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Analytics failed:', result.error);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'User Registration', fn: testRegistration },
    { name: 'User Login', fn: testLogin },
    { name: 'Get Sessions', fn: testGetSessions },
    { name: 'Get Users', fn: testGetUsers },
    { name: 'Get Statistics', fn: testGetStats },
    { name: 'Search', fn: testSearch },
    { name: 'Get Notifications', fn: testNotifications },
    { name: 'Analytics', fn: testAnalytics }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}`);
    const success = await test.fn();
    if (success) passed++;
    console.log('─'.repeat(50));
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! API is ready for frontend integration.');
  } else {
    console.log('⚠️  Some tests failed. Please check the backend server and database.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 
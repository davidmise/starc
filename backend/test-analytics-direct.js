const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

async function testAnalyticsDirect() {
  try {
    console.log('🔍 Testing analytics endpoint directly...');
    
    // Login to get token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Got token:', token.substring(0, 20) + '...');
    
    // Test analytics dashboard
    const dashboardResponse = await axios.get(`${BASE_URL}/analytics/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Dashboard response status:', dashboardResponse.status);
    console.log('📊 Dashboard data:', JSON.stringify(dashboardResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  } finally {
    process.exit(0);
  }
}

testAnalyticsDirect(); 
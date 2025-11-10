const axios = require('axios');

const API_BASE_URL = 'http://192.168.81.194:5000/api';

async function testConnection() {
  console.log('🔍 Testing API connection...');
  console.log('📍 Testing URL:', API_BASE_URL);
  
  try {
    // Test basic connectivity
    console.log('\n1. Testing basic connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000
    });
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test sessions endpoint
    console.log('\n2. Testing sessions endpoint...');
    const sessionsResponse = await axios.get(`${API_BASE_URL}/sessions`, {
      timeout: 5000
    });
    console.log('✅ Sessions endpoint working:', sessionsResponse.data.sessions?.length || 0, 'sessions');
    
    // Test registration
    console.log('\n3. Testing user registration...');
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Registration working:', registerResponse.data.message);
    
    // Test login
    console.log('\n4. Testing user login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Login working, token received');
    
    // Test with auth token
    console.log('\n5. Testing authenticated requests...');
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Authenticated request working:', profileResponse.data.user.username);
    
    console.log('\n🎉 All API tests passed! Frontend should be able to connect.');
    console.log('📱 React Native app should now work with the backend.');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused. Make sure the backend is running on port 5000.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ Host not found. Check the IP address.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Request timed out. Check network connectivity.');
    }
  }
}

testConnection(); 
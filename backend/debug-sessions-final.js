const axios = require('axios');

const debugSessions = async () => {
  try {
    console.log('🔍 Testing sessions endpoint...');
    
    // Test with authentication
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Got authentication token');
    
    // Test sessions endpoint with auth
    const sessionsResponse = await axios.get('http://localhost:5000/api/sessions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Sessions endpoint works with auth');
    console.log('Sessions count:', sessionsResponse.data.sessions?.length || 0);
    
  } catch (error) {
    console.error('❌ Sessions endpoint failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
};

debugSessions(); 
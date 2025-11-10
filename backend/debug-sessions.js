const axios = require('axios');

const testSessions = async () => {
  try {
    console.log('Testing sessions endpoint...');
    
    // First, get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');
    
    // Test sessions endpoint
    const sessionsResponse = await axios.get('http://localhost:5000/api/sessions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Sessions response:', sessionsResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testSessions(); 
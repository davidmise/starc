const axios = require('axios');

const testSimpleSessions = async () => {
  try {
    console.log('Testing simple sessions endpoint...');
    
    // Test without authentication first
    const response = await axios.get('http://localhost:5000/api/sessions');
    console.log('✅ Sessions endpoint works without auth');
    console.log('Sessions count:', response.data.sessions?.length || 0);
    
  } catch (error) {
    console.error('❌ Sessions endpoint failed:', error.response?.data || error.message);
  }
};

testSimpleSessions(); 
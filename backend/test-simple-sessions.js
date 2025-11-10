const axios = require('axios');

const testSimpleSessions = async () => {
  try {
    console.log('Testing simple sessions endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/sessions-simple');
    console.log('✅ Simple sessions endpoint works');
    console.log('Sessions count:', response.data.sessions?.length || 0);
    
  } catch (error) {
    console.error('❌ Simple sessions endpoint failed:', error.response?.data || error.message);
  }
};

testSimpleSessions(); 
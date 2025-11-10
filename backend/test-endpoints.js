const axios = require('axios');

const testEndpoints = async () => {
  try {
    console.log('🧪 Testing backend endpoints...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health endpoint working:', healthResponse.status);
    
    // Test sessions endpoint
    const sessionsResponse = await axios.get('http://localhost:5000/api/sessions?limit=10');
    console.log('✅ Sessions endpoint working:', sessionsResponse.status);
    console.log('📊 Sessions count:', sessionsResponse.data.sessions?.length || 0);
    
    console.log('🎉 All endpoints working!');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Connection Error:', error.message);
    }
  }
};

testEndpoints();
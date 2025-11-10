const axios = require('axios');

async function testBackendConnection() {
  try {
    console.log('🧪 Testing backend connection...');
    
    // Test from localhost (web frontend perspective)
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend connection successful!');
    console.log('📊 Response:', response.data);
    
    // Test sessions endpoint
    const sessionsResponse = await axios.get('http://localhost:5000/api/sessions');
    console.log('✅ Sessions endpoint working!');
    console.log('📋 Sessions data:', {
      total: sessionsResponse.data.total,
      sessions: sessionsResponse.data.sessions?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBackendConnection();
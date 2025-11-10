const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test sessions endpoint
    const sessionsResponse = await axios.get('http://localhost:5000/api/sessions');
    console.log('✅ Sessions endpoint:', {
      status: sessionsResponse.status,
      totalSessions: sessionsResponse.data.total,
      sessionsCount: sessionsResponse.data.sessions.length
    });
    
    console.log('\n🎉 All API endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ API test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
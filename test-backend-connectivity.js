const axios = require('axios');

async function testBackendConnectivity() {
  console.log('🔍 Testing Backend Connectivity...\n');

  const testUrls = [
    'http://10.0.2.2:5000/api',
    'http://localhost:5000/api',
    'http://192.168.81.194:5000/api'
  ];

  for (const url of testUrls) {
    try {
      console.log(`🧪 Testing: ${url}`);
      
      // Test health endpoint
      const healthResponse = await axios.get(`${url}/health`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ Health check passed: ${healthResponse.data.message}`);
      
      // Test sessions endpoint
      const sessionsResponse = await axios.get(`${url}/sessions`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ Sessions endpoint working: ${sessionsResponse.data.sessions?.length || 0} sessions`);
      
      console.log(`🎉 ${url} is fully accessible!\n`);
      return url;
      
    } catch (error) {
      console.log(`❌ Failed: ${url}`);
      console.log(`   Error: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Server not running on this URL`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   💡 DNS resolution failed`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`   💡 Request timed out`);
      } else if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📦 Data: ${JSON.stringify(error.response.data)}`);
      }
      console.log('');
    }
  }
  
  console.error('❌ No working backend URL found');
  console.error('💡 Please ensure backend server is running on port 5000');
  return null;
}

testBackendConnectivity(); 
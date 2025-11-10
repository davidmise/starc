const axios = require('axios');

// Test different URLs that React Native might use
const testUrls = [
  'http://192.168.81.194:5000/api/sessions',
  'http://localhost:5000/api/sessions',
  'http://127.0.0.1:5000/api/sessions',
  'http://10.0.2.2:5000/api/sessions', // Android emulator
];

async function testAllUrls() {
  console.log('🔍 Testing React Native connectivity...\n');
  
  for (const url of testUrls) {
    console.log(`📍 Testing: ${url}`);
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReactNative/1.0'
        }
      });
      console.log(`✅ SUCCESS: ${response.status} - ${response.data.sessions?.length || 0} sessions`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log('   → Connection refused (port not open or firewall)');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   → Host not found (wrong IP address)');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('   → Request timed out (network issue)');
      } else if (error.response) {
        console.log(`   → HTTP ${error.response.status}: ${error.response.statusText}`);
      }
    }
    console.log('');
  }
  
  console.log('🎯 RECOMMENDATIONS:');
  console.log('1. If localhost works → Use for iOS simulator');
  console.log('2. If 192.168.81.194 works → Use for physical devices');
  console.log('3. If 10.0.2.2 works → Use for Android emulator');
  console.log('4. If all fail → Check firewall/network settings');
}

testAllUrls(); 
const axios = require('axios');

const API_BASE_URL = 'http://192.168.81.194:5000/api';

async function createTestAccount() {
  console.log('🔧 Creating Test Account...\n');

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const testUser = {
    username: `testuser_${timestamp}_${randomString}`,
    email: `test${timestamp}${randomString}@example.com`,
    password: 'testpassword123'
  };

  try {
    // Register the test user
    console.log('📝 Registering test user...');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Email: ${testUser.email}`);
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    
    console.log('✅ Test account created successfully!');
    console.log('📋 Account Details:');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   User ID: ${registerResponse.data.user.id}`);
    console.log(`   Token: ${registerResponse.data.token.substring(0, 20)}...`);
    
    console.log('\n🎯 You can now use these credentials in your React Native app:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    
    // Test login
    console.log('\n🧪 Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login test successful!');
    console.log('🚀 Ready to use in your app!');
    
  } catch (error) {
    console.error('❌ Failed to create test account:', error.response?.data?.error || error.message);
  }
}

createTestAccount(); 
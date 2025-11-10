const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function createTestUsers() {
  console.log('🧪 Creating test users for Star Corporate...');
  
  const testUsers = [
    {
      username: 'testuser1',
      email: 'testuser1@example.com',
      password: 'password123',
      fullName: 'Test User One'
    },
    {
      username: 'testuser2', 
      email: 'testuser2@example.com',
      password: 'password123',
      fullName: 'Test User Two'
    },
    {
      username: 'admin',
      email: 'admin@example.com', 
      password: 'admin123',
      fullName: 'Admin User'
    }
  ];

  for (let user of testUsers) {
    try {
      console.log(`\n📝 Creating user: ${user.username}`);
      
      const response = await axios.post(`${BASE_URL}/auth/register`, user);
      console.log(`✅ User created: ${user.username}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: ${user.password}`);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.error?.includes('already exists')) {
        console.log(`⚠️  User ${user.username} already exists - skipping`);
      } else {
        console.error(`❌ Error creating ${user.username}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log('\n🎉 Test users setup complete!');
  console.log('\n📋 LOGIN CREDENTIALS:');
  testUsers.forEach(user => {
    console.log(`👤 ${user.username}: ${user.email} / ${user.password}`);
  });
}

async function testLogin() {
  console.log('\n🔐 Testing login with testuser1...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser1@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('🎫 Token received:', response.data.token.substring(0, 20) + '...');
    console.log('👤 User data:', response.data.user);
    
    return response.data.token;
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateSession(token) {
  console.log('\n📝 Testing session creation...');
  
  try {
    const sessionData = {
      title: 'Test Live Session',
      caption: 'This is a test live streaming session',
      genre: 'Entertainment',
      start_time: new Date().toISOString()
    };
    
    const response = await axios.post(`${BASE_URL}/sessions`, sessionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Session created successfully!');
    console.log('📺 Session data:', response.data);
    
  } catch (error) {
    console.error('❌ Session creation failed:', error.response?.data || error.message);
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting complete Star Corporate test...');
  console.log('='.repeat(50));
  
  // Step 1: Create test users
  await createTestUsers();
  
  // Step 2: Test login
  const token = await testLogin();
  
  if (token) {
    // Step 3: Test session creation
    await testCreateSession(token);
  }
  
  console.log('\n🎯 Test complete! You can now use these credentials in the frontend.');
}

runCompleteTest().catch(console.error);
const axios = require('axios');

const testLogin = async (email, password) => {
  try {
    console.log(`\n🔐 Testing login for: ${email}`);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });

    console.log('✅ Login successful!');
    console.log('👤 User:', response.data.user.username);
    console.log('🔑 Token:', response.data.token.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testAllUsers = async () => {
  console.log('🧪 Testing login for all known test users...');
  
  const testUsers = [
    { email: 'alice@test.com', password: 'password123' },
    { email: 'bob@test.com', password: 'password123' },
    { email: 'carol@test.com', password: 'password123' },
    { email: 'test@example.com', password: 'password123' },
    // Try some other common passwords
    { email: 'alice@test.com', password: 'password' },
    { email: 'alice@test.com', password: 'test123' },
  ];

  for (const user of testUsers) {
    await testLogin(user.email, user.password);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
};

testAllUsers().then(() => {
  console.log('\n✅ Login testing complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test error:', err.message);
  process.exit(1);
});
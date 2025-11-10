const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

const testUserProfile = async () => {
  console.log('🧪 Testing User Profile Functionality...\n');

  try {
    // 1. Test user registration
    console.log('1. Testing User Registration...');
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: uniqueEmail,
      password: 'TestPassword123!',
      username: `testuser${Date.now()}`,
      full_name: 'Test User'
    });
    
    if (registerResponse.status === 201) {
      console.log('✅ User registration working');
    } else {
      console.log('❌ User registration failed');
    }

    // 2. Test user login
    console.log('\n2. Testing User Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: 'TestPassword123!'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ User login working');
      console.log('📱 Token received:', authToken ? 'Yes' : 'No');
    } else {
      console.log('❌ User login failed');
    }

    // 3. Test get user profile
    console.log('\n3. Testing Get User Profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (profileResponse.status === 200) {
        console.log('✅ Get user profile working');
        console.log('👤 User data:', profileResponse.data.user?.username);
      } else {
        console.log('❌ Get user profile failed');
      }
    } catch (error) {
      console.log('❌ Get user profile error:', error.response?.data?.error || error.message);
    }

    // 4. Test update user profile
    console.log('\n4. Testing Update User Profile...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        username: 'updateduser',
        bio: 'Updated bio for testing',
        full_name: 'Updated Test User'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (updateResponse.status === 200) {
        console.log('✅ Update user profile working');
      } else {
        console.log('❌ Update user profile failed');
      }
    } catch (error) {
      console.log('❌ Update user profile error:', error.response?.data?.error || error.message);
    }

    // 5. Test get user by ID
    console.log('\n5. Testing Get User by ID...');
    try {
      const userResponse = await axios.get(`${BASE_URL}/users/1`);
      
      if (userResponse.status === 200) {
        console.log('✅ Get user by ID working');
        console.log('👤 User data:', userResponse.data.user?.username);
      } else {
        console.log('❌ Get user by ID failed');
      }
    } catch (error) {
      console.log('❌ Get user by ID error:', error.response?.data?.error || error.message);
    }

    // 6. Test user's created sessions
    console.log('\n6. Testing User Created Sessions...');
    try {
      const createdSessionsResponse = await axios.get(`${BASE_URL}/users/1/sessions`);
      
      if (createdSessionsResponse.status === 200) {
        console.log('✅ Get user created sessions working');
        console.log('📽️ Sessions count:', createdSessionsResponse.data.sessions?.length || 0);
      } else {
        console.log('❌ Get user created sessions failed');
      }
    } catch (error) {
      console.log('❌ Get user created sessions error:', error.response?.data?.error || error.message);
    }

    // 7. Test user's booked sessions
    console.log('\n7. Testing User Booked Sessions...');
    try {
      const bookedSessionsResponse = await axios.get(`${BASE_URL}/users/1/bookings`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (bookedSessionsResponse.status === 200) {
        console.log('✅ Get user booked sessions working');
        console.log('📅 Bookings count:', bookedSessionsResponse.data.sessions?.length || 0);
      } else {
        console.log('❌ Get user booked sessions failed');
      }
    } catch (error) {
      console.log('❌ Get user booked sessions error:', error.response?.data?.error || error.message);
    }

    // 8. Test user's joined sessions
    console.log('\n8. Testing User Joined Sessions...');
    try {
      const joinedSessionsResponse = await axios.get(`${BASE_URL}/users/1/joined`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (joinedSessionsResponse.status === 200) {
        console.log('✅ Get user joined sessions working');
        console.log('🎯 Joined sessions count:', joinedSessionsResponse.data.sessions?.length || 0);
      } else {
        console.log('❌ Get user joined sessions failed');
      }
    } catch (error) {
      console.log('❌ Get user joined sessions error:', error.response?.data?.error || error.message);
    }

    console.log('\n🎯 User Profile Testing Complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testUserProfile(); 
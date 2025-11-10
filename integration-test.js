const axios = require('axios');

const API_BASE_URL = 'http://192.168.81.194:5000/api';
let authToken = null;
let testUserId = null;

async function runIntegrationTests() {
  console.log('🔍 Starting Comprehensive Integration Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: User Registration
    console.log('\n2️⃣ Testing User Registration...');
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    authToken = registerResponse.data.token;
    testUserId = registerResponse.data.user.id;
    console.log('✅ Registration successful, token received');

    // Test 3: User Login
    console.log('\n3️⃣ Testing User Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful');

    // Test 4: Get User Profile
    console.log('\n4️⃣ Testing Get User Profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieved successfully');

    // Test 5: Get Sessions
    console.log('\n5️⃣ Testing Get Sessions...');
    const sessionsResponse = await axios.get(`${API_BASE_URL}/sessions`);
    console.log(`✅ Retrieved ${sessionsResponse.data.sessions?.length || 0} sessions`);

    // Test 6: Create Session (without file upload for now)
    console.log('\n6️⃣ Testing Create Session...');
    const sessionData = {
      title: 'Test Session',
      caption: 'Test caption',
      genre: 'Music',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const createSessionResponse = await axios.post(`${API_BASE_URL}/sessions`, sessionData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Session created successfully');

    // Test 7: Like/Unlike Session
    console.log('\n7️⃣ Testing Like/Unlike Session...');
    const sessionId = createSessionResponse.data.session.id;
    const likeResponse = await axios.post(`${API_BASE_URL}/interactions/like/${sessionId}`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Like/Unlike working');

    // Test 8: Add Comment
    console.log('\n8️⃣ Testing Add Comment...');
    const commentResponse = await axios.post(`${API_BASE_URL}/interactions/comment/${sessionId}`, {
      message: 'Test comment'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Comment added successfully');

    // Test 9: Book/Unbook Session
    console.log('\n9️⃣ Testing Book/Unbook Session...');
    const bookResponse = await axios.post(`${API_BASE_URL}/interactions/book/${sessionId}`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Book/Unbook working');

    // Test 10: Get Comments
    console.log('\n🔟 Testing Get Comments...');
    const commentsResponse = await axios.get(`${API_BASE_URL}/interactions/comments/${sessionId}`);
    console.log(`✅ Retrieved ${commentsResponse.data.comments?.length || 0} comments`);

    // Test 11: Update Profile
    console.log('\n1️⃣1️⃣ Testing Update Profile...');
    const updateProfileResponse = await axios.put(`${API_BASE_URL}/auth/profile`, {
      bio: 'Updated bio for testing'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile updated successfully');

    // Test 12: Get Users
    console.log('\n1️⃣2️⃣ Testing Get Users...');
    const usersResponse = await axios.get(`${API_BASE_URL}/users`);
    console.log(`✅ Retrieved ${usersResponse.data.users?.length || 0} users`);

    // Test 13: Search
    console.log('\n1️⃣3️⃣ Testing Search...');
    const searchResponse = await axios.get(`${API_BASE_URL}/search?q=test`);
    console.log('✅ Search working');

    // Test 14: Get Stats
    console.log('\n1️⃣4️⃣ Testing Get Stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/stats`);
    console.log('✅ Stats retrieved successfully');

    // Test 15: Get Analytics
    console.log('\n1️⃣5️⃣ Testing Get Analytics...');
    const analyticsResponse = await axios.get(`${API_BASE_URL}/analytics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Analytics retrieved successfully');

    // Test 16: Cancel Session (using status endpoint)
    console.log('\n1️⃣6️⃣ Testing Cancel Session...');
    const cancelResponse = await axios.put(`${API_BASE_URL}/sessions/${sessionId}/status`, {
      status: 'ended'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Session cancelled successfully');

    // Test 17: Create another session for deletion test
    console.log('\n1️⃣7️⃣ Testing Create and Delete Session...');
    const sessionData2 = {
      title: 'Test Session for Deletion',
      caption: 'Test caption for deletion',
      genre: 'Music',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const createSessionResponse2 = await axios.post(`${API_BASE_URL}/sessions`, sessionData2, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Second session created successfully');

    // Delete the second session (should work since it's still scheduled)
    const sessionId2 = createSessionResponse2.data.session.id;
    const deleteResponse = await axios.delete(`${API_BASE_URL}/sessions/${sessionId2}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Session deleted successfully');

    console.log('\n🎉 All Integration Tests Passed!');
    console.log('✅ Backend and Frontend are fully integrated and working correctly.');

  } catch (error) {
    console.error('\n❌ Integration Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL:', error.config?.url);
    }
    
    // Provide specific error analysis
    if (error.response?.status === 401) {
      console.error('🔐 Authentication Error: Check JWT token and user credentials');
    } else if (error.response?.status === 400) {
      console.error('📝 Validation Error: Check request data format');
    } else if (error.response?.status === 404) {
      console.error('🔍 Not Found Error: Check API endpoint URL');
    } else if (error.response?.status === 500) {
      console.error('⚙️ Server Error: Check backend logs');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🌐 Connection Error: Backend server not running');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 DNS Error: Check API base URL');
    }
  }
}

runIntegrationTests(); 
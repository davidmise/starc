const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

const testSessionInteractions = async () => {
  console.log('🧪 Testing Session Creation & Interactions...\n');

  try {
    // 1. Login to get token
    console.log('1. Getting authentication token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Authentication successful');
    } else {
      console.log('❌ Authentication failed');
      return;
    }

    // 2. Test session creation
    console.log('\n2. Testing Session Creation...');
    try {
      const sessionData = {
        title: 'Test Live Session',
        caption: 'This is a test session for QA testing',
        genre: 'Music',
        start_time: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };

      const createResponse = await axios.post(`${BASE_URL}/sessions`, sessionData, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (createResponse.status === 201) {
        console.log('✅ Session creation working');
        console.log('📽️ Session ID:', createResponse.data.session?.id);
      } else {
        console.log('❌ Session creation failed');
      }
    } catch (error) {
      console.log('❌ Session creation error:', error.response?.data?.error || error.message);
    }

    // 3. Test like/unlike session
    console.log('\n3. Testing Like/Unlike Session...');
    try {
      // Get a session to like
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        // Test like
        const likeResponse = await axios.post(`${BASE_URL}/interactions/like/${sessionId}`, {}, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (likeResponse.status === 200) {
          console.log('✅ Like session working');
        } else {
          console.log('❌ Like session failed');
        }

        // Test unlike
        const unlikeResponse = await axios.delete(`${BASE_URL}/interactions/like/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (unlikeResponse.status === 200) {
          console.log('✅ Unlike session working');
        } else {
          console.log('❌ Unlike session failed');
        }
      } else {
        console.log('❌ No sessions available for testing');
      }
    } catch (error) {
      console.log('❌ Like/Unlike error:', error.response?.data?.error || error.message);
    }

    // 4. Test comment on session
    console.log('\n4. Testing Comment on Session...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const commentResponse = await axios.post(`${BASE_URL}/interactions/comment/${sessionId}`, {
          message: 'This is a test comment for QA testing'
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (commentResponse.status === 201) {
          console.log('✅ Comment on session working');
          console.log('💬 Comment ID:', commentResponse.data.comment?.id);
        } else {
          console.log('❌ Comment on session failed');
        }
      } else {
        console.log('❌ No sessions available for commenting');
      }
    } catch (error) {
      console.log('❌ Comment error:', error.response?.data?.error || error.message);
    }

    // 5. Test booking session
    console.log('\n5. Testing Book Session...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const bookResponse = await axios.post(`${BASE_URL}/interactions/book/${sessionId}`, {}, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (bookResponse.status === 201) {
          console.log('✅ Book session working');
        } else {
          console.log('❌ Book session failed');
        }

        // Test unbook
        const unbookResponse = await axios.delete(`${BASE_URL}/interactions/book/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (unbookResponse.status === 200) {
          console.log('✅ Unbook session working');
        } else {
          console.log('❌ Unbook session failed');
        }
      } else {
        console.log('❌ No sessions available for booking');
      }
    } catch (error) {
      console.log('❌ Booking error:', error.response?.data?.error || error.message);
    }

    // 6. Test get session comments
    console.log('\n6. Testing Get Session Comments...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const commentsResponse = await axios.get(`${BASE_URL}/interactions/comments/${sessionId}`);
        
        if (commentsResponse.status === 200) {
          console.log('✅ Get session comments working');
          console.log('💬 Comments count:', commentsResponse.data.comments?.length || 0);
        } else {
          console.log('❌ Get session comments failed');
        }
      } else {
        console.log('❌ No sessions available for comments');
      }
    } catch (error) {
      console.log('❌ Get comments error:', error.response?.data?.error || error.message);
    }

    // 7. Test session status update
    console.log('\n7. Testing Session Status Update...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const statusResponse = await axios.put(`${BASE_URL}/sessions/${sessionId}/status`, {
          status: 'live'
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (statusResponse.status === 200) {
          console.log('✅ Session status update working');
        } else {
          console.log('❌ Session status update failed');
        }
      } else {
        console.log('❌ No sessions available for status update');
      }
    } catch (error) {
      console.log('❌ Status update error:', error.response?.data?.error || error.message);
    }

    // 8. Test delete session
    console.log('\n8. Testing Delete Session...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const deleteResponse = await axios.delete(`${BASE_URL}/sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (deleteResponse.status === 200) {
          console.log('✅ Delete session working');
        } else {
          console.log('❌ Delete session failed');
        }
      } else {
        console.log('❌ No sessions available for deletion');
      }
    } catch (error) {
      console.log('❌ Delete session error:', error.response?.data?.error || error.message);
    }

    console.log('\n🎯 Session Interactions Testing Complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testSessionInteractions(); 
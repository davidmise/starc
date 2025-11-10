const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
let authToken = null;
let socket = null;

const testRealtimeFeatures = async () => {
  console.log('🧪 Testing Real-time Features...\n');

  try {
    // 1. Test authentication
    console.log('1. Testing Authentication...');
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

    // 2. Test Socket.IO connection
    console.log('\n2. Testing Socket.IO Connection...');
    try {
      socket = io(SOCKET_URL, {
        auth: {
          token: authToken
        }
      });

      socket.on('connect', () => {
        console.log('✅ Socket.IO connection established');
      });

      socket.on('disconnect', () => {
        console.log('🔌 Socket.IO disconnected');
      });

      socket.on('error', (error) => {
        console.log('❌ Socket.IO error:', error);
      });

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (socket.connected) {
        console.log('✅ Socket.IO working properly');
      } else {
        console.log('❌ Socket.IO connection failed');
      }
    } catch (error) {
      console.log('❌ Socket.IO error:', error.message);
    }

    // 3. Test live session creation
    console.log('\n3. Testing Live Session Creation...');
    try {
      const sessionData = {
        title: 'Live QA Test Session',
        caption: 'Testing real-time features',
        genre: 'Music',
        start_time: new Date(Date.now() + 300000).toISOString() // 5 minutes from now
      };

      const createResponse = await axios.post(`${BASE_URL}/sessions`, sessionData, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (createResponse.status === 201) {
        console.log('✅ Live session creation working');
        const sessionId = createResponse.data.session?.id;
        console.log('📽️ Session ID:', sessionId);
        
        // 4. Test session status update to live
        console.log('\n4. Testing Session Status Update to Live...');
        try {
          const statusResponse = await axios.put(`${BASE_URL}/sessions/${sessionId}/status`, {
            status: 'live'
          }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          
          if (statusResponse.status === 200) {
            console.log('✅ Session status update to live working');
          } else {
            console.log('❌ Session status update failed');
          }
        } catch (error) {
          console.log('❌ Status update error:', error.response?.data?.error || error.message);
        }
      } else {
        console.log('❌ Live session creation failed');
      }
    } catch (error) {
      console.log('❌ Session creation error:', error.response?.data?.error || error.message);
    }

    // 5. Test real-time notifications
    console.log('\n5. Testing Real-time Notifications...');
    try {
      // Listen for notification events
      socket.on('notification', (data) => {
        console.log('🔔 Real-time notification received:', data);
      });

      // Test booking notification
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const bookResponse = await axios.post(`${BASE_URL}/interactions/book/${sessionId}`, {}, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (bookResponse.status === 201) {
          console.log('✅ Booking notification test completed');
        } else {
          console.log('❌ Booking notification test failed');
        }
      }
    } catch (error) {
      console.log('❌ Notification test error:', error.response?.data?.error || error.message);
    }

    // 6. Test real-time comments
    console.log('\n6. Testing Real-time Comments...');
    try {
      socket.on('new_comment', (data) => {
        console.log('💬 Real-time comment received:', data);
      });

      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const commentResponse = await axios.post(`${BASE_URL}/interactions/comment/${sessionId}`, {
          message: 'Real-time comment test'
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (commentResponse.status === 201) {
          console.log('✅ Real-time comment test completed');
        } else {
          console.log('❌ Real-time comment test failed');
        }
      }
    } catch (error) {
      console.log('❌ Real-time comment error:', error.response?.data?.error || error.message);
    }

    // 7. Test real-time likes
    console.log('\n7. Testing Real-time Likes...');
    try {
      socket.on('like_update', (data) => {
        console.log('❤️ Real-time like update received:', data);
      });

      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        const likeResponse = await axios.post(`${BASE_URL}/interactions/like/${sessionId}`, {}, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (likeResponse.status === 200) {
          console.log('✅ Real-time like test completed');
        } else {
          console.log('❌ Real-time like test failed');
        }
      }
    } catch (error) {
      console.log('❌ Real-time like error:', error.response?.data?.error || error.message);
    }

    // 8. Test session joining
    console.log('\n8. Testing Session Joining...');
    try {
      socket.on('user_joined', (data) => {
        console.log('👤 User joined session:', data);
      });

      socket.on('user_left', (data) => {
        console.log('👤 User left session:', data);
      });

      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId) {
        // Emit join session event
        socket.emit('join_session', { sessionId });
        console.log('✅ Session join event emitted');
        
        // Wait a bit then leave
        setTimeout(() => {
          socket.emit('leave_session', { sessionId });
          console.log('✅ Session leave event emitted');
        }, 2000);
      }
    } catch (error) {
      console.log('❌ Session joining error:', error.message);
    }

    // 9. Test countdown timer functionality
    console.log('\n9. Testing Countdown Timer...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const upcomingSessions = sessionsResponse.data.sessions?.filter(s => 
        s.status === 'scheduled' && new Date(s.start_time) > new Date()
      );
      
      if (upcomingSessions.length > 0) {
        const session = upcomingSessions[0];
        const timeUntilStart = new Date(session.start_time) - new Date();
        const minutesUntilStart = Math.floor(timeUntilStart / 60000);
        
        console.log('⏰ Upcoming session found:');
        console.log('📽️ Title:', session.title);
        console.log('⏱️ Minutes until start:', minutesUntilStart);
        console.log('✅ Countdown timer data available');
      } else {
        console.log('❌ No upcoming sessions for countdown testing');
      }
    } catch (error) {
      console.log('❌ Countdown timer error:', error.response?.data?.error || error.message);
    }

    // 10. Test file upload functionality
    console.log('\n10. Testing File Upload...');
    try {
      // Create a test file
      const testFileContent = 'Test file content for upload';
      const fs = require('fs');
      const path = require('path');
      
      const testFilePath = path.join(__dirname, 'test-upload.txt');
      fs.writeFileSync(testFilePath, testFileContent);
      
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fs.createReadStream(testFilePath));
      form.append('sessionId', 'test-session-id');
      
      const uploadResponse = await axios.post(`${BASE_URL}/upload`, form, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        }
      });
      
      if (uploadResponse.status === 200) {
        console.log('✅ File upload working');
      } else {
        console.log('❌ File upload failed');
      }
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
    } catch (error) {
      console.log('❌ File upload error:', error.response?.data?.error || error.message);
    }

    console.log('\n🎯 Real-time Features Testing Complete!');
    
    // Clean up socket connection
    if (socket) {
      socket.disconnect();
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testRealtimeFeatures(); 
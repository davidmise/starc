const axios = require('axios');
const io = require('socket.io-client');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
let authToken = null;
let socket = null;

const testComprehensive = async () => {
  console.log('🧪 Comprehensive Testing - All Critical Features...\n');

  try {
    // 1. Test Authentication
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

    // 2. Test Socket.IO Connection
    console.log('\n2. Testing Socket.IO Connection...');
    socket = io(SOCKET_URL, {
      auth: { token: authToken }
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

    // 3. Test Session Creation
    console.log('\n3. Testing Session Creation...');
    try {
      const sessionData = {
        title: 'Comprehensive Test Session',
        caption: 'This is a test session for comprehensive testing',
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
        const sessionId = createResponse.data.session?.id;
        console.log('📽️ Session ID:', sessionId);
        
        // 4. Test Session Management Endpoints
        console.log('\n4. Testing Session Management...');
        
        // Test start session
        try {
          const startResponse = await axios.put(`${BASE_URL}/sessions/${sessionId}/start`, {}, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          
          if (startResponse.status === 200) {
            console.log('✅ Start session working');
          } else {
            console.log('❌ Start session failed');
          }
        } catch (error) {
          console.log('❌ Start session error:', error.response?.data?.error || error.message);
        }

        // Test get live session data
        try {
          const liveResponse = await axios.get(`${BASE_URL}/sessions/${sessionId}/live`);
          
          if (liveResponse.status === 200) {
            console.log('✅ Get live session data working');
            console.log('📊 Session data:', liveResponse.data.session?.title);
          } else {
            console.log('❌ Get live session data failed');
          }
        } catch (error) {
          console.log('❌ Get live session data error:', error.response?.data?.error || error.message);
        }

        // Test end session
        try {
          const endResponse = await axios.put(`${BASE_URL}/sessions/${sessionId}/end`, {}, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          
          if (endResponse.status === 200) {
            console.log('✅ End session working');
          } else {
            console.log('❌ End session failed');
          }
        } catch (error) {
          console.log('❌ End session error:', error.response?.data?.error || error.message);
        }
      } else {
        console.log('❌ Session creation failed');
      }
    } catch (error) {
      console.log('❌ Session creation error:', error.response?.data?.error || error.message);
    }

    // 5. Test File Upload
    console.log('\n5. Testing File Upload...');
    try {
      // Create a test file
      const testFileContent = 'Test file content for upload';
      const testFilePath = './test-upload.txt';
      fs.writeFileSync(testFilePath, testFileContent);
      
      const form = new FormData();
      form.append('poster', fs.createReadStream(testFilePath));
      
      const uploadResponse = await axios.post(`${BASE_URL}/upload/session-poster/1`, form, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        }
      });
      
      if (uploadResponse.status === 200) {
        console.log('✅ File upload working');
        console.log('📁 Uploaded file:', uploadResponse.data.poster?.filename);
      } else {
        console.log('❌ File upload failed');
      }
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
    } catch (error) {
      console.log('❌ File upload error:', error.response?.data?.error || error.message);
    }

    // 6. Test Notifications
    console.log('\n6. Testing Notifications...');
    try {
      // Get notifications
      const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (notificationsResponse.status === 200) {
        console.log('✅ Get notifications working');
        console.log('📧 Notifications count:', notificationsResponse.data.notifications?.length || 0);
      } else {
        console.log('❌ Get notifications failed');
      }

      // Get unread count
      const unreadResponse = await axios.get(`${BASE_URL}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (unreadResponse.status === 200) {
        console.log('✅ Get unread count working');
        console.log('🔴 Unread count:', unreadResponse.data.unreadCount);
      } else {
        console.log('❌ Get unread count failed');
      }
    } catch (error) {
      console.log('❌ Notifications error:', error.response?.data?.error || error.message);
    }

    // 7. Test Real-time Interactions
    console.log('\n7. Testing Real-time Interactions...');
    try {
      // Get a session to test with
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      const sessionId = sessionsResponse.data.sessions?.[0]?.id;
      
      if (sessionId && socket) {
        // Test join session
        socket.emit('join-session', sessionId);
        console.log('✅ Join session event emitted');

        // Test send comment
        socket.emit('send-comment', {
          sessionId,
          message: 'Test comment from comprehensive test'
        });
        console.log('✅ Send comment event emitted');

        // Test like session
        socket.emit('like-session', sessionId);
        console.log('✅ Like session event emitted');

        // Test send gift
        socket.emit('send-gift', {
          sessionId,
          giftType: 'star',
          giftValue: 1
        });
        console.log('✅ Send gift event emitted');

        // Wait for events to process
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('❌ No sessions available for real-time testing');
      }
    } catch (error) {
      console.log('❌ Real-time interactions error:', error.message);
    }

    // 8. Test Search Functionality
    console.log('\n8. Testing Search Functionality...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/search?q=test&type=all`);
      
      if (searchResponse.status === 200) {
        console.log('✅ Search functionality working');
        console.log('🔍 Search results:', {
          sessions: searchResponse.data.sessions?.length || 0,
          users: searchResponse.data.users?.length || 0
        });
      } else {
        console.log('❌ Search functionality failed');
      }
    } catch (error) {
      console.log('❌ Search error:', error.response?.data?.error || error.message);
    }

    // 9. Test Statistics
    console.log('\n9. Testing Statistics...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/stats`);
      
      if (statsResponse.status === 200) {
        console.log('✅ Statistics working');
        console.log('📊 Stats:', statsResponse.data.stats);
      } else {
        console.log('❌ Statistics failed');
      }
    } catch (error) {
      console.log('❌ Statistics error:', error.response?.data?.error || error.message);
    }

    // 10. Test Admin Panel
    console.log('\n10. Testing Admin Panel...');
    try {
      const adminResponse = await axios.get(`${BASE_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (adminResponse.status === 200) {
        console.log('✅ Admin panel working');
        console.log('👑 Admin data received');
      } else {
        console.log('❌ Admin panel failed');
      }
    } catch (error) {
      console.log('❌ Admin panel error:', error.response?.data?.error || error.message);
    }

    console.log('\n🎯 Comprehensive Testing Complete!');
    
    // Clean up socket connection
    if (socket) {
      socket.disconnect();
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testComprehensive(); 
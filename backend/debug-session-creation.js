const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

const debugSessionCreation = async () => {
  console.log('🔍 Debugging Session Creation...\n');

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

    // 2. Create a test session
    console.log('\n2. Creating Test Session...');
    const sessionData = {
      title: 'Debug Test Session',
      caption: 'This is a debug test session',
      genre: 'Music',
      start_time: new Date(Date.now() + 600000).toISOString() // 10 minutes from now
    };

    const sessionResponse = await axios.post(`${BASE_URL}/sessions`, sessionData, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Session created:', sessionResponse.data.session);
    console.log('📊 Session status:', sessionResponse.data.session.status);

    // 3. Immediately check the session status
    console.log('\n3. Checking Session Status...');
    const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
    const allSessions = sessionsResponse.data.sessions;
    
    console.log(`📊 Total sessions returned: ${allSessions.length}`);
    console.log(`📊 Pagination info:`, sessionsResponse.data.pagination);
    
    const createdSession = allSessions.find(s => s.title === 'Debug Test Session');
    if (createdSession) {
      console.log('✅ Found created session:', createdSession);
      console.log('📊 Current status:', createdSession.status);
    } else {
      console.log('❌ Created session not found in list');
      
      // Check if it's a pagination issue
      console.log('\n4. Checking with higher limit...');
      const sessionsResponse2 = await axios.get(`${BASE_URL}/sessions?limit=100`);
      const allSessions2 = sessionsResponse2.data.sessions;
      console.log(`📊 Total sessions with limit 100: ${allSessions2.length}`);
      
      const createdSession2 = allSessions2.find(s => s.title === 'Debug Test Session');
      if (createdSession2) {
        console.log('✅ Found created session with higher limit:', createdSession2);
      } else {
        console.log('❌ Still not found with higher limit');
        
        // Check if it's a status issue
        console.log('\n5. Checking all sessions by status...');
        const liveSessions = allSessions2.filter(s => s.status === 'live');
        const scheduledSessions = allSessions2.filter(s => s.status === 'scheduled');
        const endedSessions = allSessions2.filter(s => s.status === 'ended');
        
        console.log(`📊 Live sessions: ${liveSessions.length}`);
        console.log(`📊 Scheduled sessions: ${scheduledSessions.length}`);
        console.log(`📊 Ended sessions: ${endedSessions.length}`);
        
        // Check if our session is in any of these lists
        const inLive = liveSessions.find(s => s.title === 'Debug Test Session');
        const inScheduled = scheduledSessions.find(s => s.title === 'Debug Test Session');
        const inEnded = endedSessions.find(s => s.title === 'Debug Test Session');
        
        if (inLive) console.log('⚠️ Session found in LIVE sessions!');
        if (inScheduled) console.log('✅ Session found in SCHEDULED sessions!');
        if (inEnded) console.log('⚠️ Session found in ENDED sessions!');
      }
    }

    console.log('\n🎯 Debug Complete!');

  } catch (error) {
    console.error('❌ Debug error:', error.response?.data?.error || error.message);
  }
};

debugSessionCreation(); 
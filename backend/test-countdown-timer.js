const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

const testCountdownTimer = async () => {
  console.log('🧪 Testing Countdown Timer...\n');

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

    // 2. Create multiple upcoming sessions
    console.log('\n2. Creating Upcoming Sessions...');
    const createdSessions = [];
    
    for (let i = 1; i <= 3; i++) {
      const sessionData = {
        title: `Upcoming Session ${i}`,
        caption: `This is upcoming session ${i} for countdown testing`,
        genre: 'Music',
        start_time: new Date(Date.now() + (i * 600000)).toISOString() // 10, 20, 30 minutes from now
      };

      try {
        const sessionResponse = await axios.post(`${BASE_URL}/sessions`, sessionData, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (sessionResponse.status === 201) {
          createdSessions.push(sessionResponse.data.session);
          console.log(`✅ Created upcoming session ${i}:`, sessionResponse.data.session.title);
        }
      } catch (error) {
        console.log(`❌ Failed to create upcoming session ${i}:`, error.response?.data?.error || error.message);
      }
    }

    // 3. Test countdown timer functionality
    console.log('\n3. Testing Countdown Timer...');
    try {
      // Fetch all sessions with a high limit to ensure new sessions are included
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions?limit=100`);
      const allSessions = sessionsResponse.data.sessions;
      
      const upcomingSessions = allSessions.filter(s => 
        s.status === 'scheduled' && new Date(s.start_time) > new Date()
      );
      
      if (upcomingSessions.length > 0) {
        console.log('✅ Upcoming sessions found:', upcomingSessions.length);
        
        upcomingSessions.forEach((session, index) => {
          const timeUntilStart = new Date(session.start_time) - new Date();
          const minutesUntilStart = Math.floor(timeUntilStart / 60000);
          const secondsUntilStart = Math.floor((timeUntilStart % 60000) / 1000);
          
          console.log(`📽️ Session ${index + 1}: "${session.title}"`);
          console.log(`⏱️ Time until start: ${minutesUntilStart}m ${secondsUntilStart}s`);
          console.log(`🎵 Genre: ${session.genre}`);
          console.log(`👤 Creator: ${session.username || 'Unknown'}`);
          console.log('---');
        });
        
        console.log('✅ Countdown timer data available and working');
      } else {
        console.log('❌ No upcoming sessions found for countdown testing');
      }

      // 4. Test session filtering by status
      console.log('\n4. Testing Session Status Filtering...');
      const scheduledSessions = allSessions.filter(s => s.status === 'scheduled');
      const liveSessions = allSessions.filter(s => s.status === 'live');
      const endedSessions = allSessions.filter(s => s.status === 'ended');
      
      console.log('📊 Session Status Summary:');
      console.log(`📅 Scheduled: ${scheduledSessions.length}`);
      console.log(`🔴 Live: ${liveSessions.length}`);
      console.log(`✅ Ended: ${endedSessions.length}`);
      
      if (scheduledSessions.length > 0) {
        console.log('✅ Session status filtering working');
      } else {
        console.log('❌ No scheduled sessions found');
      }
    } catch (error) {
      console.log('❌ Countdown timer error:', error.response?.data?.error || error.message);
    }

    console.log('\n🎯 Countdown Timer Testing Complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testCountdownTimer(); 
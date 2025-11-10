const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

const testAnalytics = async () => {
  console.log('🧪 Testing Analytics System...\n');

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

    // 2. Test analytics dashboard
    console.log('\n2. Testing Analytics Dashboard...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (dashboardResponse.status === 200) {
        const data = dashboardResponse.data;
        console.log('✅ Analytics dashboard working');
        console.log('📊 Stats:', {
          totalUsers: data.stats?.totalUsers,
          totalSessions: data.stats?.totalSessions,
          totalLikes: data.stats?.totalLikes,
          totalComments: data.stats?.totalComments
        });
        console.log('📈 Sessions by status:', data.sessionsByStatus?.length || 0);
        console.log('🎵 Top genres:', data.topGenres?.length || 0);
        console.log('👥 Top creators:', data.topCreators?.length || 0);
        console.log('📝 Recent activity:', data.recentActivity?.length || 0);
      } else {
        console.log('❌ Analytics dashboard failed');
      }
    } catch (error) {
      console.log('❌ Analytics dashboard error:', error.response?.data?.error || error.message);
    }

    // 3. Test user analytics
    console.log('\n3. Testing User Analytics...');
    try {
      const userResponse = await axios.get(`${BASE_URL}/analytics/user/testuser`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (userResponse.status === 200) {
        const data = userResponse.data;
        console.log('✅ User analytics working');
        console.log('📊 User sessions:', data.sessions?.length || 0);
        console.log('📈 User engagement:', data.engagement);
        console.log('📝 User activity:', data.activity?.length || 0);
        console.log('🏆 User achievements:', data.achievements?.length || 0);
      } else {
        console.log('❌ User analytics failed');
      }
    } catch (error) {
      console.log('❌ User analytics error:', error.response?.data?.error || error.message);
    }

    // 4. Test session analytics
    console.log('\n4. Testing Session Analytics...');
    try {
      // First get a session ID
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions?limit=1`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (sessionsResponse.status === 200 && sessionsResponse.data.sessions?.length > 0) {
        const sessionId = sessionsResponse.data.sessions[0].id;
        
        const sessionAnalyticsResponse = await axios.get(`${BASE_URL}/analytics/session/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (sessionAnalyticsResponse.status === 200) {
          const data = sessionAnalyticsResponse.data;
          console.log('✅ Session analytics working');
          console.log('📊 Session details:', data.session?.title);
          console.log('👥 Viewer analytics:', data.viewerAnalytics);
          console.log('💬 Engagement:', data.engagement);
          console.log('⏰ Real-time metrics:', data.realTimeMetrics ? 'Available' : 'Not available');
        } else {
          console.log('❌ Session analytics failed');
        }
      } else {
        console.log('❌ No sessions available for analytics testing');
      }
    } catch (error) {
      console.log('❌ Session analytics error:', error.response?.data?.error || error.message);
    }

    // 5. Test trends analytics
    console.log('\n5. Testing Trends Analytics...');
    try {
      const trendsResponse = await axios.get(`${BASE_URL}/analytics/trends?period=7d`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (trendsResponse.status === 200) {
        const data = trendsResponse.data;
        console.log('✅ Trends analytics working');
        console.log('📈 Session trends:', data.sessionTrends?.length || 0);
        console.log('👥 User trends:', data.userTrends?.length || 0);
        console.log('💬 Engagement trends:', data.engagementTrends?.length || 0);
      } else {
        console.log('❌ Trends analytics failed');
      }
    } catch (error) {
      console.log('❌ Trends analytics error:', error.response?.data?.error || error.message);
    }

    // 6. Test analytics with different periods
    console.log('\n6. Testing Analytics Periods...');
    const periods = ['24h', '7d', '30d'];
    
    for (const period of periods) {
      try {
        const periodResponse = await axios.get(`${BASE_URL}/analytics/trends?period=${period}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (periodResponse.status === 200) {
          console.log(`✅ ${period} period analytics working`);
        } else {
          console.log(`❌ ${period} period analytics failed`);
        }
      } catch (error) {
        console.log(`❌ ${period} period analytics error:`, error.response?.data?.error || error.message);
      }
    }

    console.log('\n🎯 Analytics Testing Complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testAnalytics(); 
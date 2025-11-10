const pool = require('./config/database');

async function testAnalyticsQuery() {
  try {
    console.log('🔍 Testing analytics dashboard query...');
    
    // Test the exact query from analytics.js
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', ls.created_at) as hour,
        COUNT(*) as sessions_created,
        COALESCE(AVG(ls.viewer_count), 0) as avg_viewers
      FROM live_sessions ls
      WHERE ls.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('hour', ls.created_at)
      ORDER BY hour DESC
      LIMIT 24
    `);
    
    console.log('✅ Analytics query result:', result.rows);
    
  } catch (error) {
    console.error('❌ Analytics query error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testAnalyticsQuery(); 
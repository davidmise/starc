const pool = require('./config/database');

const checkSessionStatuses = async () => {
  try {
    console.log('🔍 Checking session statuses...\n');
    
    // Get status distribution
    const statusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM live_sessions GROUP BY status ORDER BY count DESC'
    );
    
    console.log('📊 Session Status Distribution:');
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} sessions`);
    });
    
    // Get recent sessions
    const recentResult = await pool.query(
      `SELECT id, title, status, start_time, created_at 
       FROM live_sessions 
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    
    console.log('\n📅 Recent Sessions:');
    recentResult.rows.forEach((session, index) => {
      console.log(`   ${index + 1}. "${session.title}" - Status: ${session.status} - Start: ${session.start_time}`);
    });
    
    // Get scheduled sessions
    const scheduledResult = await pool.query(
      `SELECT id, title, start_time 
       FROM live_sessions 
       WHERE status = 'scheduled' 
       ORDER BY start_time ASC`
    );
    
    console.log(`\n📅 Scheduled Sessions (${scheduledResult.rows.length}):`);
    scheduledResult.rows.forEach((session, index) => {
      const timeUntilStart = new Date(session.start_time) - new Date();
      const minutesUntilStart = Math.floor(timeUntilStart / 60000);
      console.log(`   ${index + 1}. "${session.title}" - Starts in ${minutesUntilStart} minutes`);
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
};

checkSessionStatuses(); 
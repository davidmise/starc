const pool = require('../config/database');

async function checkSchema() {
  try {
    console.log('🔍 Checking live_sessions table schema...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 live_sessions columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})${row.is_nullable === 'YES' ? ' [nullable]' : ''}`);
    });
    
    // Also check recent sessions to see the data
    console.log('\n📊 Recent sessions data:');
    const sessionsResult = await pool.query(`
      SELECT id, title, type, status, start_time, created_at 
      FROM live_sessions 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    sessionsResult.rows.forEach(session => {
      console.log(`- ID: ${session.id}, Title: "${session.title}", Type: ${session.type}, Status: ${session.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    process.exit();
  }
}

checkSchema();

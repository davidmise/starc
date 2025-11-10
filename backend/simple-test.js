const pool = require('./config/database');

const testDatabase = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test basic query
    const result = await pool.query('SELECT COUNT(*) as count FROM live_sessions');
    console.log('Sessions count:', result.rows[0].count);
    
    // Test users query
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', usersResult.rows[0].count);
    
    // Test simple sessions query
    const sessionsResult = await pool.query(`
      SELECT ls.*, u.username 
      FROM live_sessions ls 
      LEFT JOIN users u ON ls.user_id = u.id 
      LIMIT 5
    `);
    console.log('Sessions with users:', sessionsResult.rows.length);
    
    console.log('✅ Database tests passed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
};

testDatabase(); 
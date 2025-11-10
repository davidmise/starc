const pool = require('./config/database');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and tables...');
    
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Available tables:', tablesResult.rows.map(row => row.table_name));
    
    // Test a simple analytics query
    const testQuery = await pool.query(`
      SELECT COUNT(*) as total FROM users
    `);
    
    console.log('✅ Basic query test:', testQuery.rows[0]);
    
    // Test DATE_TRUNC function
    const dateTest = await pool.query(`
      SELECT DATE_TRUNC('day', NOW()) as test_date
    `);
    
    console.log('✅ DATE_TRUNC test:', dateTest.rows[0]);
    
    // Test INTERVAL syntax
    const intervalTest = await pool.query(`
      SELECT NOW() - INTERVAL '7 days' as week_ago
    `);
    
    console.log('✅ INTERVAL test:', intervalTest.rows[0]);
    
  } catch (error) {
    console.error('❌ Database test error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 
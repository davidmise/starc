const { query } = require('./config/database');

async function checkTableSchema() {
  try {
    console.log('🔍 Checking live_sessions table structure...');
    
    // Get column information
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Available columns in live_sessions table:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🔍 Checking what the code is trying to access...');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    process.exit(1);
  }
}

checkTableSchema();
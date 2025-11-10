const pool = require('./config/database');

async function checkTables() {
  try {
    console.log('🔍 Checking table structures...');
    
    // Check live_sessions table structure
    const sessionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 live_sessions columns:');
    sessionsStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if viewer_count, likes_count, comments_count exist
    const hasViewerCount = sessionsStructure.rows.some(col => col.column_name === 'viewer_count');
    const hasLikesCount = sessionsStructure.rows.some(col => col.column_name === 'likes_count');
    const hasCommentsCount = sessionsStructure.rows.some(col => col.column_name === 'comments_count');
    
    console.log('\n🔍 Checking for required columns:');
    console.log(`  viewer_count: ${hasViewerCount ? '✅' : '❌'}`);
    console.log(`  likes_count: ${hasLikesCount ? '✅' : '❌'}`);
    console.log(`  comments_count: ${hasCommentsCount ? '✅' : '❌'}`);
    
    // Check other tables
    const tables = ['users', 'likes', 'comments', 'bookings', 'gifts'];
    
    for (const table of tables) {
      const tableStructure = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\n📋 ${table} columns:`, tableStructure.rows.map(col => col.column_name));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables(); 
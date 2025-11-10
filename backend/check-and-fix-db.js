const { pool } = require('./config/database');

const checkAndFixDatabase = async () => {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check if follows table exists
    const checkTableSQL = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const result = await pool.query(checkTableSQL);
    console.log('📊 Existing tables:', result.rows.map(row => row.table_name));
    
    // Check if follows table exists
    const followsExists = result.rows.some(row => row.table_name === 'follows');
    
    if (!followsExists) {
      console.log('❌ Follows table does not exist, creating it...');
      
      // Create follows table
      const createFollowsSQL = `
        CREATE TABLE follows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
            following_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id),
            CHECK(follower_id != following_id)
        );
      `;
      
      await pool.query(createFollowsSQL);
      console.log('✅ Follows table created successfully');
    } else {
      console.log('✅ Follows table already exists');
    }
    
    // Check if follows table has the right structure
    const checkColumnsSQL = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'follows' 
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await pool.query(checkColumnsSQL);
    console.log('📋 Follows table columns:', columnsResult.rows);
    
    // Create indexes one by one
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)',
      'CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)', 
      'CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at)'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await pool.query(indexSQL);
        console.log('✅ Index created successfully');
      } catch (error) {
        console.error('❌ Index creation failed:', error.message);
      }
    }
    
    // Test the sessions query
    console.log('🧪 Testing sessions query...');
    const testSessionsSQL = `
      SELECT 
          s.*,
          u.username,
          u.profile_pic,
          u.is_verified,
          CASE 
              WHEN s.user_id IN (
                  SELECT following_id 
                  FROM follows 
                  WHERE follower_id = '00000000-0000-0000-0000-000000000000'::uuid
              ) THEN true
              ELSE false
          END as is_following
      FROM live_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status IN ('live', 'scheduled')
      ORDER BY 
          CASE s.status 
              WHEN 'live' THEN 1 
              WHEN 'scheduled' THEN 2 
              ELSE 3 
          END,
          s.start_time ASC
      LIMIT 10;
    `;
    
    const testResult = await pool.query(testSessionsSQL);
    console.log('✅ Sessions query works! Found sessions:', testResult.rows.length);
    
    console.log('🎉 Database check and fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  checkAndFixDatabase().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = checkAndFixDatabase;
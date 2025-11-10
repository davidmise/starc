const { pool } = require('./config/database');

const fixFollowsTable = async () => {
  try {
    console.log('🔧 Fixing follows table column name...');
    
    // Rename the column from followed_id to following_id
    const renameColumnSQL = `
      ALTER TABLE follows 
      RENAME COLUMN followed_id TO following_id;
    `;
    
    await pool.query(renameColumnSQL);
    console.log('✅ Column renamed from followed_id to following_id');
    
    // Create missing indexes
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
    `;
    
    await pool.query(createIndexSQL);
    console.log('✅ Index for following_id created successfully');
    
    // Test the sessions query now
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
    
    console.log('🎉 Follows table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to fix follows table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  fixFollowsTable().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = fixFollowsTable;
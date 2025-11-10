const { pool } = require('./config/database');

const createFollowsTable = async () => {
  try {
    console.log('🔧 Creating follows table...');
    
    // Create the follows table
    const createFollowsSQL = `
      CREATE TABLE IF NOT EXISTS follows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
          following_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(follower_id, following_id),
          CHECK(follower_id != following_id) -- prevent self-following
      );
    `;
    
    await pool.query(createFollowsSQL);
    console.log('✅ Follows table created successfully');
    
    // Create indexes for the follows table
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
      CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);
    `;
    
    await pool.query(createIndexesSQL);
    console.log('✅ Follows table indexes created successfully');
    
    // Update user_stats function to include follower counts
    const updateUserStatsFunction = `
      CREATE OR REPLACE FUNCTION update_user_stats()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Insert or update user_stats record
          INSERT INTO user_stats (user_id, total_sessions, total_viewers, total_likes, total_comments, total_gifts, total_watch_time, followers_count, following_count)
          SELECT 
              u.id,
              COUNT(DISTINCT ls.id),
              COALESCE(SUM(ls.viewer_count), 0),
              COALESCE(SUM(ls.like_count), 0),
              COALESCE(SUM(ls.comment_count), 0),
              COALESCE(SUM(g.gift_value), 0),
              COALESCE(SUM(us.watch_duration), 0),
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id),
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)
          FROM users u
          LEFT JOIN live_sessions ls ON u.id = ls.user_id
          LEFT JOIN gifts g ON ls.id = g.session_id
          LEFT JOIN user_sessions us ON u.id = us.user_id
          WHERE u.id = NEW.user_id
          GROUP BY u.id
          ON CONFLICT (user_id) DO UPDATE SET
              total_sessions = EXCLUDED.total_sessions,
              total_viewers = EXCLUDED.total_viewers,
              total_likes = EXCLUDED.total_likes,
              total_comments = EXCLUDED.total_comments,
              total_gifts = EXCLUDED.total_gifts,
              total_watch_time = EXCLUDED.total_watch_time,
              followers_count = EXCLUDED.followers_count,
              following_count = EXCLUDED.following_count,
              updated_at = CURRENT_TIMESTAMP;
          
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    await pool.query(updateUserStatsFunction);
    console.log('✅ User stats function updated with follower counts');
    
    // Create trigger for follower counts
    const followerCountsFunction = `
      CREATE OR REPLACE FUNCTION update_follower_counts()
      RETURNS TRIGGER AS $$
      BEGIN
          IF TG_OP = 'INSERT' THEN
              -- Update follower count for the followed user
              UPDATE user_stats SET followers_count = followers_count + 1 
              WHERE user_id = NEW.following_id;
              -- Update following count for the follower
              UPDATE user_stats SET following_count = following_count + 1 
              WHERE user_id = NEW.follower_id;
              RETURN NEW;
          ELSIF TG_OP = 'DELETE' THEN
              -- Update follower count for the unfollowed user
              UPDATE user_stats SET followers_count = followers_count - 1 
              WHERE user_id = OLD.following_id;
              -- Update following count for the unfollower
              UPDATE user_stats SET following_count = following_count - 1 
              WHERE user_id = OLD.follower_id;
              RETURN OLD;
          END IF;
          RETURN NULL;
      END;
      $$ language 'plpgsql';
    `;
    
    await pool.query(followerCountsFunction);
    console.log('✅ Follower counts function created');
    
    // Create trigger
    const createTrigger = `
      DROP TRIGGER IF EXISTS trigger_update_follower_counts ON follows;
      CREATE TRIGGER trigger_update_follower_counts
          AFTER INSERT OR DELETE ON follows
          FOR EACH ROW
          EXECUTE FUNCTION update_follower_counts();
    `;
    
    await pool.query(createTrigger);
    console.log('✅ Follower counts trigger created');
    
    console.log('🎉 Follows table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create follows table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createFollowsTable().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = createFollowsTable;
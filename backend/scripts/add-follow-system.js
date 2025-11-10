const { pool } = require('../config/database');

const setupFollowSystem = async () => {
  try {
    console.log('🔧 Setting up follow system tables...');

    // Create follows table
    const createFollowsTable = `
      CREATE TABLE IF NOT EXISTS follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);
    `;

    await pool.query(createFollowsTable);
    console.log('✅ Follows table created successfully');

    // Create user_stats table
    const createUserStatsTable = `
      CREATE TABLE IF NOT EXISTS user_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        total_likes_received INTEGER DEFAULT 0,
        total_comments_received INTEGER DEFAULT 0,
        total_sessions_created INTEGER DEFAULT 0,
        total_sessions_booked INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats (user_id);
    `;

    await pool.query(createUserStatsTable);
    console.log('✅ User stats table created successfully');

    // Create function to update user stats
    const createUpdateStatsFunction = `
      CREATE OR REPLACE FUNCTION update_user_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          -- Update follower's following count
          INSERT INTO user_stats (user_id, following_count) 
          VALUES (NEW.follower_id, 1)
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            following_count = user_stats.following_count + 1,
            updated_at = CURRENT_TIMESTAMP;
            
          -- Update following's followers count
          INSERT INTO user_stats (user_id, followers_count) 
          VALUES (NEW.following_id, 1)
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            followers_count = user_stats.followers_count + 1,
            updated_at = CURRENT_TIMESTAMP;
            
        ELSIF TG_OP = 'DELETE' THEN
          -- Update follower's following count
          UPDATE user_stats 
          SET following_count = GREATEST(following_count - 1, 0),
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = OLD.follower_id;
          
          -- Update following's followers count
          UPDATE user_stats 
          SET followers_count = GREATEST(followers_count - 1, 0),
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = OLD.following_id;
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;

    await pool.query(createUpdateStatsFunction);
    console.log('✅ Update stats function created successfully');

    // Create triggers
    const createTriggers = `
      DROP TRIGGER IF EXISTS trigger_update_follow_stats ON follows;
      CREATE TRIGGER trigger_update_follow_stats
        AFTER INSERT OR DELETE ON follows
        FOR EACH ROW EXECUTE FUNCTION update_user_stats();
    `;

    await pool.query(createTriggers);
    console.log('✅ Follow stats triggers created successfully');

    // Initialize stats for existing users
    const initializeExistingUserStats = `
      INSERT INTO user_stats (user_id, followers_count, following_count)
      SELECT 
        u.id,
        0,
        0
      FROM users u
      WHERE u.id NOT IN (SELECT user_id FROM user_stats)
      ON CONFLICT (user_id) DO NOTHING;
    `;

    await pool.query(initializeExistingUserStats);
    console.log('✅ Initialized stats for existing users');

    console.log('🎉 Follow system setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up follow system:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the setup
if (require.main === module) {
  setupFollowSystem()
    .then(() => {
      console.log('Follow system setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Follow system setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupFollowSystem };

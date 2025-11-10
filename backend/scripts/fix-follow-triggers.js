const { pool } = require('../config/database');

const fixFollowTriggers = async () => {
  try {
    console.log('🔧 Fixing follow system triggers...');

    // Drop any existing triggers that might be on wrong tables
    const dropTriggers = `
      DROP TRIGGER IF EXISTS trigger_update_follow_stats ON live_sessions;
      DROP TRIGGER IF EXISTS trigger_update_follow_stats ON follows;
      DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
    `;

    await pool.query(dropTriggers);
    console.log('✅ Dropped existing triggers');

    // Create the correct function for follow stats only
    const createFollowStatsFunction = `
      CREATE OR REPLACE FUNCTION update_follow_stats()
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

    await pool.query(createFollowStatsFunction);
    console.log('✅ Created follow stats function');

    // Create trigger ONLY on follows table
    const createFollowTrigger = `
      CREATE TRIGGER trigger_update_follow_stats
        AFTER INSERT OR DELETE ON follows
        FOR EACH ROW EXECUTE FUNCTION update_follow_stats();
    `;

    await pool.query(createFollowTrigger);
    console.log('✅ Created follow trigger on follows table only');

    console.log('🎉 Follow system triggers fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing follow triggers:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the fix
if (require.main === module) {
  fixFollowTriggers()
    .then(() => {
      console.log('Follow triggers fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Follow triggers fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixFollowTriggers };

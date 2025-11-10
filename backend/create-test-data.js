const bcrypt = require('bcrypt');
const { pool } = require('./config/database');

const createTestData = async () => {
  try {
    console.log('🌱 Creating test users and sessions...');
    
    // Create test users
    const testUsers = [
      {
        username: 'alice',
        email: 'alice@test.com',
        password: 'password123',
        bio: 'Tech enthusiast and live streamer',
        profile_pic: 'https://randomuser.me/api/portraits/women/1.jpg'
      },
      {
        username: 'bob',
        email: 'bob@test.com', 
        password: 'password123',
        bio: 'Gaming content creator',
        profile_pic: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        username: 'carol',
        email: 'carol@test.com',
        password: 'password123', 
        bio: 'Music lover and DJ',
        profile_pic: 'https://randomuser.me/api/portraits/women/2.jpg'
      },
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        bio: 'Test account for development',
        profile_pic: 'https://randomuser.me/api/portraits/men/2.jpg'
      }
    ];

    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      try {
        const result = await pool.query(
          `INSERT INTO users (username, email, password, bio, profile_pic, is_verified, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id, username, email`,
          [user.username, user.email, hashedPassword, user.bio, user.profile_pic, true, true]
        );
        
        createdUsers.push(result.rows[0]);
        console.log(`✅ Created user: ${result.rows[0].username}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️ User ${user.username} already exists, skipping...`);
          // Get existing user
          const existing = await pool.query('SELECT id, username, email FROM users WHERE username = $1', [user.username]);
          if (existing.rows.length > 0) {
            createdUsers.push(existing.rows[0]);
          }
        } else {
          throw error;
        }
      }
    }

    console.log('📺 Creating test sessions...');
    const testSessions = [
      {
        title: 'Morning Tech Talk',
        caption: 'Discussing the latest tech trends',
        genre: 'Technology',
        status: 'scheduled',
        start_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        poster_url: 'https://via.placeholder.com/400x600/4285f4/ffffff?text=Tech+Talk'
      },
      {
        title: 'Gaming Session Live',
        caption: 'Playing the latest games with viewers',
        genre: 'Gaming', 
        status: 'live',
        start_time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        poster_url: 'https://via.placeholder.com/400x600/ea4335/ffffff?text=Gaming'
      },
      {
        title: 'Music and Chill',
        caption: 'DJ set with relaxing vibes',
        genre: 'Music',
        status: 'ended',
        start_time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        end_time: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        poster_url: 'https://via.placeholder.com/400x600/34a853/ffffff?text=Music'
      }
    ];

    for (let i = 0; i < testSessions.length && i < createdUsers.length; i++) {
      const session = testSessions[i];
      const user = createdUsers[i];
      
      try {
        const result = await pool.query(
          `INSERT INTO live_sessions (user_id, title, caption, genre, start_time, end_time, status, poster_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           RETURNING id, title`,
          [user.id, session.title, session.caption, session.genre, session.start_time, session.end_time, session.status, session.poster_url]
        );
        
        console.log(`✅ Created session: ${result.rows[0].title}`);
      } catch (error) {
        console.error(`❌ Error creating session: ${error.message}`);
      }
    }

    console.log('🎉 Test data creation completed!');
    console.log('\n📋 Test Accounts Created:');
    createdUsers.forEach(user => {
      console.log(`   Username: ${user.username}`);  
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: password123`);
      console.log('   ---');
    });
    
    console.log('\n🚀 You can now test the system with these accounts!');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createTestData()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = createTestData;
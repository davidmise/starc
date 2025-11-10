const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const randomFromArray = arr => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const avatars = [
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/men/5.jpg',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/men/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg',
  'https://randomuser.me/api/portraits/men/9.jpg',
  'https://randomuser.me/api/portraits/women/10.jpg',
  'https://randomuser.me/api/portraits/men/11.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
  'https://randomuser.me/api/portraits/men/13.jpg',
  'https://randomuser.me/api/portraits/women/14.jpg',
  'https://randomuser.me/api/portraits/men/15.jpg',
  'https://randomuser.me/api/portraits/women/16.jpg',
  'https://randomuser.me/api/portraits/men/17.jpg',
  'https://randomuser.me/api/portraits/women/18.jpg',
  'https://randomuser.me/api/portraits/men/19.jpg',
  'https://randomuser.me/api/portraits/women/20.jpg',
  'https://randomuser.me/api/portraits/men/21.jpg',
  'https://randomuser.me/api/portraits/women/22.jpg',
  'https://randomuser.me/api/portraits/men/23.jpg',
  'https://randomuser.me/api/portraits/women/24.jpg',
  'https://randomuser.me/api/portraits/men/25.jpg',
  'https://randomuser.me/api/portraits/women/26.jpg',
  'https://randomuser.me/api/portraits/men/27.jpg',
  'https://randomuser.me/api/portraits/women/28.jpg',
  'https://randomuser.me/api/portraits/men/29.jpg',
  'https://randomuser.me/api/portraits/women/30.jpg'
];

const bios = [
  'Live streaming enthusiast and content creator',
  'Music lover and amateur guitarist',
  'Gaming streamer and esports enthusiast',
  'Fitness trainer and wellness coach',
  'Tech reviewer and gadget enthusiast',
  'Cooking show host and food blogger',
  'Comedy performer and stand-up artist',
  'Art teacher and creative content creator',
  'Celebrity chef and TV host',
  'Business coach and entrepreneur',
  'Travel vlogger and explorer',
  'Fashion influencer and stylist',
  'Sports analyst and commentator',
  'Brand ambassador for top tech companies',
  'Motivational speaker and author',
  'Event host and MC',
  'Podcast producer and host',
  'Film director and actor',
  'Startup founder and investor',
  'Celebrity DJ and music producer',
  'Fan of all things entertainment',
  'Brand manager for global brands',
  'Charity event organizer',
  'Lifestyle blogger and influencer',
  'Fitness model and nutritionist',
  'Esports team manager',
  'Book club leader',
  'Parenting coach and author',
  'Pet lover and animal rights activist',
  'Science communicator and educator',
  'Comedy club owner'
];

const genres = [
  'Comedy', 'Music', 'Talk Show', 'Gaming', 'Education', 'Fitness', 'Cooking', 'Art',
  'Technology', 'Fashion', 'Travel', 'Sports', 'News', 'Entertainment', 'Business'
];

const sessionTitles = [
  'Evening Guitar Session', 'Morning Workout Live', 'Gaming Night', 'Cooking with Lisa',
  'Tech Talk', 'Comedy Hour', 'Art Therapy', 'Late Night Chat', 'Business Masterclass',
  'Travel Stories', 'Fashion Trends', 'Sports Recap', 'News Hour', 'Live Q&A', 'Startup Pitch',
  'DJ Set', 'Book Club Live', 'Parenting Tips', 'Pet Show', 'Science Explained', 'Motivation Monday',
  'Esports Tournament', 'Film Review', 'Podcast Live', 'Charity Stream', 'Brand Launch',
  'Celebrity AMA', 'Nutrition Workshop', 'Fitness Challenge', 'Cooking Battle', 'Art Auction'
];

const commentSamples = [
  'Looking forward to this!', 'Can’t wait to join!', 'This is going to be amazing!',
  'I’m so excited!', 'Count me in!', 'This sounds interesting', 'I’ll definitely tune in',
  'Can’t miss this one!', 'Looking forward to learning something new', 'This is exactly what I needed',
  'Awesome session!', 'Great content!', 'Love this!', 'So inspiring!', 'Hilarious!',
  'Very informative!', 'Best stream ever!', 'You rock!', 'Keep it up!', 'Super cool!'
];

const notificationTypes = [
  { type: 'session_start', title: 'Session Starting', message: 'Your session is about to begin!' },
  { type: 'booking_reminder', title: 'Booking Reminder', message: 'You have a session starting soon' },
  { type: 'like', title: 'New Like', message: 'Someone liked your session' },
  { type: 'comment', title: 'New Comment', message: 'Someone commented on your session' },
  { type: 'gift', title: 'New Gift', message: 'You received a gift!' },
  { type: 'follow', title: 'New Follower', message: 'You have a new follower!' },
  { type: 'system', title: 'System Update', message: 'Check out the latest features!' }
];

const giftTypes = ['star', 'rose', 'crown', 'heart', 'diamond', 'gold', 'silver'];

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');

    // 1. Create 32 users
    const users = [];
    for (let i = 1; i <= 32; i++) {
      users.push({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'password123',
        bio: bios[(i - 1) % bios.length],
        profile_pic: avatars[(i - 1) % avatars.length],
        is_verified: i % 7 === 0 || i % 11 === 0, // some verified
        is_active: i % 13 !== 0 // some inactive
      });
    }

    // Add a few celebrities, brands, and event hosts
    users.push(
      {
        username: 'dj_celebrity',
        email: 'dj@celebrity.com',
        password: 'password123',
        bio: 'World-famous DJ and music producer',
        profile_pic: 'https://randomuser.me/api/portraits/men/31.jpg',
        is_verified: true,
        is_active: true
      },
      {
        username: 'brand_global',
        email: 'contact@brandglobal.com',
        password: 'password123',
        bio: 'Official account for Brand Global',
        profile_pic: 'https://randomuser.me/api/portraits/women/32.jpg',
        is_verified: true,
        is_active: true
      },
      {
        username: 'event_host',
        email: 'host@events.com',
        password: 'password123',
        bio: 'Professional event host and MC',
        profile_pic: 'https://randomuser.me/api/portraits/men/33.jpg',
        is_verified: true,
        is_active: true
      }
    );

    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await pool.query(
        'INSERT INTO users (username, email, password, bio, profile_pic, is_verified, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (username) DO NOTHING RETURNING id, username',
        [user.username, user.email, hashedPassword, user.bio, user.profile_pic, user.is_verified, user.is_active]
      );
      if (result.rows.length > 0) {
        createdUsers.push(result.rows[0]);
      } else {
        // Fetch the existing user id if already present
        const existing = await pool.query('SELECT id, username FROM users WHERE username = $1', [user.username]);
        if (existing.rows.length > 0) {
          createdUsers.push(existing.rows[0]);
        }
      }
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // 2. Create 36 sessions (varied genres, hosts, statuses, times)
    const now = Date.now();
    const sessionStatuses = ['scheduled', 'live', 'ended', 'cancelled'];
    const sessions = [];
    for (let i = 0; i < 36; i++) {
      const host = randomFromArray(createdUsers);
      const genre = genres[i % genres.length];
      const status = i < 6 ? 'live' : i < 18 ? 'ended' : i < 30 ? 'scheduled' : 'cancelled';
      const start_time = new Date(now + (i - 18) * 60 * 60 * 1000); // some in past, some future
      const end_time = status === 'ended' ? new Date(start_time.getTime() + 2 * 60 * 60 * 1000) : null;
      sessions.push({
        user_id: host.id,
        title: sessionTitles[i % sessionTitles.length] + (i > 30 ? ' (Special)' : ''),
        caption: bios[i % bios.length],
        genre,
        start_time,
        end_time,
        status,
        poster_url: `https://via.placeholder.com/400x600/111111/FFD700?text=Session+${i+1}`,
        preview_video_url: i % 2 === 0 ? 'https://www.w3schools.com/html/mov_bbb.mp4' : null
      });
    }

    console.log('📺 Creating live sessions...');
    const createdSessions = [];
    for (const session of sessions) {
      const result = await pool.query(
        'INSERT INTO live_sessions (user_id, title, caption, genre, start_time, end_time, status, poster_url, preview_video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, title',
        [session.user_id, session.title, session.caption, session.genre, session.start_time, session.end_time, session.status, session.poster_url, session.preview_video_url]
      );
      createdSessions.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdSessions.length} live sessions`);

    // 3. Bookings: each user books 2-4 random sessions
    console.log('📅 Creating bookings...');
    for (const user of createdUsers) {
      const numBookings = randomInt(2, 4);
      const bookedSessions = [];
      for (let i = 0; i < numBookings; i++) {
        let session;
        do {
          session = randomFromArray(createdSessions);
        } while (bookedSessions.includes(session.id));
        bookedSessions.push(session.id);
        await pool.query(
          'INSERT INTO bookings (user_id, session_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [user.id, session.id, 'confirmed']
        );
      }
    }

    // 4. Likes: each session gets 5-20 random likes
    console.log('❤️ Creating likes...');
    for (const session of createdSessions) {
      const numLikes = randomInt(5, 20);
      const likers = [];
      for (let i = 0; i < numLikes; i++) {
        let liker;
        do {
          liker = randomFromArray(createdUsers);
        } while (likers.includes(liker.id));
        likers.push(liker.id);
        await pool.query(
          'INSERT INTO likes (user_id, session_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [liker.id, session.id]
        );
      }
    }

    // 5. Comments: each session gets 3-10 random comments
    console.log('💬 Creating comments...');
    for (const session of createdSessions) {
      const numComments = randomInt(3, 10);
      for (let i = 0; i < numComments; i++) {
        const commenter = randomFromArray(createdUsers);
        const comment = randomFromArray(commentSamples);
        await pool.query(
          'INSERT INTO comments (user_id, session_id, message) VALUES ($1, $2, $3)',
          [commenter.id, session.id, comment]
        );
      }
    }

    // 6. Gifts: each session gets 1-5 random gifts
    console.log('🎁 Creating gifts...');
    for (const session of createdSessions) {
      const numGifts = randomInt(1, 5);
      for (let i = 0; i < numGifts; i++) {
        const gifter = randomFromArray(createdUsers);
        const giftType = randomFromArray(giftTypes);
        const giftValue = randomInt(1, 20);
        await pool.query(
          'INSERT INTO gifts (user_id, session_id, gift_type, gift_value) VALUES ($1, $2, $3, $4)',
          [gifter.id, session.id, giftType, giftValue]
        );
      }
    }

    // 7. Notifications: each user gets 2-5 random notifications
    console.log('🔔 Creating notifications...');
    for (const user of createdUsers) {
      const numNotifications = randomInt(2, 5);
      for (let i = 0; i < numNotifications; i++) {
        const notification = randomFromArray(notificationTypes);
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
          [user.id, notification.type, notification.title, notification.message]
        );
      }
    }

    // 8. User sessions (viewing history): each user joins 2-6 sessions
    console.log('👀 Creating user sessions...');
    for (const user of createdUsers) {
      const numSessions = randomInt(2, 6);
      const joined = [];
      for (let i = 0; i < numSessions; i++) {
        let session;
        do {
          session = randomFromArray(createdSessions);
        } while (joined.includes(session.id));
        joined.push(session.id);
        const watchDuration = randomInt(300, 7200); // 5 min to 2 hours
        await pool.query(
          'INSERT INTO user_sessions (user_id, session_id, watch_duration) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [user.id, session.id, watchDuration]
        );
      }
    }

    // 9. Update session stats
    console.log('📊 Updating session statistics...');
    for (const session of createdSessions) {
      const stats = await pool.query(`
        SELECT 
          COUNT(DISTINCT us.user_id) as total_viewers,
          COUNT(l.id) as total_likes,
          COUNT(c.id) as total_comments,
          COUNT(g.id) as total_gifts,
          COALESCE(SUM(us.watch_duration), 0) as total_watch_time
        FROM live_sessions ls
        LEFT JOIN user_sessions us ON ls.id = us.session_id
        LEFT JOIN likes l ON ls.id = l.session_id
        LEFT JOIN comments c ON ls.id = c.session_id
        LEFT JOIN gifts g ON ls.id = g.session_id
        WHERE ls.id = $1
        GROUP BY ls.id
      `, [session.id]);

      if (stats.rows.length > 0) {
        const stat = stats.rows[0];
        await pool.query(`
          INSERT INTO session_stats (session_id, total_viewers, total_likes, total_comments, total_gifts, total_watch_time)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (session_id) DO UPDATE SET
            total_viewers = EXCLUDED.total_viewers,
            total_likes = EXCLUDED.total_likes,
            total_comments = EXCLUDED.total_comments,
            total_gifts = EXCLUDED.total_gifts,
            total_watch_time = EXCLUDED.total_watch_time,
            updated_at = CURRENT_TIMESTAMP
        `, [session.id, stat.total_viewers, stat.total_likes, stat.total_comments, stat.total_gifts, stat.total_watch_time]);
      }
    }

    // 10. Update user stats
    console.log('👤 Updating user statistics...');
    for (const user of createdUsers) {
      const stats = await pool.query(`
        SELECT 
          COUNT(DISTINCT ls.id) as total_sessions,
          COALESCE(SUM(ls.viewer_count), 0) as total_viewers,
          COALESCE(SUM(ls.like_count), 0) as total_likes,
          COALESCE(SUM(ls.comment_count), 0) as total_comments,
          COALESCE(SUM(g.gift_value), 0) as total_gifts,
          COALESCE(SUM(us.watch_duration), 0) as total_watch_time
        FROM users u
        LEFT JOIN live_sessions ls ON u.id = ls.user_id
        LEFT JOIN gifts g ON ls.id = g.session_id
        LEFT JOIN user_sessions us ON u.id = us.user_id
        WHERE u.id = $1
        GROUP BY u.id
      `, [user.id]);

      if (stats.rows.length > 0) {
        const stat = stats.rows[0];
        await pool.query(`
          INSERT INTO user_stats (user_id, total_sessions, total_viewers, total_likes, total_comments, total_gifts, total_watch_time)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id) DO UPDATE SET
            total_sessions = EXCLUDED.total_sessions,
            total_viewers = EXCLUDED.total_viewers,
            total_likes = EXCLUDED.total_likes,
            total_comments = EXCLUDED.total_comments,
            total_gifts = EXCLUDED.total_gifts,
            total_watch_time = EXCLUDED.total_watch_time,
            updated_at = CURRENT_TIMESTAMP
        `, [user.id, stat.total_sessions, stat.total_viewers, stat.total_likes, stat.total_comments, stat.total_gifts, stat.total_watch_time]);
      }
    }

    console.log('🎉 Data seeding completed successfully!');
    console.log('📊 Seeded data includes:');
    console.log(`   - ${createdUsers.length} users`);
    console.log(`   - ${createdSessions.length} live sessions`);
    console.log('   - Hundreds of bookings, likes, comments, gifts, notifications, and user sessions');
    console.log('   - Updated statistics for all users and sessions');

    return true;

  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    throw error;
  }
};

// Export the function
module.exports = seedData;

// Run if called directly
if (require.main === module) {
  seedData().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
} 
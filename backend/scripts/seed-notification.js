const { pool } = require('../config/database');

const seedNotification = async () => {
  try {
    // Find a test user
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    if (userResult.rows.length === 0) {
      console.log('❌ Test user not found');
      process.exit(1);
    }
    const userId = userResult.rows[0].id;

    // Insert a notification
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [userId, 'system', 'Test Notification', 'This is a seeded test notification.', JSON.stringify({ test: true })]
    );
    console.log('✅ Seeded notification:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed notification error:', error);
    process.exit(1);
  }
};

seedNotification(); 
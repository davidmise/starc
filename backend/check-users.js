const pool = require('./config/database');
const bcrypt = require('bcrypt');

async function checkAndCreateTestUser() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Check if test user exists
    const userResult = await pool.query(`
      SELECT id, username, email FROM users WHERE email = 'test@example.com'
    `);
    
    if (userResult.rows.length > 0) {
      console.log('✅ Test user exists:', userResult.rows[0]);
      return userResult.rows[0];
    }
    
    console.log('❌ Test user not found, creating...');
    
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const createUserResult = await pool.query(`
      INSERT INTO users (username, email, password, full_name, profile_pic, bio, is_verified, is_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email
    `, [
      'testuser',
      'test@example.com',
      hashedPassword,
      'Test User',
      'https://via.placeholder.com/150',
      'Test user for analytics',
      true,
      true
    ]);
    
    console.log('✅ Test user created:', createUserResult.rows[0]);
    return createUserResult.rows[0];
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAndCreateTestUser(); 
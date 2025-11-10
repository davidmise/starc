// Test script to diagnose backend issues
const { pool } = require('./config/database.js');

async function testBackend() {
    try {
        console.log('🔍 Testing database connection...');
        
        // Test basic query
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        
        // Test users table
        const users = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('✅ Users table accessible, count:', users.rows[0].count);
        
        // Test login query
        const user = await pool.query(`
            SELECT id, username, email, password, bio, profile_pic, is_verified, is_active, last_login, created_at
            FROM users 
            WHERE email = $1 AND is_active = true
        `, ['alice@test.com']);
        console.log('✅ User found:', user.rows.length > 0 ? user.rows[0].username : 'None');
        
        // Test sessions table with follows
        const sessions = await pool.query(`
            SELECT COUNT(*) as count 
            FROM live_sessions ls
            LEFT JOIN users u ON ls.user_id = u.id
            LEFT JOIN follows f ON f.followed_id = u.id
        `);
        console.log('✅ Sessions query with follows works, count:', sessions.rows[0].count);
        
        console.log('✅ All tests passed - backend should work now');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Details:', error);
    } finally {
        await pool.end();
    }
}

testBackend();
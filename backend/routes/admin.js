const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Simple admin check middleware (in production, you'd want proper role-based auth)
const isAdmin = async (req, res, next) => {
  try {
    // For demo purposes, we'll consider users with ID starting with 'admin' as admins
    // In production, you'd have a proper role system
    if (!req.user.id.startsWith('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply admin middleware to all routes
router.use(authenticateToken, isAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Get total sessions
    const sessionsResult = await pool.query('SELECT COUNT(*) as total FROM live_sessions');
    const totalSessions = parseInt(sessionsResult.rows[0].total);

    // Get total likes
    const likesResult = await pool.query('SELECT COUNT(*) as total FROM likes');
    const totalLikes = parseInt(likesResult.rows[0].total);

    // Get total comments
    const commentsResult = await pool.query('SELECT COUNT(*) as total FROM comments');
    const totalComments = parseInt(commentsResult.rows[0].total);

    // Get total bookings
    const bookingsResult = await pool.query('SELECT COUNT(*) as total FROM bookings');
    const totalBookings = parseInt(bookingsResult.rows[0].total);

    // Get total gifts
    const giftsResult = await pool.query('SELECT COUNT(*) as total FROM gifts');
    const totalGifts = parseInt(giftsResult.rows[0].total);

    // Get sessions by status
    const sessionsByStatusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM live_sessions GROUP BY status'
    );

    // Get top genres
    const topGenresResult = await pool.query(
      'SELECT genre, COUNT(*) as count FROM live_sessions GROUP BY genre ORDER BY count DESC LIMIT 10'
    );

    // Get recent sessions
    const recentSessionsResult = await pool.query(
      `SELECT 
        ls.*,
        u.username,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT b.id) as bookings_count
       FROM live_sessions ls
       LEFT JOIN users u ON ls.user_id = u.id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       LEFT JOIN bookings b ON ls.id = b.session_id
       GROUP BY ls.id, u.id
       ORDER BY ls.created_at DESC
       LIMIT 10`
    );

    // Get top users by sessions created
    const topUsersResult = await pool.query(
      `SELECT 
        u.id, u.username, u.created_at,
        COUNT(ls.id) as sessions_created,
        COUNT(DISTINCT l.session_id) as total_likes_received,
        COUNT(DISTINCT c.session_id) as total_comments_received
       FROM users u
       LEFT JOIN live_sessions ls ON u.id = ls.user_id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       GROUP BY u.id
       ORDER BY sessions_created DESC
       LIMIT 10`
    );

    res.json({
      stats: {
        totalUsers,
        totalSessions,
        totalLikes,
        totalComments,
        totalBookings,
        totalGifts
      },
      sessionsByStatus: sessionsByStatusResult.rows,
      topGenres: topGenresResult.rows,
      recentSessions: recentSessionsResult.rows,
      topUsers: topUsersResult.rows
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin view)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    // Get users with stats
    const query = `
      SELECT 
        u.id, u.username, u.email, u.bio, u.profile_pic, u.created_at,
        COUNT(DISTINCT ls.id) as sessions_created,
        COUNT(DISTINCT b.session_id) as sessions_booked,
        COUNT(DISTINCT l.session_id) as total_likes_received,
        COUNT(DISTINCT c.session_id) as total_comments_received
       FROM users u
       LEFT JOIN live_sessions ls ON u.id = ls.user_id
       LEFT JOIN bookings b ON u.id = b.user_id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await pool.query(query, values);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sessions (admin view)
router.get('/sessions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all', 
      genre = 'all',
      search = '' 
    } = req.query;

    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (status !== 'all') {
      whereConditions.push(`ls.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (genre !== 'all') {
      whereConditions.push(`ls.genre = $${paramCount}`);
      values.push(genre);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(ls.title ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM live_sessions ls
      LEFT JOIN users u ON ls.user_id = u.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    // Get sessions with user info and stats
    const query = `
      SELECT 
        ls.*,
        u.username,
        u.profile_pic,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT b.id) as bookings_count
       FROM live_sessions ls
       LEFT JOIN users u ON ls.user_id = u.id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       LEFT JOIN bookings b ON ls.id = b.session_id
       ${whereClause}
       GROUP BY ls.id, u.id
       ORDER BY ls.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await pool.query(query, values);

    res.json({
      sessions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete session (admin only)
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM live_sessions WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let dateFilter = '';
    let values = [];

    switch (period) {
      case '24h':
        dateFilter = 'WHERE created_at >= NOW() - INTERVAL \'24 hours\'';
        break;
      case '7d':
        dateFilter = 'WHERE created_at >= NOW() - INTERVAL \'7 days\'';
        break;
      case '30d':
        dateFilter = 'WHERE created_at >= NOW() - INTERVAL \'30 days\'';
        break;
      case '90d':
        dateFilter = 'WHERE created_at >= NOW() - INTERVAL \'90 days\'';
        break;
      default:
        dateFilter = 'WHERE created_at >= NOW() - INTERVAL \'7 days\'';
    }

    // Get user registrations over time
    const userRegistrationsResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM users
       ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    // Get session creations over time
    const sessionCreationsResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM live_sessions
       ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    // Get interactions over time
    const interactionsResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM (
         SELECT created_at FROM likes
         UNION ALL
         SELECT created_at FROM comments
         UNION ALL
         SELECT created_at FROM bookings
         UNION ALL
         SELECT created_at FROM gifts
       ) interactions
       ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    // Get top performing sessions
    const topSessionsResult = await pool.query(
      `SELECT 
        ls.id, ls.title, ls.genre, ls.status,
        u.username,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT b.id) as bookings_count,
        COUNT(DISTINCT g.id) as gifts_count
       FROM live_sessions ls
       LEFT JOIN users u ON ls.user_id = u.id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       LEFT JOIN bookings b ON ls.id = b.session_id
       LEFT JOIN gifts g ON ls.id = g.session_id
       GROUP BY ls.id, u.id
       ORDER BY (likes_count + comments_count + bookings_count + gifts_count) DESC
       LIMIT 10`
    );

    res.json({
      userRegistrations: userRegistrationsResult.rows,
      sessionCreations: sessionCreationsResult.rows,
      interactions: interactionsResult.rows,
      topSessions: topSessionsResult.rows
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
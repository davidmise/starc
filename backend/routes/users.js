const express = require('express');
const pool = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users with stats (was in server.js)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(u.username ILIKE $${paramCount} OR u.bio ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const query = `
      SELECT 
        u.id, u.username, u.bio, u.profile_pic, u.created_at,
        COUNT(DISTINCT ls.id) AS sessions_created,
        COUNT(DISTINCT b.session_id) AS sessions_booked,
        COUNT(DISTINCT l.session_id) AS total_likes_received,
        COUNT(DISTINCT c.session_id) AS total_comments_received,
        COALESCE(us.followers_count, 0) as followers_count,
        COALESCE(us.following_count, 0) as following_count
      FROM users u
      LEFT JOIN live_sessions ls ON u.id = ls.user_id
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN likes l ON ls.id = l.session_id
      LEFT JOIN comments c ON ls.id = c.session_id
      LEFT JOIN user_stats us ON u.id = us.user_id
      ${whereClause}
      GROUP BY u.id, us.followers_count, us.following_count
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

// Get user profile by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const result = await pool.query(
      `SELECT 
        u.id, u.username, u.bio, u.profile_pic, u.created_at,
        COUNT(DISTINCT ls.id) as sessions_created,
        COUNT(DISTINCT b.session_id) as sessions_booked,
        COUNT(DISTINCT l.session_id) as total_likes_received,
        COUNT(DISTINCT c.session_id) as total_comments_received,
        COALESCE(us.followers_count, 0) as followers_count,
        COALESCE(us.following_count, 0) as following_count
       FROM users u
       LEFT JOIN live_sessions ls ON u.id = ls.user_id
       LEFT JOIN bookings b ON u.id = b.user_id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       LEFT JOIN user_stats us ON u.id = us.user_id
       WHERE u.id = $1
       GROUP BY u.id, us.followers_count, us.following_count`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== id) {
      const followCheck = await pool.query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [currentUserId, id]
      );
      isFollowing = followCheck.rows.length > 0;
    }

    res.json({ 
      user: {
        ...user,
        is_following: isFollowing
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's created sessions
router.get('/:id/sessions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = 'all' } = req.query;

    let whereConditions = ['ls.user_id = $1'];
    let values = [id];
    let paramCount = 2;

    if (status !== 'all') {
      whereConditions.push(`ls.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM live_sessions ls
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    // Get sessions
    const query = `
      SELECT 
        ls.*,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT b.id) as bookings_count
       FROM live_sessions ls
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       LEFT JOIN bookings b ON ls.id = b.session_id
       WHERE ${whereClause}
       GROUP BY ls.id
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
    console.error('Get user sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's booked sessions
router.get('/:id/bookings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Only allow users to see their own bookings
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE user_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get booked sessions
    const query = `
      SELECT 
        ls.*,
        u.username,
        u.profile_pic,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT b2.id) as bookings_count
       FROM bookings bk
       LEFT JOIN live_sessions ls ON bk.session_id = ls.id
       LEFT JOIN users u ON ls.user_id = u.id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       LEFT JOIN bookings b2 ON ls.id = b2.session_id
       WHERE bk.user_id = $1
       GROUP BY ls.id, u.id
       ORDER BY bk.created_at DESC
       LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [id, limit, offset]);

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
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's joined sessions
router.get('/:id/joined', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Only allow users to see their own joined sessions
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM user_sessions WHERE user_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get joined sessions
    const query = `
      SELECT 
        ls.*,
        u.username,
        u.profile_pic,
        us.joined_at,
        us.left_at,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT b.id) as bookings_count
       FROM user_sessions us
       LEFT JOIN live_sessions ls ON us.session_id = ls.id
       LEFT JOIN users u ON ls.user_id = u.id
       LEFT JOIN likes l ON ls.id = l.session_id
       LEFT JOIN comments c ON ls.id = c.session_id
       LEFT JOIN bookings b ON ls.id = b.session_id
       WHERE us.user_id = $1
       GROUP BY ls.id, u.id, us.joined_at, us.left_at
       ORDER BY us.joined_at DESC
       LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [id, limit, offset]);

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
    console.error('Get user joined sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE username ILIKE $1',
      [`%${query}%`]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Search users
    const result = await pool.query(
      `SELECT 
        u.id, u.username, u.bio, u.profile_pic, u.created_at,
        COUNT(DISTINCT ls.id) as sessions_created
       FROM users u
       LEFT JOIN live_sessions ls ON u.id = ls.user_id
       WHERE u.username ILIKE $1
       GROUP BY u.id
       ORDER BY u.username
       LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit, offset]
    );

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
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user notifications
router.get('/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Only allow users to see their own notifications
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get notifications
    const query = `
      SELECT 
        n.*,
        ls.title as session_title,
        u.username as session_creator
       FROM notifications n
       LEFT JOIN live_sessions ls ON n.session_id = ls.id
       LEFT JOIN users u ON ls.user_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [id, limit, offset]);

    res.json({
      notifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    // Only allow users to mark their own notifications as read
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [notificationId, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/:id/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow users to mark their own notifications as read
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [id]
    );

    res.json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow a user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const followerId = req.user.id;

    // Can't follow yourself
    if (followerId === targetUserId) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }

    // Check if target user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );

    if (existingFollow.rows.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, targetUserId]
    );

    // Get updated stats
    const statsQuery = `
      SELECT 
        (SELECT COALESCE(followers_count, 0) FROM user_stats WHERE user_id = $1) as followers_count,
        (SELECT COALESCE(following_count, 0) FROM user_stats WHERE user_id = $2) as following_count
    `;
    const stats = await pool.query(statsQuery, [targetUserId, followerId]);

    res.json({ 
      message: 'Successfully followed user',
      is_following: true,
      followers_count: stats.rows[0].followers_count,
      following_count: stats.rows[0].following_count
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unfollow a user
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const followerId = req.user.id;

    // Delete follow relationship
    const result = await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    // Get updated stats
    const statsQuery = `
      SELECT 
        (SELECT COALESCE(followers_count, 0) FROM user_stats WHERE user_id = $1) as followers_count,
        (SELECT COALESCE(following_count, 0) FROM user_stats WHERE user_id = $2) as following_count
    `;
    const stats = await pool.query(statsQuery, [targetUserId, followerId]);

    res.json({ 
      message: 'Successfully unfollowed user',
      is_following: false,
      followers_count: stats.rows[0].followers_count,
      following_count: stats.rows[0].following_count
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if following a user
router.get('/:id/follow-status', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const followerId = req.user.id;

    const result = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );

    res.json({ 
      is_following: result.rows.length > 0
    });

  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's followers
router.get('/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM follows WHERE following_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get followers
    const result = await pool.query(
      `SELECT 
        u.id, u.username, u.profile_pic, u.bio,
        f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      followers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's following
router.get('/:id/following', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM follows WHERE follower_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get following
    const result = await pool.query(
      `SELECT 
        u.id, u.username, u.profile_pic, u.bio,
        f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      following: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
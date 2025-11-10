const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Like/Unlike a session
router.post('/like/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists
    const sessionResult = await pool.query(
      'SELECT id FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    // Check if already liked
    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND session_id = $2',
      [req.user.id, sessionId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND session_id = $2',
        [req.user.id, sessionId]
      );

      res.json({ 
        message: 'Session unliked successfully',
        liked: false 
      });
    } else {
      // Like
      await pool.query(
        'INSERT INTO likes (user_id, session_id) VALUES ($1, $2)',
        [req.user.id, sessionId]
      );

      res.json({ 
        message: 'Session liked successfully',
        liked: true 
      });
    }

  } catch (error) {
    console.error('Like/Unlike error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Comment on a session (add parent_id support)
router.post('/comment/:sessionId', authenticateToken, [
  body('message').isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { sessionId } = req.params;
    const { message, parent_id } = req.body;

    // Check if session exists
    const sessionResult = await pool.query(
      'SELECT id FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    // Create comment (with parent_id)
    const result = await pool.query(
      `INSERT INTO comments (user_id, session_id, message, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, message, created_at, parent_id`,
      [req.user.id, sessionId, message, parent_id || null]
    );

    const comment = result.rows[0];

    // Get user info for the response
    const userResult = await pool.query(
      'SELECT id, username, profile_pic FROM users WHERE id = $1',
      [req.user.id]
    );

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        id: comment.id,
        message: comment.message,
        created_at: comment.created_at,
        parent_id: comment.parent_id,
        user: userResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a session (return parent_id)
router.get('/comments/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if session exists
    const sessionResult = await pool.query(
      'SELECT id FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM comments WHERE session_id = $1',
      [sessionId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get comments with user info and parent_id
    const result = await pool.query(
      `SELECT 
        c.id, c.message, c.created_at, c.parent_id,
        u.id as user_id, u.username, u.profile_pic
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.session_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    res.json({
      comments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Book/Unbook a session
router.post('/book/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists and is scheduled
    const sessionResult = await pool.query(
      'SELECT id, status FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Can only book scheduled sessions' });
    }

    // Check if already booked
    const existingBooking = await pool.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND session_id = $2',
      [req.user.id, sessionId]
    );

    if (existingBooking.rows.length > 0) {
      // Unbook
      await pool.query(
        'DELETE FROM bookings WHERE user_id = $1 AND session_id = $2',
        [req.user.id, sessionId]
      );

      res.json({ 
        message: 'Session unbooked successfully',
        booked: false 
      });
    } else {
      // Book
      await pool.query(
        'INSERT INTO bookings (user_id, session_id) VALUES ($1, $2)',
        [req.user.id, sessionId]
      );

      res.json({ 
        message: 'Session booked successfully',
        booked: true 
      });
    }

  } catch (error) {
    console.error('Book/Unbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send gift to a session
router.post('/gift/:sessionId', authenticateToken, [
  body('gift_type').isLength({ min: 1, max: 50 }).withMessage('Gift type is required'),
  body('gift_value').optional().isInt({ min: 1 }).withMessage('Gift value must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { sessionId } = req.params;
    const { gift_type, gift_value = 1 } = req.body;

    // Check if session exists and is live
    const sessionResult = await pool.query(
      'SELECT id, status FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'live') {
      return res.status(400).json({ error: 'Can only send gifts to live sessions' });
    }

    // Send gift
    const result = await pool.query(
      `INSERT INTO gifts (user_id, session_id, gift_type, gift_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, gift_type, gift_value, created_at`,
      [req.user.id, sessionId, gift_type, gift_value]
    );

    const gift = result.rows[0];

    // Get user info for the response
    const userResult = await pool.query(
      'SELECT id, username, profile_pic FROM users WHERE id = $1',
      [req.user.id]
    );

    res.status(201).json({
      message: 'Gift sent successfully',
      gift: {
        ...gift,
        user: userResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Send gift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get gifts for a session
router.get('/gifts/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if session exists
    const sessionResult = await pool.query(
      'SELECT id FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM gifts WHERE session_id = $1',
      [sessionId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get gifts with user info
    const result = await pool.query(
      `SELECT 
        g.id, g.gift_type, g.gift_value, g.created_at,
        u.id as user_id, u.username, u.profile_pic
       FROM gifts g
       LEFT JOIN users u ON g.user_id = u.id
       WHERE g.session_id = $1
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    res.json({
      gifts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a live session
router.post('/join/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists and is live
    const sessionResult = await pool.query(
      'SELECT id, status FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'live') {
      return res.status(400).json({ error: 'Can only join live sessions' });
    }

    // Check if already joined
    const existingJoin = await pool.query(
      'SELECT id FROM user_sessions WHERE user_id = $1 AND session_id = $2',
      [req.user.id, sessionId]
    );

    if (existingJoin.rows.length > 0) {
      return res.status(400).json({ error: 'Already joined this session' });
    }

    // Join session
    await pool.query(
      'INSERT INTO user_sessions (user_id, session_id) VALUES ($1, $2)',
      [req.user.id, sessionId]
    );

    res.json({ 
      message: 'Joined session successfully',
      joined: true 
    });

  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave a live session
router.post('/leave/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Update user session to mark as left
    const result = await pool.query(
      `UPDATE user_sessions 
       SET left_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND session_id = $2 AND left_at IS NULL`,
      [req.user.id, sessionId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Not currently in this session' });
    }

    res.json({ 
      message: 'Left session successfully',
      left: true 
    });

  } catch (error) {
    console.error('Leave session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available gift types
router.get('/gifts/types/list', async (req, res) => {
  try {
    const giftTypes = [
      { type: 'star', value: 1, name: 'Star' },
      { type: 'rose', value: 5, name: 'Rose' },
      { type: 'crown', value: 10, name: 'Crown' },
      { type: 'diamond', value: 50, name: 'Diamond' },
      { type: 'rocket', value: 100, name: 'Rocket' },
      { type: 'trophy', value: 200, name: 'Trophy' }
    ];

    res.json({ giftTypes });
  } catch (error) {
    console.error('Get gift types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
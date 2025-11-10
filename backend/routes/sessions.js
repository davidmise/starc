const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const validator = require('validator');
const pool = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Create a new live session
router.post('/', authenticateToken, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), [
  body('title').optional().custom((value) => {
    if (value && (value.length < 1 || value.length > 100)) {
      throw new Error('Title must be between 1 and 100 characters');
    }
    return true;
  }),
  body('caption').optional().isLength({ max: 500 }).withMessage('Caption must be less than 500 characters'),
  body('type').isIn(['post', 'event']).withMessage('Type must be either post or event'),
  body('genre').optional().custom((value, { req }) => {
    if (req.body.type === 'event' && (!value || value.trim().length === 0)) {
      throw new Error('Genre is required for events');
    }
    if (value && (value.length < 1 || value.length > 50)) {
      throw new Error('Genre must be between 1 and 50 characters');
    }
    return true;
  }),
  body('start_time').optional().custom((value, { req }) => {
    if (req.body.type === 'event' && (!value || value.trim().length === 0)) {
      throw new Error('Start time is required for events');
    }
    if (value && !validator.isISO8601(value)) {
      throw new Error('Start time must be a valid date');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { title, caption, genre, start_time, end_time, type } = req.body;
    
    // Handle different post types
    let startTime = null;
    let endTime = null;
    let sessionGenre = null;
    let status = null; // <-- Initialize status
    
    if (type === 'event') {
      if (!genre || !start_time) {
        return res.status(400).json({ error: 'Events require both genre and start time' });
      }
      startTime = new Date(start_time);
      sessionGenre = genre;
      status = 'scheduled'; // <-- Set status for events
      
      // Set end time if provided, otherwise 2 hours after start
      if (end_time) {
        endTime = new Date(end_time);
        if (endTime <= startTime) {
          return res.status(400).json({ error: 'End time must be after start time' });
        }
      } else {
        endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      }
      
      // Check if start time is in the future for events
      if (startTime <= new Date()) {
        return res.status(400).json({ error: 'Start time must be in the future' });
      }
    } else {
      // Normal posts don't need genre, start time, or end time
      startTime = new Date(); // Set to current time for normal posts
      endTime = null;
      sessionGenre = null;
      status = 'ended'; // <-- Set status for normal posts
    }

    let poster_url = null;
    let preview_video_url = null;

    if (req.files) {
      if (req.files.poster) {
        poster_url = `/uploads/${req.files.poster[0].filename}`;
      }
      if (req.files.video) {
        preview_video_url = `/uploads/${req.files.video[0].filename}`;
      }
    }

    const result = await pool.query(
      `INSERT INTO live_sessions (user_id, title, caption, poster_url, preview_video_url, genre, start_time, end_time, type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.id, title, caption, poster_url, preview_video_url, sessionGenre, startTime, endTime, type, status]
    );

    const session = result.rows[0];

    // Get user info for the response
    const userResult = await pool.query(
      'SELECT id, username, profile_pic FROM users WHERE id = $1',
      [req.user.id]
    );

    res.status(201).json({
      message: 'Live session created successfully',
      session: {
        ...session,
        user: userResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Create session error:', error);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user.id);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get all live sessions (with optional filtering)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      status = 'all', 
      genre = 'all', 
      page = 1, 
      limit = 10,
      user_id,
      search 
    } = req.query;

    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    // Status filter
    if (status !== 'all') {
      whereConditions.push(`ls.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    // Genre filter
    if (genre !== 'all') {
      whereConditions.push(`ls.genre = $${paramCount}`);
      values.push(genre);
      paramCount++;
    }

    // User filter
    if (user_id) {
      whereConditions.push(`ls.user_id = $${paramCount}`);
      values.push(user_id);
      paramCount++;
    }

    // Search filter - searches across title, caption, genre, and username
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      whereConditions.push(`(
        LOWER(ls.title) LIKE $${paramCount} OR 
        LOWER(ls.caption) LIKE $${paramCount} OR 
        LOWER(ls.genre) LIKE $${paramCount} OR 
        LOWER(u.username) LIKE $${paramCount}
      )`);
      values.push(searchTerm);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count (include user join for search functionality)
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

    // Updated query with all required fields and counts including user interaction status
    const query = `
      SELECT 
        ls.id,
        ls.title,
        ls.caption,
        ls.genre,
        ls.status,
        ls.start_time,
        ls.created_at,
        ls.user_id,
        ls.poster_url,
        ls.preview_video_url,
        ls.status,
        COALESCE(likes.count, 0) AS likes_count,
        COALESCE(comments.count, 0) AS comments_count,
        COALESCE(bookings.count, 0) AS bookings_count,
        u.username,
        u.profile_pic,
        ${req.user ? `EXISTS(SELECT 1 FROM likes WHERE user_id = $${paramCount + 2} AND session_id = ls.id) as is_liked,` : 'false as is_liked,'}
        ${req.user ? `EXISTS(SELECT 1 FROM bookings WHERE user_id = $${paramCount + 2} AND session_id = ls.id) as is_booked,` : 'false as is_booked,'}
        ${req.user ? `EXISTS(SELECT 1 FROM follows WHERE follower_id = $${paramCount + 2} AND following_id = ls.user_id) as is_following` : 'false as is_following'}
      FROM live_sessions ls
      LEFT JOIN users u ON ls.user_id = u.id
      LEFT JOIN (
        SELECT session_id, COUNT(*) as count FROM likes GROUP BY session_id
      ) likes ON ls.id = likes.session_id
      LEFT JOIN (
        SELECT session_id, COUNT(*) as count FROM comments GROUP BY session_id
      ) comments ON ls.id = comments.session_id
      LEFT JOIN (
        SELECT session_id, COUNT(*) as count FROM bookings GROUP BY session_id
      ) bookings ON ls.id = bookings.session_id
      ${whereClause}
      ORDER BY ls.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    // Add user ID to values if user is authenticated for interaction status queries
    if (req.user) {
      values.push(req.user.id);
    }
    
    const sessionsResult = await pool.query(query, values);
    // Map to nest user info
    const sessions = sessionsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      caption: row.caption,
      genre: row.genre,
      status: row.status,
      start_time: row.start_time,
      created_at: row.created_at,
      poster_url: row.poster_url,
      preview_video_url: row.preview_video_url,
      type: row.status,  // Using status column as type
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      bookings_count: row.bookings_count,
      is_liked: row.is_liked,
      is_booked: row.is_booked,
      user: {
        id: row.user_id,
        username: row.username,
        profile_pic: row.profile_pic,
        is_following: row.is_following
      }
    }));

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific live session
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ls.*,
        u.id as user_id,
        u.username,
        u.profile_pic,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT b.id) as bookings_count,
        ${req.user ? `EXISTS(SELECT 1 FROM likes WHERE user_id = $2 AND session_id = ls.id) as is_liked,` : ''}
        ${req.user ? `EXISTS(SELECT 1 FROM bookings WHERE user_id = $2 AND session_id = ls.id) as is_booked,` : ''}
        ${req.user ? `EXISTS(SELECT 1 FROM user_sessions WHERE user_id = $2 AND session_id = ls.id) as has_joined` : ''}
      FROM live_sessions ls
      LEFT JOIN users u ON ls.user_id = u.id
      LEFT JOIN likes l ON ls.id = l.session_id
      LEFT JOIN comments c ON ls.id = c.session_id
      LEFT JOIN bookings b ON ls.id = b.session_id
      WHERE ls.id = $1
      GROUP BY ls.id, u.id
    `;

    const values = req.user ? [id, req.user.id] : [id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    res.json({ session: result.rows[0] });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update live session status (start/end session)
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['scheduled', 'live', 'ended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if session exists and belongs to user
    const sessionResult = await pool.query(
      'SELECT * FROM live_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found or unauthorized' });
    }

    const session = sessionResult.rows[0];

    // Validate status transitions
    if (session.status === 'ended' && status !== 'ended') {
      return res.status(400).json({ error: 'Cannot modify ended session' });
    }

    if (status === 'live' && session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Can only start live sessions from scheduled status' });
    }

    // Update status
    await pool.query(
      'UPDATE live_sessions SET status = $1 WHERE id = $2',
      [status, id]
    );

    res.json({ 
      message: `Session ${status === 'live' ? 'started' : status === 'ended' ? 'ended' : 'updated'} successfully`,
      status 
    });

  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete live session
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if session exists and belongs to user
    const sessionResult = await pool.query(
      'SELECT * FROM live_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found or unauthorized' });
    }

    const session = sessionResult.rows[0];

    // Prevent deletion of live or ended sessions
    if (session.status === 'live' || session.status === 'ended') {
      return res.status(400).json({ error: 'Cannot delete live or ended sessions' });
    }

    // Delete session (cascade will handle related records)
    await pool.query('DELETE FROM live_sessions WHERE id = $1', [id]);

    res.json({ message: 'Live session deleted successfully' });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start a live session
router.put('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if session exists and user is the creator
    const sessionResult = await pool.query(
      'SELECT id, user_id, status, start_time FROM live_sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Only session creator can start the session' });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Session can only be started if it is scheduled' });
    }

    const now = new Date();
    const startTime = new Date(session.start_time);

    // Allow starting 5 minutes before scheduled time
    if (now < new Date(startTime.getTime() - 5 * 60 * 1000)) {
      return res.status(400).json({ error: 'Session cannot be started yet' });
    }

    // Update session status to live
    await pool.query(
      'UPDATE live_sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['live', id]
    );

    // Notify all users who booked this session
    const bookedUsers = await pool.query(
      'SELECT user_id FROM bookings WHERE session_id = $1 AND status = $2',
      [id, 'confirmed']
    );

    // Emit socket event for real-time updates
    req.app.get('io').emit('session-started', {
      sessionId: id,
      startedBy: {
        id: userId,
        username: req.user.username
      }
    });

    res.json({
      message: 'Session started successfully',
      session: {
        id,
        status: 'live',
        startedAt: now
      }
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End a live session
router.put('/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if session exists and user is the creator
    const sessionResult = await pool.query(
      'SELECT id, user_id, status FROM live_sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Only session creator can end the session' });
    }

    if (session.status !== 'live') {
      return res.status(400).json({ error: 'Session is not live' });
    }

    // Update session status to ended
    await pool.query(
      'UPDATE live_sessions SET status = $1, end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['ended', id]
    );

    // Emit socket event for real-time updates
    req.app.get('io').emit('session-ended', {
      sessionId: id,
      endedBy: {
        id: userId,
        username: req.user.username
      }
    });

    res.json({
      message: 'Session ended successfully',
      session: {
        id,
        status: 'ended',
        endedAt: new Date()
      }
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get live session data
router.get('/:id/live', async (req, res) => {
  try {
    const { id } = req.params;

    // Get session with creator info
    const sessionResult = await pool.query(
      `SELECT 
        ls.id, ls.title, ls.caption, ls.genre, ls.status, ls.start_time, ls.end_time,
        ls.viewer_count, ls.like_count, ls.comment_count,
        u.id as creator_id, u.username as creator_username, u.profile_pic as creator_pic
       FROM live_sessions ls
       JOIN users u ON ls.user_id = u.id
       WHERE ls.id = $1`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Get recent comments
    const commentsResult = await pool.query(
      `SELECT 
        c.id, c.message, c.created_at,
        u.id as user_id, u.username, u.profile_pic
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.session_id = $1
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [id]
    );

    // Get recent gifts
    const giftsResult = await pool.query(
      `SELECT 
        g.id, g.gift_type, g.gift_value, g.created_at,
        u.id as user_id, u.username, u.profile_pic
       FROM gifts g
       JOIN users u ON g.user_id = u.id
       WHERE g.session_id = $1
       ORDER BY g.created_at DESC
       LIMIT 20`,
      [id]
    );

    // Get current viewers count
    const viewersResult = await pool.query(
      'SELECT COUNT(*) as viewer_count FROM user_sessions WHERE session_id = $1 AND left_at IS NULL',
      [id]
    );

    res.json({
      session: {
        id: session.id,
        title: session.title,
        caption: session.caption,
        genre: session.genre,
        status: session.status,
        start_time: session.start_time,
        end_time: session.end_time,
        viewer_count: parseInt(viewersResult.rows[0].viewer_count),
        like_count: session.like_count,
        comment_count: session.comment_count,
        creator: {
          id: session.creator_id,
          username: session.creator_username,
          profile_pic: session.creator_pic
        }
      },
      comments: commentsResult.rows,
      gifts: giftsResult.rows
    });

  } catch (error) {
    console.error('Get live session error:', error);
    res.status(500).json({ error: 'Failed to get live session data' });
  }
});

// Get genres
router.get('/genres/list', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY name');
    res.json({ genres: result.rows });
  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
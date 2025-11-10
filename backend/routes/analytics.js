const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

// Root analytics endpoint - returns basic stats
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Basic statistics
    const [
      usersResult,
      sessionsResult,
      likesResult,
      commentsResult,
      bookingsResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM users'),
      pool.query('SELECT COUNT(*) as total FROM live_sessions'),
      pool.query('SELECT COUNT(*) as total FROM likes'),
      pool.query('SELECT COUNT(*) as total FROM comments'),
      pool.query('SELECT COUNT(*) as total FROM bookings')
    ]);

    // Sessions by status
    const sessionsByStatusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM live_sessions GROUP BY status'
    );

    // Top genres
    const topGenresResult = await pool.query(
      'SELECT genre, COUNT(*) as count FROM live_sessions GROUP BY genre ORDER BY count DESC LIMIT 5'
    );

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalSessions: parseInt(sessionsResult.rows[0].total),
        totalLikes: parseInt(likesResult.rows[0].total),
        totalComments: parseInt(commentsResult.rows[0].total),
        totalBookings: parseInt(bookingsResult.rows[0].total)
      },
      sessionsByStatus: sessionsByStatusResult.rows,
      topGenres: topGenresResult.rows
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comprehensive analytics dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Basic statistics
    const [
      usersResult,
      sessionsResult,
      likesResult,
      commentsResult,
      bookingsResult,
      giftsResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM users'),
      pool.query('SELECT COUNT(*) as total FROM live_sessions'),
      pool.query('SELECT COUNT(*) as total FROM likes'),
      pool.query('SELECT COUNT(*) as total FROM comments'),
      pool.query('SELECT COUNT(*) as total FROM bookings'),
      pool.query('SELECT COUNT(*) as total FROM gifts')
    ]);

    // Sessions by status
    const sessionsByStatusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM live_sessions GROUP BY status'
    );

    // Top genres
    const topGenresResult = await pool.query(
      'SELECT genre, COUNT(*) as count FROM live_sessions GROUP BY genre ORDER BY count DESC LIMIT 10'
    );

    // Top creators (simplified query)
    const topCreatorsResult = await pool.query(`
      SELECT 
        u.username,
        u.profile_pic,
        COUNT(ls.id) as sessions_created,
        COALESCE(SUM(ls.viewer_count), 0) as total_viewers,
        COALESCE(COUNT(l.id), 0) as total_likes,
        COALESCE(COUNT(c.id), 0) as total_comments
      FROM users u
      LEFT JOIN live_sessions ls ON u.id = ls.user_id
      LEFT JOIN likes l ON ls.id = l.session_id
      LEFT JOIN comments c ON ls.id = c.session_id
      GROUP BY u.id, u.username, u.profile_pic
      ORDER BY sessions_created DESC
      LIMIT 10
    `);

    // Recent activity (simplified)
    const recentActivityResult = await pool.query(`
      SELECT 
        'session_created' as type,
        ls.title as title,
        u.username as username,
        ls.created_at as timestamp,
        ls.id as session_id
      FROM live_sessions ls
      JOIN users u ON ls.user_id = u.id
      ORDER BY ls.created_at DESC
      LIMIT 10
    `);

    // Engagement metrics (simplified)
    const engagementResult = await pool.query(`
      SELECT 
        COALESCE(AVG(ls.viewer_count), 0) as avg_viewers,
        COALESCE(AVG(ls.like_count), 0) as avg_likes,
        COALESCE(AVG(ls.comment_count), 0) as avg_comments,
        COALESCE(MAX(ls.viewer_count), 0) as max_viewers,
        COALESCE(MAX(ls.like_count), 0) as max_likes,
        COALESCE(MAX(ls.comment_count), 0) as max_comments
      FROM live_sessions ls
      WHERE ls.status = 'ended'
    `);

    // Time-based analytics (simplified)
    const timeAnalyticsResult = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', ls.created_at) as hour,
        COUNT(*) as sessions_created,
        COALESCE(AVG(ls.viewer_count), 0) as avg_viewers
      FROM live_sessions ls
      WHERE ls.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('hour', ls.created_at)
      ORDER BY hour DESC
      LIMIT 24
    `);

    // User growth
    const userGrowthResult = await pool.query(`
      SELECT 
        DATE_TRUNC('day', u.created_at) as day,
        COUNT(*) as new_users
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', u.created_at)
      ORDER BY day DESC
      LIMIT 30
    `);

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalSessions: parseInt(sessionsResult.rows[0].total),
        totalLikes: parseInt(likesResult.rows[0].total),
        totalComments: parseInt(commentsResult.rows[0].total),
        totalBookings: parseInt(bookingsResult.rows[0].total),
        totalGifts: parseInt(giftsResult.rows[0].total)
      },
      sessionsByStatus: sessionsByStatusResult.rows,
      topGenres: topGenresResult.rows,
      topCreators: topCreatorsResult.rows,
      recentActivity: recentActivityResult.rows,
      engagement: engagementResult.rows[0],
      timeAnalytics: timeAnalyticsResult.rows,
      userGrowth: userGrowthResult.rows
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user-specific analytics
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // User sessions
    const sessionsResult = await pool.query(`
      SELECT 
        id, title, status, start_time, 
        COALESCE(viewer_count, 0) as viewer_count,
        COALESCE(like_count, 0) as likes_count,
        COALESCE(comment_count, 0) as comments_count
      FROM live_sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    // User engagement (simplified)
    const engagementResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT ls.id) as sessions_created,
        COALESCE(SUM(ls.viewer_count), 0) as total_viewers,
        COALESCE(SUM(ls.like_count), 0) as total_likes,
        COALESCE(SUM(ls.comment_count), 0) as total_comments,
        COUNT(DISTINCT b.session_id) as sessions_booked,
        COUNT(DISTINCT l.session_id) as sessions_liked,
        COUNT(DISTINCT c.session_id) as sessions_commented
      FROM users u
      LEFT JOIN live_sessions ls ON u.id = ls.user_id
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN likes l ON u.id = l.user_id
      LEFT JOIN comments c ON u.id = c.user_id
      WHERE u.id = $1
    `, [userId]);

    // User activity timeline (simplified)
    const activityResult = await pool.query(`
      SELECT 
        'session_created' as type,
        ls.title as title,
        ls.created_at as timestamp,
        ls.id as session_id
      FROM live_sessions ls
      WHERE ls.user_id = $1
      ORDER BY ls.created_at DESC
      LIMIT 20
    `, [userId]);

    // User achievements
    const achievementsResult = await pool.query(`
      SELECT 
        CASE 
          WHEN COUNT(ls.id) >= 10 THEN 'Prolific Creator'
          WHEN COUNT(ls.id) >= 5 THEN 'Active Creator'
          WHEN COUNT(ls.id) >= 1 THEN 'First Session'
          ELSE 'New User'
        END as achievement,
        COUNT(ls.id) as sessions_created
      FROM users u
      LEFT JOIN live_sessions ls ON u.id = ls.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    res.json({
      sessions: sessionsResult.rows,
      engagement: engagementResult.rows[0],
      activity: activityResult.rows,
      achievements: achievementsResult.rows
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session analytics
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Session details
    const sessionResult = await pool.query(`
      SELECT 
        ls.*,
        u.username as creator_name,
        u.profile_pic as creator_avatar
      FROM live_sessions ls
      JOIN users u ON ls.user_id = u.id
      WHERE ls.id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Viewer analytics (simplified)
    const viewerAnalyticsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_viewers,
        COUNT(DISTINCT user_id) as unique_viewers,
        COALESCE(AVG(viewer_count), 0) as avg_viewers_per_minute
      FROM user_sessions
      WHERE session_id = $1
    `, [sessionId]);

    // Engagement analytics (simplified)
    const engagementResult = await pool.query(`
      SELECT 
        COUNT(l.id) as total_likes,
        COUNT(c.id) as total_comments,
        COUNT(g.id) as total_gifts,
        COUNT(DISTINCT l.user_id) as unique_likers,
        COUNT(DISTINCT c.user_id) as unique_commenters,
        COUNT(DISTINCT g.user_id) as unique_gifters
      FROM live_sessions ls
      LEFT JOIN likes l ON ls.id = l.session_id
      LEFT JOIN comments c ON ls.id = c.session_id
      LEFT JOIN gifts g ON ls.id = g.session_id
      WHERE ls.id = $1
    `, [sessionId]);

    // Real-time metrics (if session is live)
    let realTimeMetrics = null;
    if (session.status === 'live') {
      const realTimeResult = await pool.query(`
        SELECT 
          COUNT(*) as current_viewers,
          COUNT(DISTINCT user_id) as unique_current_viewers
        FROM user_sessions
        WHERE session_id = $1 AND joined_at >= NOW() - INTERVAL '5 minutes'
      `, [sessionId]);
      realTimeMetrics = realTimeResult.rows[0];
    }

    res.json({
      session,
      viewerAnalytics: viewerAnalyticsResult.rows[0],
      engagement: engagementResult.rows[0],
      realTimeMetrics
    });

  } catch (error) {
    console.error('Session analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get platform trends
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    let interval;
    
    switch (period) {
      case '24h':
        interval = '1 hour';
        break;
      case '7d':
        interval = '1 day';
        break;
      case '30d':
        interval = '1 day';
        break;
      default:
        interval = '1 day';
    }

    // Session creation trends (simplified)
    const sessionTrendsResult = await pool.query(`
      SELECT 
        DATE_TRUNC($1, ls.created_at) as time_period,
        COUNT(*) as sessions_created,
        COALESCE(AVG(ls.viewer_count), 0) as avg_viewers
      FROM live_sessions ls
      WHERE ls.created_at >= NOW() - INTERVAL '${period}'
      GROUP BY DATE_TRUNC($1, ls.created_at)
      ORDER BY time_period DESC
    `, [interval]);

    // User registration trends
    const userTrendsResult = await pool.query(`
      SELECT 
        DATE_TRUNC($1, u.created_at) as time_period,
        COUNT(*) as new_users
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '${period}'
      GROUP BY DATE_TRUNC($1, u.created_at)
      ORDER BY time_period DESC
    `, [interval]);

    // Engagement trends (simplified)
    const engagementTrendsResult = await pool.query(`
      SELECT 
        DATE_TRUNC($1, ls.created_at) as time_period,
        COUNT(l.id) as total_likes,
        COUNT(c.id) as total_comments,
        COUNT(g.id) as total_gifts
      FROM live_sessions ls
      LEFT JOIN likes l ON ls.id = l.session_id
      LEFT JOIN comments c ON ls.id = c.session_id
      LEFT JOIN gifts g ON ls.id = g.session_id
      WHERE ls.created_at >= NOW() - INTERVAL '${period}'
      GROUP BY DATE_TRUNC($1, ls.created_at)
      ORDER BY time_period DESC
    `, [interval]);

    res.json({
      sessionTrends: sessionTrendsResult.rows,
      userTrends: userTrendsResult.rows,
      engagementTrends: engagementTrendsResult.rows
    });

  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
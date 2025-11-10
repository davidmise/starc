const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;

    let whereConditions = [`n.user_id = $1`];
    let values = [userId];
    let paramCount = 2;

    if (unread_only === 'true') {
      whereConditions.push(`n.is_read = FALSE`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get notifications with pagination
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const query = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.is_read,
        n.created_at,
        ls.title as session_title,
        ls.id as session_id,
        u.username as sender_username,
        u.profile_pic as sender_avatar
      FROM notifications n
      LEFT JOIN live_sessions ls ON n.session_id = ls.id
      LEFT JOIN users u ON n.data->>'sender_id' = u.id::text
      WHERE ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await pool.query(query, values);

    // Parse JSON data
    const notifications = result.rows.map(row => ({
      ...row,
      data: row.data ? JSON.parse(row.data) : {}
    }));

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notificationId: id
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.rowCount
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification deleted',
      notificationId: id
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      unreadCount: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Send notification (admin only)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { userId, type, title, message, sessionId = null, data = {} } = req.body;

    // Check if user is admin (you can implement your own admin check)
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Only admins can send notifications' });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, session_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userId, sessionId, type, title, message, JSON.stringify(data)]
    );

    const notification = result.rows[0];

    res.json({
      message: 'Notification sent successfully',
      notification: {
        id: notification.id,
        type,
        title,
        message,
        data,
        created_at: notification.created_at
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router; 
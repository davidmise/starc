const { pool } = require('../config/database');

const setupNotificationHandlers = (io) => {
  // Send notification to user
  const sendNotification = async (userId, notificationData) => {
    try {
      const { type, title, message, sessionId = null, data = {} } = notificationData;

      // Save notification to database
      const result = await pool.query(
        `INSERT INTO notifications (user_id, session_id, type, title, message, data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at`,
        [userId, sessionId, type, title, message, JSON.stringify(data)]
      );

      const notification = result.rows[0];

      // Emit to specific user if online
      io.to(`user-${userId}`).emit('new-notification', {
        id: notification.id,
        type,
        title,
        message,
        data,
        created_at: notification.created_at,
        is_read: false
      });

      return notification;
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (userId, notificationId) => {
    try {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );

      // Emit read status update
      io.to(`user-${userId}`).emit('notification-read', { notificationId });

      return true;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  };

  // Send session start notification to booked users
  const sendSessionStartNotification = async (sessionId, creatorId) => {
    try {
      // Get session details
      const sessionResult = await pool.query(
        'SELECT title, caption FROM live_sessions WHERE id = $1',
        [sessionId]
      );

      if (sessionResult.rows.length === 0) return;

      const session = sessionResult.rows[0];

      // Get all users who booked this session
      const bookedUsersResult = await pool.query(
        'SELECT user_id FROM bookings WHERE session_id = $1 AND status = $2',
        [sessionId, 'confirmed']
      );

      const notifications = [];

      for (const booking of bookedUsersResult.rows) {
        const notification = await sendNotification(booking.user_id, {
          type: 'session_start',
          title: 'Live Session Starting!',
          message: `"${session.title}" is now live! Join the session now.`,
          sessionId,
          data: {
            sessionTitle: session.title,
            sessionCaption: session.caption
          }
        });

        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Send session start notification error:', error);
      throw error;
    }
  };

  // Send session reminder notification
  const sendSessionReminderNotification = async (sessionId, minutesBefore = 10) => {
    try {
      // Get session details
      const sessionResult = await pool.query(
        'SELECT title, caption, user_id FROM live_sessions WHERE id = $1',
        [sessionId]
      );

      if (sessionResult.rows.length === 0) return;

      const session = sessionResult.rows[0];

      // Send reminder to creator
      await sendNotification(session.user_id, {
        type: 'session_reminder',
        title: 'Session Reminder',
        message: `Your session "${session.title}" starts in ${minutesBefore} minutes. Get ready!`,
        sessionId,
        data: {
          sessionTitle: session.title,
          minutesBefore
        }
      });

      // Send reminder to booked users
      const bookedUsersResult = await pool.query(
        'SELECT user_id FROM bookings WHERE session_id = $1 AND status = $2',
        [sessionId, 'confirmed']
      );

      for (const booking of bookedUsersResult.rows) {
        await sendNotification(booking.user_id, {
          type: 'session_reminder',
          title: 'Session Reminder',
          message: `"${session.title}" starts in ${minutesBefore} minutes. Don't miss it!`,
          sessionId,
          data: {
            sessionTitle: session.title,
            minutesBefore
          }
        });
      }
    } catch (error) {
      console.error('Send session reminder notification error:', error);
      throw error;
    }
  };

  // Send booking notification to session creator
  const sendBookingNotification = async (sessionId, bookerId) => {
    try {
      // Get session and booker details
      const sessionResult = await pool.query(
        'SELECT title, user_id FROM live_sessions WHERE id = $1',
        [sessionId]
      );

      const bookerResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [bookerId]
      );

      if (sessionResult.rows.length === 0 || bookerResult.rows.length === 0) return;

      const session = sessionResult.rows[0];
      const booker = bookerResult.rows[0];

      await sendNotification(session.user_id, {
        type: 'booking',
        title: 'New Booking!',
        message: `${booker.username} booked your session "${session.title}"`,
        sessionId,
        data: {
          bookerUsername: booker.username,
          sessionTitle: session.title
        }
      });
    } catch (error) {
      console.error('Send booking notification error:', error);
      throw error;
    }
  };

  // Send like notification
  const sendLikeNotification = async (sessionId, likerId) => {
    try {
      // Get session and liker details
      const sessionResult = await pool.query(
        'SELECT title, user_id FROM live_sessions WHERE id = $1',
        [sessionId]
      );

      const likerResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [likerId]
      );

      if (sessionResult.rows.length === 0 || likerResult.rows.length === 0) return;

      const session = sessionResult.rows[0];
      const liker = likerResult.rows[0];

      // Don't send notification if user likes their own session
      if (session.user_id === likerId) return;

      await sendNotification(session.user_id, {
        type: 'like',
        title: 'New Like!',
        message: `${liker.username} liked your session "${session.title}"`,
        sessionId,
        data: {
          likerUsername: liker.username,
          sessionTitle: session.title
        }
      });
    } catch (error) {
      console.error('Send like notification error:', error);
      throw error;
    }
  };

  // Send comment notification
  const sendCommentNotification = async (sessionId, commenterId) => {
    try {
      // Get session and commenter details
      const sessionResult = await pool.query(
        'SELECT title, user_id FROM live_sessions WHERE id = $1',
        [sessionId]
      );

      const commenterResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [commenterId]
      );

      if (sessionResult.rows.length === 0 || commenterResult.rows.length === 0) return;

      const session = sessionResult.rows[0];
      const commenter = commenterResult.rows[0];

      // Don't send notification if user comments on their own session
      if (session.user_id === commenterId) return;

      await sendNotification(session.user_id, {
        type: 'comment',
        title: 'New Comment!',
        message: `${commenter.username} commented on your session "${session.title}"`,
        sessionId,
        data: {
          commenterUsername: commenter.username,
          sessionTitle: session.title
        }
      });
    } catch (error) {
      console.error('Send comment notification error:', error);
      throw error;
    }
  };

  // Send gift notification
  const sendGiftNotification = async (sessionId, gifterId, giftType) => {
    try {
      // Get session and gifter details
      const sessionResult = await pool.query(
        'SELECT title, user_id FROM live_sessions WHERE id = $1',
        [sessionId]
      );

      const gifterResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [gifterId]
      );

      if (sessionResult.rows.length === 0 || gifterResult.rows.length === 0) return;

      const session = sessionResult.rows[0];
      const gifter = gifterResult.rows[0];

      // Don't send notification if user gifts their own session
      if (session.user_id === gifterId) return;

      await sendNotification(session.user_id, {
        type: 'gift',
        title: 'New Gift!',
        message: `${gifter.username} sent you a ${giftType} gift during "${session.title}"`,
        sessionId,
        data: {
          gifterUsername: gifter.username,
          giftType,
          sessionTitle: session.title
        }
      });
    } catch (error) {
      console.error('Send gift notification error:', error);
      throw error;
    }
  };

  return {
    sendNotification,
    markNotificationAsRead,
    sendSessionStartNotification,
    sendSessionReminderNotification,
    sendBookingNotification,
    sendLikeNotification,
    sendCommentNotification,
    sendGiftNotification
  };
};

module.exports = { setupNotificationHandlers }; 
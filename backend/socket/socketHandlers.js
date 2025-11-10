const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const result = await pool.query(
        'SELECT id, username, profile_pic FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = result.rows[0];
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Join a live session room
    socket.on('join-session', async (sessionId) => {
      try {
        // Check if session exists and is live
        const sessionResult = await pool.query(
          'SELECT id, status FROM live_sessions WHERE id = $1',
          [sessionId]
        );

        if (sessionResult.rows.length === 0) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const session = sessionResult.rows[0];

        if (session.status !== 'live') {
          socket.emit('error', { message: 'Session is not live' });
          return;
        }

        // Join the session room
        socket.join(`session-${sessionId}`);

        // Record user joining the session
        await pool.query(
          `INSERT INTO user_sessions (user_id, session_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, session_id) DO NOTHING`,
          [socket.user.id, sessionId]
        );

        // Notify others in the session
        socket.to(`session-${sessionId}`).emit('user-joined', {
          user: {
            id: socket.user.id,
            username: socket.user.username,
            profile_pic: socket.user.profile_pic
          },
          timestamp: new Date()
        });

        // Send session info to the user
        socket.emit('session-joined', {
          sessionId,
          message: 'Successfully joined session'
        });

        console.log(`User ${socket.user.username} joined session ${sessionId}`);

      } catch (error) {
        console.error('Join session error:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Leave a live session room
    socket.on('leave-session', async (sessionId) => {
      try {
        // Leave the session room
        socket.leave(`session-${sessionId}`);

        // Record user leaving the session
        await pool.query(
          `UPDATE user_sessions 
           SET left_at = CURRENT_TIMESTAMP 
           WHERE user_id = $1 AND session_id = $2 AND left_at IS NULL`,
          [socket.user.id, sessionId]
        );

        // Notify others in the session
        socket.to(`session-${sessionId}`).emit('user-left', {
          user: {
            id: socket.user.id,
            username: socket.user.username,
            profile_pic: socket.user.profile_pic
          },
          timestamp: new Date()
        });

        console.log(`User ${socket.user.username} left session ${sessionId}`);

      } catch (error) {
        console.error('Leave session error:', error);
      }
    });

    // Send a comment in a live session
    socket.on('send-comment', async (data) => {
      try {
        const { sessionId, message } = data;

        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: 'Comment cannot be empty' });
          return;
        }

        if (message.length > 500) {
          socket.emit('error', { message: 'Comment too long' });
          return;
        }

        // Check if session exists and is live
        const sessionResult = await pool.query(
          'SELECT id, status FROM live_sessions WHERE id = $1',
          [sessionId]
        );

        if (sessionResult.rows.length === 0) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const session = sessionResult.rows[0];

        if (session.status !== 'live') {
          socket.emit('error', { message: 'Session is not live' });
          return;
        }

        // Save comment to database
        const commentResult = await pool.query(
          `INSERT INTO comments (user_id, session_id, message)
           VALUES ($1, $2, $3)
           RETURNING id, message, created_at`,
          [socket.user.id, sessionId, message.trim()]
        );

        const comment = commentResult.rows[0];

        // Broadcast comment to all users in the session
        io.to(`session-${sessionId}`).emit('new-comment', {
          id: comment.id,
          message: comment.message,
          created_at: comment.created_at,
          user: {
            id: socket.user.id,
            username: socket.user.username,
            profile_pic: socket.user.profile_pic
          }
        });

        console.log(`Comment sent in session ${sessionId} by ${socket.user.username}`);

      } catch (error) {
        console.error('Send comment error:', error);
        socket.emit('error', { message: 'Failed to send comment' });
      }
    });

    // Send a gift in a live session
    socket.on('send-gift', async (data) => {
      try {
        const { sessionId, giftType, giftValue = 1 } = data;

        // Check if session exists and is live
        const sessionResult = await pool.query(
          'SELECT id, status FROM live_sessions WHERE id = $1',
          [sessionId]
        );

        if (sessionResult.rows.length === 0) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const session = sessionResult.rows[0];

        if (session.status !== 'live') {
          socket.emit('error', { message: 'Session is not live' });
          return;
        }

        // Save gift to database
        const giftResult = await pool.query(
          `INSERT INTO gifts (user_id, session_id, gift_type, gift_value)
           VALUES ($1, $2, $3, $4)
           RETURNING id, gift_type, gift_value, created_at`,
          [socket.user.id, sessionId, giftType, giftValue]
        );

        const gift = giftResult.rows[0];

        // Broadcast gift to all users in the session
        io.to(`session-${sessionId}`).emit('new-gift', {
          id: gift.id,
          gift_type: gift.gift_type,
          gift_value: gift.gift_value,
          created_at: gift.created_at,
          user: {
            id: socket.user.id,
            username: socket.user.username,
            profile_pic: socket.user.profile_pic
          }
        });

        console.log(`Gift sent in session ${sessionId} by ${socket.user.username}`);

      } catch (error) {
        console.error('Send gift error:', error);
        socket.emit('error', { message: 'Failed to send gift' });
      }
    });

    // Like a session
    socket.on('like-session', async (sessionId) => {
      try {
        // Check if session exists
        const sessionResult = await pool.query(
          'SELECT id FROM live_sessions WHERE id = $1',
          [sessionId]
        );

        if (sessionResult.rows.length === 0) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Check if already liked
        const existingLike = await pool.query(
          'SELECT id FROM likes WHERE user_id = $1 AND session_id = $2',
          [socket.user.id, sessionId]
        );

        if (existingLike.rows.length > 0) {
          // Unlike
          await pool.query(
            'DELETE FROM likes WHERE user_id = $1 AND session_id = $2',
            [socket.user.id, sessionId]
          );

          io.to(`session-${sessionId}`).emit('session-unliked', {
            user: {
              id: socket.user.id,
              username: socket.user.username
            }
          });
        } else {
          // Like
          await pool.query(
            'INSERT INTO likes (user_id, session_id) VALUES ($1, $2)',
            [socket.user.id, sessionId]
          );

          io.to(`session-${sessionId}`).emit('session-liked', {
            user: {
              id: socket.user.id,
              username: socket.user.username
            }
          });
        }

        console.log(`Session ${sessionId} ${existingLike.rows.length > 0 ? 'unliked' : 'liked'} by ${socket.user.username}`);

      } catch (error) {
        console.error('Like session error:', error);
        socket.emit('error', { message: 'Failed to like session' });
      }
    });

    // Handle session status changes
    socket.on('session-status-change', async (data) => {
      try {
        const { sessionId, status } = data;

        // Check if user is the session creator
        const sessionResult = await pool.query(
          'SELECT user_id FROM live_sessions WHERE id = $1',
          [sessionId]
        );

        if (sessionResult.rows.length === 0) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const session = sessionResult.rows[0];

        if (session.user_id !== socket.user.id) {
          socket.emit('error', { message: 'Only session creator can change status' });
          return;
        }

        // Update session status
        await pool.query(
          'UPDATE live_sessions SET status = $1 WHERE id = $2',
          [status, sessionId]
        );

        // Broadcast status change to all users
        io.emit('session-status-updated', {
          sessionId,
          status,
          updatedBy: {
            id: socket.user.id,
            username: socket.user.username
          }
        });

        console.log(`Session ${sessionId} status changed to ${status} by ${socket.user.username}`);

      } catch (error) {
        console.error('Session status change error:', error);
        socket.emit('error', { message: 'Failed to update session status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
    });
  });
};

module.exports = { setupSocketHandlers }; 
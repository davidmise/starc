const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const pool = require('./config/database'); // ✅ Load pool once globally

// Routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');
const interactionRoutes = require('./routes/interactions');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

// Socket
const { setupSocketHandlers } = require('./socket/socketHandlers');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8081", "http://192.168.1.197:3000", "http://192.168.1.197:8081", "exp://192.168.1.197:8081"],
    methods: ["GET", "POST"]
  }
});

// Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000  // Increased for development
});

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:8081", "http://192.168.1.197:3000", "http://192.168.1.197:8081", "exp://192.168.1.197:8081"],
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static('uploads'));

// Use modular routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

//
// ⬇️ CUSTOM ROUTES ⬇️
//

// Removed conflicting GET /api/users route - handled in routes/users.js

// STATS ENDPOINT
app.get('/api/stats', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    const sessionsResult = await pool.query('SELECT COUNT(*) as total FROM live_sessions');
    const totalSessions = parseInt(sessionsResult.rows[0].total);

    const likesResult = await pool.query('SELECT COUNT(*) as total FROM likes');
    const totalLikes = parseInt(likesResult.rows[0].total);

    const commentsResult = await pool.query('SELECT COUNT(*) as total FROM comments');
    const totalComments = parseInt(commentsResult.rows[0].total);

    const bookingsResult = await pool.query('SELECT COUNT(*) as total FROM bookings');
    const totalBookings = parseInt(bookingsResult.rows[0].total);

    const sessionsByStatusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM live_sessions GROUP BY status'
    );

    const topGenresResult = await pool.query(
      'SELECT genre, COUNT(*) as count FROM live_sessions GROUP BY genre ORDER BY count DESC LIMIT 10'
    );

    res.json({
      stats: {
        totalUsers,
        totalSessions,
        totalLikes,
        totalComments,
        totalBookings
      },
      sessionsByStatus: sessionsByStatusResult.rows,
      topGenres: topGenresResult.rows
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SEARCH ENDPOINT
app.get('/api/search', async (req, res) => {
  try {
    const { q = '', type = 'all' } = req.query;
    const pool = require('./config/database');
    
    if (!q.trim()) {
      return res.json({ sessions: [], users: [] });
    }

    let sessions = [];
    let users = [];

    if (type === 'all' || type === 'sessions') {
      const sessionsResult = await pool.query(
        `SELECT 
          ls.id,
          ls.title,
          ls.caption,
          ls.genre,
          ls.status,
          ls.start_time,
          ls.created_at,
          u.username,
          u.profile_pic
         FROM live_sessions ls
         LEFT JOIN users u ON ls.user_id = u.id
         WHERE ls.title ILIKE $1 OR ls.caption ILIKE $1
         ORDER BY ls.created_at DESC
         LIMIT 20`,
        [`%${q}%`]
      );
      sessions = sessionsResult.rows;
    }

    if (type === 'all' || type === 'users') {
      const usersResult = await pool.query(
        `SELECT 
          u.id, 
          u.username, 
          u.bio, 
          u.profile_pic, 
          u.created_at
         FROM users u
         WHERE u.username ILIKE $1 OR u.bio ILIKE $1
         ORDER BY u.created_at DESC
         LIMIT 20`,
        [`%${q}%`]
      );
      users = usersResult.rows;
    }

    res.json({ sessions, users });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NOTIFICATIONS ENDPOINT (Enhanced)
app.get('/api/notifications', async (req, res) => {
  try {
    const { recipientId } = req.query; // Optional filtering by user

    let query = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.is_read,
        n.created_at,
        n.sender_id,
        n.recipient_id,
        n.session_id,
        sender.username AS sender_username,
        sender.profile_pic AS sender_profile_pic,
        recipient.username AS recipient_username,
        recipient.profile_pic AS recipient_profile_pic
      FROM notifications n
      LEFT JOIN users sender ON n.sender_id = sender.id
      LEFT JOIN users recipient ON n.recipient_id = recipient.id
    `;

    const values = [];

    // If recipientId is provided, add WHERE clause
    if (recipientId) {
      query += ` WHERE n.recipient_id = $1`;
      values.push(recipientId);
    }

    query += ` ORDER BY n.created_at DESC LIMIT 50`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// SIMPLE SESSION LISTING (FOR TESTING)
app.get('/api/sessions-simple', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ls.id,
        ls.title,
        ls.caption, -- ✅ FIXED
        ls.genre,
        ls.status,
        ls.start_time,
        ls.created_at,
        u.username,
        u.profile_pic
      FROM live_sessions ls
      LEFT JOIN users u ON ls.user_id = u.id
      ORDER BY ls.start_time ASC
      LIMIT 10
    `);

    res.json({ sessions: result.rows });

  } catch (error) {
    console.error('Get sessions simple error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stars Corporate API is running' });
});

// SOCKET
setupSocketHandlers(io);

// ERROR HANDLER
app.use(errorHandler);

// 404 FALLBACK
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Stars Corporate Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});

module.exports = { app, server, io };

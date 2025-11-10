const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  uploadPoster, 
  uploadVideo, 
  uploadAvatar, 
  handleUploadError, 
  deleteFile, 
  getFileUrl 
} = require('../config/multer');
const { pool } = require('../config/database');
const path = require('path');

// Upload session poster
router.post('/session-poster/:sessionId', authenticateToken, uploadPoster, handleUploadError, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if session exists and user is the creator
    const sessionResult = await pool.query(
      'SELECT id, user_id, poster_url FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Only session creator can upload poster' });
    }

    // Delete old poster if exists
    if (session.poster_url) {
      const oldFilePath = path.join(__dirname, '..', session.poster_url);
      deleteFile(oldFilePath);
    }

    // Update session with new poster URL
    const posterUrl = getFileUrl(req.file.filename, 'posters');
    await pool.query(
      'UPDATE live_sessions SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [posterUrl, sessionId]
    );

    res.json({
      message: 'Poster uploaded successfully',
      poster: {
        url: posterUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Upload poster error:', error);
    res.status(500).json({ error: 'Failed to upload poster' });
  }
});

// Upload session video
router.post('/session-video/:sessionId', authenticateToken, uploadVideo, handleUploadError, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if session exists and user is the creator
    const sessionResult = await pool.query(
      'SELECT id, user_id, preview_video_url FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Only session creator can upload video' });
    }

    // Delete old video if exists
    if (session.preview_video_url) {
      const oldFilePath = path.join(__dirname, '..', session.preview_video_url);
      deleteFile(oldFilePath);
    }

    // Update session with new video URL
    const videoUrl = getFileUrl(req.file.filename, 'videos');
    await pool.query(
      'UPDATE live_sessions SET preview_video_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [videoUrl, sessionId]
    );

    res.json({
      message: 'Video uploaded successfully',
      video: {
        url: videoUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Upload user avatar
router.post('/avatar', authenticateToken, uploadAvatar, handleUploadError, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get current user profile
    const userResult = await pool.query(
      'SELECT profile_pic FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Delete old avatar if exists
    if (user.profile_pic) {
      const oldFilePath = path.join(__dirname, '..', user.profile_pic);
      deleteFile(oldFilePath);
    }

    // Update user with new avatar URL
    const avatarUrl = getFileUrl(req.file.filename, 'avatars');
    await pool.query(
      'UPDATE users SET profile_pic = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, userId]
    );

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: {
        url: avatarUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Delete session media
router.delete('/session-media/:sessionId/:type', authenticateToken, async (req, res) => {
  try {
    const { sessionId, type } = req.params;
    const userId = req.user.id;

    // Check if session exists and user is the creator
    const sessionResult = await pool.query(
      'SELECT id, user_id, poster_url, preview_video_url FROM live_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Only session creator can delete media' });
    }

    let fileUrl = null;
    let updateField = null;

    if (type === 'poster') {
      fileUrl = session.poster_url;
      updateField = 'poster_url';
    } else if (type === 'video') {
      fileUrl = session.preview_video_url;
      updateField = 'preview_video_url';
    } else {
      return res.status(400).json({ error: 'Invalid media type' });
    }

    if (!fileUrl) {
      return res.status(404).json({ error: 'No media found to delete' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', fileUrl);
    const deleted = deleteFile(filePath);

    if (!deleted) {
      console.warn('File not found on filesystem:', filePath);
    }

    // Update database
    await pool.query(
      `UPDATE live_sessions SET ${updateField} = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [sessionId]
    );

    res.json({
      message: `${type} deleted successfully`
    });

  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// Get file info
router.get('/file-info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = require('fs').statSync(filePath);
    const ext = path.extname(filename).toLowerCase();

    res.json({
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: ext,
      url: `/uploads/${filename}`
    });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

module.exports = router; 
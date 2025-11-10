// Minimal server test without database
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Simple test login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple test response
    if (email === 'alice@test.com' && password === 'password123') {
        res.json({
            success: true,
            token: 'test-token-123456789',
            user: {
                id: '1',
                username: 'alice',
                email: 'alice@test.com'
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

const PORT = 5001; // Use different port to avoid conflicts
app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📱 Test API available at http://localhost:${PORT}/api`);
});

// Keep process alive
process.on('SIGINT', () => {
    console.log('📤 Test server shutting down...');
    process.exit(0);
});

module.exports = app;
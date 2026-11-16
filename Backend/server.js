const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { initDatabase, createDefaultUser } = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const creditRoutes = require('./routes/credits');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
console.log('📁 Serving static files from:', frontendPath);
app.use(express.static(frontendPath));

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/credits', creditRoutes);
// ❌ Payment route removed

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TelnetPilot API is running' });
});

// ✅ Catch-all route - serve index.html for any non-API request
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
        console.log('📄 Serving index.html for:', req.path);
        res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
    } else {
        if (req.path.startsWith('/api')) {
            res.status(404).json({ error: 'API endpoint not found' });
        } else {
            res.status(404).send('File not found');
        }
    }
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initDatabase();
        await createDefaultUser();

        app.listen(PORT, () => {
            console.log(`🚀 TelnetPilot backend running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
            console.log(`📡 API: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
    }
};

startServer();



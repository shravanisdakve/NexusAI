require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const server = require('http').createServer(app);
const socketHandler = require('./socketHandler');
const initScraperCron = require('./cron/muScraper');

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 8080;

console.log('[PHASE 4 - FINAL] Starting NexusAI Backend...');

// 1. Connect Database
(async () => {
    try {
        console.log('[PHASE 4] Connecting to MongoDB...');
        await connectDB();
    } catch (err) {
        console.error('[PHASE 4] Initial DB connection error:', err);
    }
})();

// 2. Setup Sockets (Safe)
let io;
try {
    console.log('[PHASE 4] Initializing Sockets...');
    io = socketHandler(server);
    app.set('io', io);
    console.log('[PHASE 4] Sockets initialized.');
} catch (err) {
    console.error('[PHASE 4] Socket initialization failed:', err);
}

// 3. Setup Scrapers (Safe)
try {
    console.log('[PHASE 4] Initializing Scrapers...');
    initScraperCron(io);
    console.log('[PHASE 4] Scrapers initialized.');
} catch (err) {
    console.error('[PHASE 4] Scraper initialization failed:', err);
}

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://nexusai-e068c.web.app',
            'https://nexusai-e068c.firebaseapp.com',
            'http://localhost:3000',
            'http://localhost:5173'
        ];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. All Routes (Safe)
console.log('[PHASE 4] Loading API routes...');
const safeLoad = (route, path) => {
    try {
        app.use(route, require(path));
    } catch (err) {
        console.error(`[PHASE 4] Failed to load ${route}:`, err);
    }
};

safeLoad('/api/auth', './routes/auth');
safeLoad('/api/gemini', './routes/extractionProvider');
safeLoad('/api/analytics', './routes/analytics');
safeLoad('/api/community', './routes/community');
safeLoad('/api/notes', './routes/notes');
safeLoad('/api/courses', './routes/courses');
safeLoad('/api/games', './routes/games');
safeLoad('/api/resources', './routes/resources');
safeLoad('/api/study-plan', './routes/studyPlan');
safeLoad('/api/goals', './routes/goals');
safeLoad('/api/atkt', './routes/atkt');
safeLoad('/api/curriculum', './routes/curriculum');
safeLoad('/api/placement', './routes/placement');
safeLoad('/api/university', './routes/university');
safeLoad('/api/personalization', './routes/personalization');
safeLoad('/api/ai-chat', './routes/aiChat');
safeLoad('/api/mu-tutor', './routes/muTutor');
safeLoad('/api/gamification', './routes/gamification');

// Minimal Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'final', timestamp: new Date().toISOString() });
});

// Serve Frontend
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

server.listen(PORT, () => {
    console.log(`🚀 [PHASE 4] Server running on port ${PORT}`);
});

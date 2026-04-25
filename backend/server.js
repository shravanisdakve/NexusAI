require('dotenv').config();
console.log('[PHASE 4 - FINAL] Starting NexusAI Backend...');
console.log('[DEBUG] Required dotenv');

const express = require('express');
console.log('[DEBUG] Required express');
const cors = require('cors');
console.log('[DEBUG] Required cors');
const path = require('path');
console.log('[DEBUG] Required path');
const rateLimit = require('express-rate-limit');
console.log('[DEBUG] Required express-rate-limit');
const connectDB = require('./config/db');
console.log('[DEBUG] Required db config');

const app = express();
const server = require('http').createServer(app);
console.log('[DEBUG] Created HTTP server');
const socketHandler = require('./socketHandler');
console.log('[DEBUG] Required socketHandler');
const initScraperCron = require('./cron/muScraper');
console.log('[DEBUG] Required muScraper cron');

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 8080;

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

const allowedOrigins = [
    'https://nexusai-e068c.web.app',
    'https://nexusai-e068c.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:4173'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS blocked'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

// P1 FIX: Rate limiting for AI routes — prevents quota exhaustion from rapid/scripted requests
const aiRateLimit = rateLimit({
    windowMs: 60 * 1000,       // 1 minute window
    max: 25,                    // 25 AI requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many AI requests. Please wait a moment before trying again.' }
});
app.use('/api/gemini', aiRateLimit);
app.use('/api/ai-chat', aiRateLimit);
app.use('/api/mu-tutor', aiRateLimit);

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
safeLoad('/api/admin', './routes/admin');

// Health Check — includes observability data
let serverStartTime = Date.now();
app.get('/api/health', (req, res) => {
  const scraperHealth = (() => {
    try { return require('./cron/muScraper').getScraperHealth(); }
    catch { return null; }
  })();
  res.json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'development',
    uptime: Math.floor((Date.now() - serverStartTime) / 1000) + 's',
    scraper: scraperHealth,
    timestamp: new Date().toISOString()
  });
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

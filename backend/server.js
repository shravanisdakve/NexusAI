require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = require('http').createServer(app);
const socketHandler = require('./socketHandler');

// 1. Connect Database FIRST
connectDB();

// Setup Sockets
const io = socketHandler(server);
app.set('io', io);

const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// ... (DB Connection and Socket setup remians same)

// 2. Security & Performance Middleware
const isProduction = process.env.NODE_ENV === 'production';
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for simplicity in dev/demo; enable and configure for strict prod
  crossOriginEmbedderPolicy: false,
  // Allow localhost frontend (different port/origin) to embed backend content during development.
  xFrameOptions: isProduction ? { action: 'sameorigin' } : false
}));

if (!isProduction) {
  app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    next();
  });
}
app.use(compression());

// CORS Configuration
const devAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173'
];

const corsOptions = {
  origin: isProduction
    ? (process.env.FRONTEND_URL || 'https://yourdomain.com') // Update this after deployment
    : devAllowedOrigins,
  credentials: true
};
app.use(cors(corsOptions));

// Rate Limiting (Apply to API requests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 600 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS'
});
app.use('/api', limiter);

// 3. Body Parsers
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '10mb';
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

// 3.5. Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Request Logging (Development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });
}

// 5. Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gemini', require('./routes/geminiMultiProvider'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/community', require('./routes/community'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/games', require('./routes/games'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/study-plan', require('./routes/studyPlan'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/atkt', require('./routes/atkt'));
app.use('/api/curriculum', require('./routes/curriculum'));
app.use('/api/placement', require('./routes/placement'));
app.use('/api/university', require('./routes/university'));
app.use('/api/personalization', require('./routes/personalization'));
app.use('/api/ai-chat', require('./routes/aiChat'));
app.use('/api/gamification', require('./routes/gamification'));

// 6. Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 7. Serve Frontend in Production
if (isProduction) {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
} else {
  // 404 for non-API routes in dev
  app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });
}

// 8. Global Error Handler (MUST BE LAST)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: isProduction
      ? 'Internal server error'
      : err.message
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

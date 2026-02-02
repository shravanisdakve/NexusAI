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
socketHandler(server);

// 2. CORS Configuration (BEFORE routes)
// IMPORTANT: Replace 'https://yourdomain.com' with your actual frontend production domain
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || 'https://yourdomain.com')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// 3. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3.5. Serve uploaded files
app.use('/uploads', express.static('uploads'));

// 4. Request Logging (Development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });
}

// 5. Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gemini', require('./routes/gemini'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/community', require('./routes/community'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/games', require('./routes/games'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/study-plan', require('./routes/studyPlan'));
app.use('/api/goals', require('./routes/goals'));

// 6. Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 7. 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// 8. Global Error Handler (MUST BE LAST)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
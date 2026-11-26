'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB, sequelize } = require('./config/database');
require('./models'); // Initialize all models + associations

const authRoutes     = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');
const qrRoutes       = require('./routes/qr.routes');
const logsRoutes     = require('./routes/logs.routes');
const passesRoutes   = require('./routes/passes.routes');
const adminRoutes    = require('./routes/admin.routes');
const guardRoutes    = require('./routes/guard.routes');
const coreRoutes     = require('./routes/dashboard.routes'); // dashboards, walk-ins, incidents

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a hosting proxy: needed so rate limiting sees the real client IP.
app.set('trust proxy', 1);

// FRONTEND_URL may hold several comma-separated origins (e.g. local + deployed).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    service: 'Vistara API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',       loginLimiter, authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/qr',         qrRoutes);
app.use('/api/logs',       logsRoutes);
app.use('/api/passes',     passesRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/guard',      guardRoutes);
app.use('/api',            coreRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  // Sync all models — avoiding { alter: true } because of MySQL unique key duplication bug
  await sequelize.sync();
  console.log('✅ Database synchronized.');

  // First deploy on an empty database: create the demo accounts and sample data.
  if (process.env.SEED_ON_START === 'true') {
    const { User } = require('./models');
    if ((await User.count()) === 0) {
      await require('./seed').seedDatabase();
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Camella GuardTrack API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  });
};

startServer();

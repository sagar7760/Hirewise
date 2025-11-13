require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
// Real-time notification socket removed for performance/rate-limit simplification
const { init: initNotificationIo } = require('./services/notificationService'); // kept placeholder init (no-op now)
const notificationsRoutes = require('./routes/notifications');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/applicant/jobs');
const applicationRoutes = require('./routes/applications');
const profileRoutes = require('./routes/profile');
const resumeRoutes = require('./routes/applicant/resumes');
const applicantProfileRoutes = require('./routes/applicant/profile');
const savedJobsRoutes = require('./routes/applicant/saved-jobs');
const applicantApplicationRoutes = require('./routes/applicant/applications');

// HR routes
const hrDashboardRoutes = require('./routes/hr/dashboard');
const hrJobRoutes = require('./routes/hr/jobs');
const hrApplicationRoutes = require('./routes/hr/applications');
const hrInterviewRoutes = require('./routes/hr/interviews');
const hrInterviewerRoutes = require('./routes/hr/interviewers');

// Admin routes
const adminOrganizationRoutes = require('./routes/admin/organization');
const adminProfileRoutes = require('./routes/admin/profile');
const adminHRRoutes = require('./routes/admin/hr');
const adminInterviewerRoutes = require('./routes/admin/interviewers');
const adminJobsRoutes = require('./routes/admin/jobs');
const adminDashboardRoutes = require('./routes/admin/dashboard');

// HR routes
const hrProfileRoutes = require('./routes/hr/profile');
const interviewerInterviewRoutes = require('./routes/interviewer/interviews');
const interviewerProfileRoutes = require('./routes/interviewer/profile');
const interviewerFeedbackRoutes = require('./routes/interviewer/feedback');
const interviewerDashboardRoutes = require('./routes/interviewer/dashboard');

const app = express();
const server = http.createServer(app); // plain HTTP server (no Socket.IO)
initNotificationIo(null); // ensure notification service gracefully handles absence

// Configure server to handle larger headers
app.use((req, res, next) => {
  // Increase header size limit to 32KB
  req.setTimeout(300000); // 5 minutes timeout
  next();
});

// Connect to MongoDB
connectDB();

// Security & CORS first so all later middleware (including rate limits) return proper headers
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Handle preflight early (especially before rate limits) so OPTIONS always succeeds
app.options('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting: lighter on read-heavy GETs, stricter on auth/mutations
const WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const DEFAULT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300;
const AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 20;
const MUTATION_MAX = parseInt(process.env.RATE_LIMIT_MUTATION_MAX) || 100;

// Common skip function: never rate limit preflight or HEAD, prevents CORS failures
const skipPreflight = (req) => req.method === 'OPTIONS' || req.method === 'HEAD';

// Custom handler to ensure CORS headers still present on 429
const rateLimitHandler = (req, res, next, options) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(options.statusCode).json({
    status: 'error',
    message: 'Too many requests, please slow down.'
  });
};

// Default limiter (mostly GETs)
app.use(rateLimit({ windowMs: WINDOW, max: DEFAULT_MAX, standardHeaders: true, legacyHeaders: false, skip: skipPreflight, handler: rateLimitHandler }));

// Stricter limiter for auth endpoints
app.use('/api/auth', rateLimit({ windowMs: WINDOW, max: AUTH_MAX, standardHeaders: true, legacyHeaders: false, skip: skipPreflight, handler: rateLimitHandler }));

// Moderate limiter for write-heavy routes
app.use(['/api/applications', '/api/hr', '/api/admin', '/api/interviewer', '/api/profile'],
  rateLimit({ windowMs: WINDOW, max: MUTATION_MAX, standardHeaders: true, legacyHeaders: false, skip: skipPreflight, handler: rateLimitHandler })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', applicantProfileRoutes); // Use the new applicant profile routes
app.use('/api/resumes', resumeRoutes);
app.use('/api/applicant/saved-jobs', savedJobsRoutes);
app.use('/api/applicant/applications', applicantApplicationRoutes);

// HR API Routes
app.use('/api/hr/dashboard', hrDashboardRoutes);
app.use('/api/hr/jobs', hrJobRoutes);
app.use('/api/hr/applications', hrApplicationRoutes);
app.use('/api/hr/interviews', hrInterviewRoutes);
app.use('/api/hr/interviewers', hrInterviewerRoutes);

// HR profile routes
app.use('/api/hr/profile', hrProfileRoutes);

// Admin API Routes
app.use('/api/admin/organization', adminOrganizationRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/hr', adminHRRoutes);
app.use('/api/admin/interviewers', adminInterviewerRoutes);
app.use('/api/admin/jobs', adminJobsRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Interviewer API Routes
app.use('/api/interviewer/interviews', interviewerInterviewRoutes);
app.use('/api/interviewer/profile', interviewerProfileRoutes);
app.use('/api/interviewer/feedback', interviewerFeedbackRoutes);
app.use('/api/interviewer/dashboard', interviewerDashboardRoutes);

// Notifications API Routes
app.use('/api/notifications', notificationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = (mongoose.connection && mongoose.connection.readyState) || 0; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  res.status(200).json({
    status: 'OK',
    message: 'HireWise API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    db: {
      state: dbState,
      connected: dbState === 1
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 HireWise API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

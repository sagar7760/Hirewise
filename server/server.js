require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/applicant/jobs');
const applicationRoutes = require('./routes/applications');
const profileRoutes = require('./routes/profile');
const aiRoutes = require('./routes/ai');
const resumeRoutes = require('./routes/applicant/resumes');
const applicantProfileRoutes = require('./routes/applicant/profile');
const savedJobsRoutes = require('./routes/applicant/saved-jobs');
const applicantApplicationRoutes = require('./routes/applicant/applications');

// HR routes
const hrDashboardRoutes = require('./routes/hr/dashboard');
const hrJobRoutes = require('./routes/hr/jobs');
const hrApplicationRoutes = require('./routes/hr/applications');
const hrInterviewRoutes = require('./routes/hr/interviews');

// Admin routes
const adminOrganizationRoutes = require('./routes/admin/organization');
const adminProfileRoutes = require('./routes/admin/profile');
const adminHRRoutes = require('./routes/admin/hr');
const adminInterviewerRoutes = require('./routes/admin/interviewers');
const adminJobsRoutes = require('./routes/admin/jobs');
const adminDashboardRoutes = require('./routes/admin/dashboard');

// HR routes
const hrProfileRoutes = require('./routes/hr/profile');

const app = express();

// Configure server to handle larger headers
app.use((req, res, next) => {
  // Increase header size limit to 32KB
  req.setTimeout(300000); // 5 minutes timeout
  next();
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

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
app.use('/api/ai', aiRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applicant/saved-jobs', savedJobsRoutes);
app.use('/api/applicant/applications', applicantApplicationRoutes);

// HR API Routes
app.use('/api/hr/dashboard', hrDashboardRoutes);
app.use('/api/hr/jobs', hrJobRoutes);
app.use('/api/hr/applications', hrApplicationRoutes);
app.use('/api/hr/interviews', hrInterviewRoutes);

// HR profile routes
app.use('/api/hr/profile', hrProfileRoutes);
console.log('Registered route: /api/hr/profile');

// Admin API Routes
app.use('/api/admin/organization', adminOrganizationRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/hr', adminHRRoutes);
app.use('/api/admin/interviewers', adminInterviewerRoutes);
app.use('/api/admin/jobs', adminJobsRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HireWise API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

app.listen(PORT, () => {
  console.log(`🚀 HireWise API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

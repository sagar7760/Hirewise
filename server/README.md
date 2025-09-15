# HireWise Backend API

A comprehensive recruitment management system backend built with Node.js, Express.js, MongoDB, and Gemini AI integration.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Applicant, HR, Interviewer, Admin)
- Secure password hashing with bcrypt

### 👤 User Management
- User registration and login
- Profile management with file uploads
- Profile completeness tracking

### 💼 Job Management
- Job posting and management
- Advanced job search and filtering
- Job statistics and analytics

### 📝 Application System
- Job application submission with resume upload
- Application status tracking
- Application timeline and notes

### 🤖 AI Integration (Gemini)
- Resume analysis and scoring
- Skills matching against job requirements
- Interview question generation
- Batch processing for multiple applications

### 📊 Dashboard & Analytics
- Applicant dashboard with statistics
- Application tracking and management
- Real-time data insights

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **AI Integration:** Google Gemini API
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Security:** Helmet, CORS, Rate Limiting
- **Validation:** Express Validator

## API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /register          - Register new user
POST   /login             - User login
GET    /me                - Get current user
POST   /logout            - User logout
```

### Job Routes (`/api/jobs`)
```
GET    /                  - Get all jobs (with filters)
GET    /:id               - Get single job
POST   /                  - Create job (HR/Admin only)
GET    /stats/overview    - Get job statistics
```

### Application Routes (`/api/applications`)
```
POST   /                      - Submit job application
GET    /my-applications       - Get user's applications
GET    /:id                   - Get application details
PUT    /:id/withdraw          - Withdraw application
GET    /stats/dashboard       - Get dashboard statistics
```

### AI Routes (`/api/ai`)
```
POST   /analyze-application/:id      - Analyze application with AI
POST   /generate-questions/:id       - Generate interview questions
POST   /extract-resume/:id           - Extract resume information
POST   /batch-analyze                - Batch analyze applications
GET    /analysis-stats               - Get AI analysis statistics
```

### Profile Routes (`/api/profile`)
```
GET    /                    - Get user profile
PUT    /basic-info          - Update basic information
PUT    /education           - Update education
PUT    /work-experience     - Update work experience
PUT    /skills              - Update skills
PUT    /projects            - Update projects
POST   /upload-photo        - Upload profile picture
PUT    /resume              - Update resume info
PUT    /preferences         - Update job preferences
GET    /completeness        - Get profile completeness
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Gemini AI API key

### 1. Clone and Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration
Create a `.env` file in the server directory:
```bash
cp .env.example .env
```

Update the `.env` file with your values:
```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/hirewise

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_complex
JWT_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Create Uploads Directory
```bash
mkdir -p uploads/resumes uploads/profile-pictures
```

### 4. Start the Server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## MongoDB Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/hirewise`

### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create cluster and database user
3. Get connection string and update `MONGODB_URI_PROD`

## Gemini AI Setup

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to environment variables as `GEMINI_API_KEY`

## File Upload Configuration

- **Resume files:** PDF, DOC, DOCX (max 5MB)
- **Profile pictures:** JPG, JPEG, PNG (max 2MB)
- **Storage:** Local filesystem in `/uploads` directory

## Security Features

- **Rate Limiting:** 100 requests per 15 minutes per IP
- **CORS:** Configured for specific origins
- **Helmet:** Security headers
- **Input Validation:** All inputs validated and sanitized
- **File Upload:** Type and size restrictions

## Error Handling

- Centralized error handling middleware
- Detailed error messages in development
- Sanitized error messages in production
- Proper HTTP status codes

## API Testing

### Health Check
```bash
GET http://localhost:5000/api/health
```

### Test Authentication
```bash
# Register
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "applicant"
}

# Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

## Development Notes

### File Structure
```
server/
├── config/
│   └── database.js         # MongoDB connection
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Error handling middleware
│   └── upload.js           # File upload configuration
├── models/
│   ├── User.js             # User schema
│   ├── Job.js              # Job schema
│   ├── Application.js      # Application schema
│   └── Interview.js        # Interview schema
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── jobs.js             # Job routes
│   ├── applications.js     # Application routes
│   ├── profile.js          # Profile routes
│   └── ai.js               # AI integration routes
├── services/
│   └── geminiService.js    # Gemini AI service
├── uploads/                # File upload directory
├── .env.example            # Environment template
├── package.json
└── server.js               # Main server file
```

### Adding New Features
1. Create new route file in `/routes`
2. Add model in `/models` if needed
3. Import and use in `server.js`
4. Add appropriate middleware and validation
5. Update this README

### Database Indexes
Key indexes are created for:
- User email (unique)
- Job title and description (text search)
- Application job and applicant
- Job creation date and status

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Configure proper CORS origins
4. Set up proper file storage (consider cloud storage)
5. Configure reverse proxy (nginx)
6. Set up SSL certificates
7. Configure logging and monitoring

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Update documentation
5. Submit pull request

## License

This project is licensed under the MIT License.
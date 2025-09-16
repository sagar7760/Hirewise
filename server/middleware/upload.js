const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
const resumesDir = path.join(uploadsDir, 'resumes');
const profilePicsDir = path.join(uploadsDir, 'profile-pictures');
const companyLogosDir = path.join(uploadsDir, 'company-logos');

[uploadsDir, resumesDir, profilePicsDir, companyLogosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for resumes
const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resumesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user ? req.user.id : 'anonymous';
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${userId}_${uniqueSuffix}_${name}${ext}`);
  }
});

// Storage configuration for profile pictures
const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePicsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    cb(null, `profile_${userId}_${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for company logos
const companyLogoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, companyLogosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const companyName = req.body.companyName ? req.body.companyName.replace(/[^a-zA-Z0-9]/g, '_') : 'company';
    const ext = path.extname(file.originalname);
    cb(null, `logo_${companyName}_${uniqueSuffix}${ext}`);
  }
});

// File filter for resumes (PDF, DOC, DOCX)
const resumeFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'), false);
  }
};

// File filter for profile pictures (JPG, JPEG, PNG)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG files are allowed for profile pictures'), false);
  }
};

// Multer configurations
const uploadResume = multer({
  storage: resumeStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: resumeFileFilter
});

const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB for profile pictures
  },
  fileFilter: imageFileFilter
});

const uploadCompanyLogo = multer({
  storage: companyLogoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB for company logos
  },
  fileFilter: imageFileFilter
});

// Utility function to delete file
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadResume,
  uploadProfilePic,
  uploadCompanyLogo,
  deleteFile,
  uploadsDir,
  resumesDir,
  profilePicsDir,
  companyLogosDir
};
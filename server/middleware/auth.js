const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('company');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    // Add company context to request
    req.user = {
      ...user.toObject(),
      id: user._id.toString(), // Explicitly set id field
      companyId: user.companyId || decoded.companyId,
      isCompanyAdmin: decoded.isCompanyAdmin
    };
    
    console.log('Auth middleware - Setting req.user:', req.user.id); // Debug
    
    next();
  } catch (error) {
    console.log('Auth middleware - Error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role || 'undefined'} is not authorized to access this route`
      });
    }
    next();
  };
};

// Middleware to ensure user belongs to a company
const requireCompany = (req, res, next) => {
  if (!req.user.companyId && !req.user.company) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This route requires company association.'
    });
  }
  next();
};

// Middleware to check if user is admin of their company
const requireCompanyAdmin = (req, res, next) => {
  if (!req.user.isCompanyAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Company admin privileges required.'
    });
  }
  next();
};

module.exports = { auth, authorize, requireCompany, requireCompanyAdmin };
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
      companyId: decoded.companyId,
      isCompanyAdmin: decoded.isCompanyAdmin
    };
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Middleware to ensure user belongs to a company
const requireCompany = (req, res, next) => {
  if (!req.user.companyId) {
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
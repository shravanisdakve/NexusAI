const User = require('../models/user');

const adminMiddleware = async (req, res, next) => {
  try {
    // req.user is populated by authMiddleware
    const userId = req.user.userId || req.user.id;
    if (!req.user || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      req.admin = user; // Attach full user object for administrative context
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied: Administrative privileges required'
      });
    }
  } catch (error) {
    console.error('Admin Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying administrative privileges'
    });
  }
};

module.exports = adminMiddleware;

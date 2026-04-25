const User = require('../models/user');

const adminAuth = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access denied' });
    }

    req.admin = user; // Attach full user object to request
    next();
  } catch (error) {
    console.error('Admin Auth Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = adminAuth;

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');



    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize the user object to use 'id' and 'userId' consistently
    const userId = decoded.userId || decoded.id;
    req.user = {
      id: userId,
      userId: userId,
      email: decoded.email,
      role: decoded.role,
      ...decoded
    };
    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is invalid or expired'
    });
  }
};

module.exports = authMiddleware;
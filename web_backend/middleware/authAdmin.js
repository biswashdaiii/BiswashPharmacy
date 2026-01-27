import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { logSecurity } from '../config/logger.js';

// Middleware to check if user is admin
export const authAdmin = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.headers.atoken || req.headers.token || req.cookies.token;

    if (!token) {
      logSecurity('ADMIN_AUTH_FAILURE_NO_TOKEN', { path: req.path, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as admin.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET);

    // Get user from database (Zero Trust)
    let user;
    if (decoded.id) {
      user = await User.findById(decoded.id).select('-password');
    } else if (decoded.email) {
      user = await User.findOne({ email: decoded.email }).select('-password');
    }

    // Fallback for env-based admin (if not in DB yet)
    if (!user && decoded.email === process.env.ADMIN_EMAIL && decoded.role === 'admin') {
      req.userId = 'admin-env';
      req.user = { email: decoded.email, role: 'admin', isActive: true };
      return next();
    }

    if (!user) {
      logSecurity('ADMIN_AUTH_FAILURE_USER_NOT_FOUND', { path: req.path, ip: req.ip });
      return res.status(401).json({ success: false, message: 'Admin account not found' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      logSecurity('ADMIN_ACCESS_DENIED', { userId: user._id, email: user.email, path: req.path, ip: req.ip });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    logSecurity('ADMIN_AUTH_FAILURE_INVALID_TOKEN', { error: error.message, path: req.path, ip: req.ip });
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token'
    });
  }
};

// Middleware to check if user has specific role
export const checkRole = (...roles) => {
  return async (req, res, next) => {
    try {
      let token = req.cookies.token || req.headers.token || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        logSecurity('ROLE_AUTH_FAILURE_NO_TOKEN', { path: req.path, ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const decoded = jwt.verify(token, process.env.SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!roles.includes(user.role)) {
        logSecurity('ROLE_ACCESS_DENIED', {
          userId: user._id,
          email: user.email,
          requiredRoles: roles,
          currentRole: user.role,
          path: req.path,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      req.userId = user._id;
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };
};

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


    const decoded = jwt.verify(token, process.env.SECRET);


    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logSecurity('ADMIN_AUTH_FAILURE_USER_NOT_FOUND', { path: req.path, ip: req.ip });
      return res.status(401).json({ success: false, message: 'Admin account not found' });
    }

    // Live state check: Is account active?
    if (!user.isActive) {
      logSecurity('ADMIN_AUTH_FAILURE_USER_INACTIVE', { userId: user._id, email: user.email, path: req.path, ip: req.ip });
      return res.status(403).json({ success: false, message: "Account has been deactivated" });
    }


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
        logSecurity('ROLE_AUTH_FAILURE_USER_NOT_FOUND', { path: req.path, ip: req.ip });
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // Live state check: Is account active?
      if (!user.isActive) {
        logSecurity('ROLE_AUTH_FAILURE_USER_INACTIVE', { userId: user._id, email: user.email, path: req.path, ip: req.ip });
        return res.status(403).json({ success: false, message: "Account has been deactivated" });
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

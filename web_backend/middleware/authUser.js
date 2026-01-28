import jwt from "jsonwebtoken";
import 'dotenv/config';
import { logSecurity } from "../config/logger.js";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.SECRET?.trim();

export const authUser = async (req, res, next) => {
  try {

    let token = req.cookies.accessToken; // Changed from 'token' to 'accessToken'

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logSecurity('AUTH_FAILURE_NO_TOKEN', {
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user exists and is active in database (Zero-Trust Verification)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logSecurity('AUTH_FAILURE_USER_NOT_FOUND', { userId: decoded.id, path: req.path, ip: req.ip });
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      logSecurity('AUTH_FAILURE_USER_INACTIVE', { userId: user._id, email: user.email, path: req.path, ip: req.ip });
      return res.status(403).json({ success: false, message: "Account has been deactivated" });
    }

    const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
    const lastChanged = user.passwordLastChangedAt ? new Date(user.passwordLastChangedAt).getTime() : 0;
    if (Date.now() - lastChanged > NINETY_DAYS_IN_MS) {
      req.passwordExpired = true;
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    logSecurity('AUTH_FAILURE_INVALID_TOKEN', {
      error: error.message,
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({ success: false, message: "Session expired or invalid token" });
  }
};

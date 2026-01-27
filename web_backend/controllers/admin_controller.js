import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { logAuth, logSecurity, logError } from '../config/logger.js'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Api for admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Check Database Admins
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      logSecurity('ADMIN_LOGIN_FAILURE_NOT_FOUND', { email, ip: req.ip });
      return res.json({ success: false, message: "Invalid credentials for admin" });
    }

    // 2. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logSecurity('ADMIN_LOGIN_FAILURE_PWD', { email, userId: user._id, ip: req.ip });
      return res.json({ success: false, message: "Invalid credentials for admin" });
    }

    // 3. Check if account is active
    if (!user.isActive) {
      logSecurity('ADMIN_LOGIN_FAILURE_INACTIVE', { email, userId: user._id, ip: req.ip });
      return res.json({ success: false, message: "Account has been deactivated" });
    }

    // 4. Generate Token & Set Cookie
    const token = jwt.sign({ id: user._id, role: 'admin' }, process.env.SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    logAuth('ADMIN_LOGGED_IN', { email, userId: user._id, ip: req.ip });
    res.json({ success: true, token });

  } catch (error) {
    logError(error, { context: 'adminLogin', ip: req.ip });
    res.status(500).json({ success: false, message: error.message })
  }
}

// Api to get security logs
export const getSecurityLogs = async (req, res) => {
  try {
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      return res.json({ success: true, logs: [] });
    }

    const files = fs.readdirSync(logsDir).filter(f => f.startsWith('security-')).sort().reverse();

    if (files.length === 0) {
      return res.json({ success: true, logs: [] });
    }

    // Read the 2 most recent log files to get enough history
    let allLogs = [];
    for (let i = 0; i < Math.min(2, files.length); i++) {
      const content = fs.readFileSync(path.join(logsDir, files[i]), 'utf8');
      const parsed = content.split('\n')
        .filter(line => line.trim())
        .map(line => {
          try { return JSON.parse(line); }
          catch (e) { return null; }
        })
        .filter(l => l !== null);
      allLogs = [...allLogs, ...parsed];
    }

    // Sort by timestamp descending and take last 200
    const sortedLogs = allLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 200);

    res.json({ success: true, logs: sortedLogs });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ success: false, message: "Could not retrieve security logs" });
  }
}

// Api to get specific user logs
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      return res.json({ success: true, logs: [] });
    }

    const files = fs.readdirSync(logsDir).filter(f => f.startsWith('security-')).sort().reverse();

    if (files.length === 0) {
      return res.json({ success: true, logs: [] });
    }

    let allLogs = [];
    // Read up to 10 log files for deeper user history
    for (let i = 0; i < Math.min(10, files.length); i++) {
      const content = fs.readFileSync(path.join(logsDir, files[i]), 'utf8');
      const parsed = content.split('\n')
        .filter(line => line.trim())
        .map(line => {
          try { return JSON.parse(line); }
          catch (e) { return null; }
        })
        .filter(l => {
          if (!l) return false;
          // Match by userId or email in the log data
          return String(l.userId) === String(userId) ||
            String(l.id) === String(userId) ||
            l.email === userId; // userId param might be email in some cases
        });
      allLogs = [...allLogs, ...parsed];
    }

    const sortedLogs = allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, logs: sortedLogs });
  } catch (error) {
    console.error('Error reading user activity:', error);
    res.status(500).json({ success: false, message: "Could not retrieve activity logs" });
  }
}



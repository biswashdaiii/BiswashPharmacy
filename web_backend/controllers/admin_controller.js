import jwt from 'jsonwebtoken'
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
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      // Find admin user in DB to get its ID, or use email if not in DB
      const adminUser = await User.findOne({ email, role: 'admin' });
      const payload = adminUser ? { id: adminUser._id, role: 'admin' } : { email, role: 'admin' };

      const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '24h' })

      // Set JWT as HttpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      logAuth('ADMIN_LOGGED_IN', { email, ip: req.ip });
      res.json({ success: true, token })
    } else {
      logSecurity('ADMIN_LOGIN_FAILURE', { email, ip: req.ip });
      res.json({ success: false, message: "Invalid credentials for admin" })
    }
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



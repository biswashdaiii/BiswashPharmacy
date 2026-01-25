import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import fs from "fs";
import 'dotenv/config';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';

import authRoutes from "./routes/userRoutes.js";
import { connectDB } from "./config/mongodb.js";
import adminRouter from "./routes/adminRoute.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { verifyEsewaPayment } from "./controllers/paymentController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();
const app = express();

// ============ SSL/HTTPS CONFIGURATION ============
const options = {
  key: fs.readFileSync(path.join(__dirname, '../ssl/private-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../ssl/certificate.pem'))
};

const httpServer = https.createServer(options, app);

// Trust proxy - required for rate limiting to work correctly
app.set('trust proxy', 1);

// ============ SECURITY MIDDLEWARE ============
// Security middleware with enhanced Content-Security-Policy
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://localhost:*", "https://192.168.226.1:*", "https://192.168.1.98:*"],
      frameSrc: ["https://www.google.com"],
    },
  },
}));

// ============ BODY PARSING & COOKIES ============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============ INPUT SANITIZATION (XSS & NoSQL PROTECTION) ============
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Basic XSS protection: remove <script> and other common tags
    return value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/on\w+="[^"]*"/gim, "")
      .replace(/javascript:[^"]*/gim, "");
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value instanceof Object) {
    for (const key in value) {
      if (key.startsWith('$')) {
        delete value[key];
      } else {
        value[key] = sanitizeValue(value[key]);
      }
    }
  }
  return value;
};

app.use((req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (key.startsWith('$')) {
        delete req.query[key];
      } else {
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }
  }
  next();
});

// ============ CORS CONFIGURATION ============
app.use(cors({
  origin: [
    "https://localhost:3000",
    "https://localhost:5173",
    "https://192.168.226.1:3000",
    "https://192.168.226.1:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============ SESSION CONFIGURATION ============
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ============ STATIC FILES ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ RATE LIMITING ============
app.use('/api/', apiLimiter);

// ============ ROUTES ============
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/order', orderRouter);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRouter);
app.use('/api/cart', cartRouter);
app.post('/payment-status', verifyEsewaPayment);

// ============ HEALTH CHECK ============
app.get('/', (req, res) => {
  res.json({ 
    message: 'API working',
    protocol: req.protocol,
    secure: req.secure
  });
});

// ============ ERROR HANDLING (Optional - Add this for better error handling) ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export { httpServer };
export default app;
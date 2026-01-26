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

// ======== HTTPS CONFIGURATION ========
const options = {
  key: fs.readFileSync(path.join(__dirname, '../ssl/private-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../ssl/certificate.pem')),
};

const httpServer = https.createServer(options, app);

// ======== TRUST PROXY ========
app.set('trust proxy', 1);

// ======== SECURITY MIDDLEWARE ========
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

// ======== BODY PARSING & COOKIES ========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ======== INPUT SANITIZATION ========
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/on\w+="[^"]*"/gim, "")
      .replace(/javascript:[^"]*/gim, "");
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value instanceof Object) {
    for (const key in value) {
      if (key.startsWith('$')) delete value[key];
      else value[key] = sanitizeValue(value[key]);
    }
  }
  return value;
};

app.use((req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (key.startsWith('$')) delete req.query[key];
      else req.query[key] = sanitizeValue(req.query[key]);
    }
  }
  next();
});

// ======== CORS ========
app.use(cors({
  origin: [
    "https://localhost:5173",
    "https://localhost:5174"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'atoken', 'token']
}));

// ======== SESSION ========
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ======== PASSPORT ========
app.use(passport.initialize());
app.use(passport.session());

// ======== STATIC FILES ========
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======== RATE LIMITING ========
app.use('/api/', apiLimiter);

// ======== ROUTES ========
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/order', orderRouter);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRouter);
app.use('/api/cart', cartRouter);
app.post('/payment-status', verifyEsewaPayment);

// ======== HEALTH CHECK ========
app.get('/', (req, res) => {
  res.json({
    message: 'API working',
    protocol: req.protocol,
    secure: req.secure
  });
});

// ======== ERROR HANDLING ========
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ======== 404 ========
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export { httpServer };
export default app;
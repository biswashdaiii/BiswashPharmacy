import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
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
import chatRoutes from "./routes/chatRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { verifyEsewaPayment } from "./controllers/paymentController.js";

import { getRoomId } from "./config/chatHelper.js";
import {
  getUserLastSeen,
  updateMessageStatus,
  markMessageAsRead,
  markMessageAsDelivered,
  undeliveredMessages as getUndeliveredMessages,
  updateUserLastSeen,
  createMessage
} from "./Service/chatService.js";

import User from "./models/userModel.js";
import Message from "./models/message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();
const app = express();
const httpServer = http.createServer(app);

// Trust proxy - required for rate limiting to work correctly
app.set('trust proxy', 1);

const io = new Server(httpServer, {
  cors: { origin: "*" }
});

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
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "http://192.168.226.1:*", "ws://192.168.226.1:*", "http://192.168.1.98:*", "ws://192.168.1.98:*"],
      frameSrc: ["https://www.google.com"],
    },
  },
}));

// Body parsing and CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Unified Security Middleware for Express 5 (NoSQL + XSS Protection)
// Handles read-only req.query property
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
    // Sanitize query parameters individually since req.query is a getter
    for (const key in req.query) {
      if (key.startsWith('$')) {
        delete req.query[key];
      } else {
        // We can't reassign req.query[key] if it's a getter/setter issue, 
        // but usually Express 5 allows modifying the nested properties of the query object.
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

// Session middleware (required for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply general API rate limiter to all routes
app.use('/api/', apiLimiter);

app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use("/api/order", orderRouter);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRouter);
app.use("/api/cart", cartRouter);
app.post("/payment-status", verifyEsewaPayment);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  let currentUserId = null;

  socket.on('register_user', ({ userId }) => {
    console.log(`register_user event received for userId: ${userId}`);
    if (!userId) return;
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket: ${socket.id}`);
  });

  socket.on('join_room', async ({ userId, partnerId }) => {
    console.log(`join_room event received: userId=${userId}, partnerId=${partnerId}`);
    if (!userId || !partnerId) return;
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    const roomId = getRoomId(userId, partnerId);
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    try {
      const undeliveredMessages = await getUndeliveredMessages(userId, partnerId);
      const undeliveredCount = await markMessageAsDelivered(userId, partnerId);

      if (undeliveredCount > 0) {
        undeliveredMessages.forEach((msg) => {
          io.to(roomId).emit("message_status", {
            messageId: msg.messageId,
            status: 'delivered',
            sender: msg.sender,
            receiver: msg.receiver
          });
        });
      }

      io.to(roomId).emit("user_status", { userId, status: 'online' });

      if (onlineUsers.has(partnerId)) {
        socket.emit("user_status", { userId: partnerId, status: 'online' });
      } else {
        const lastSeen = await getUserLastSeen(partnerId);
        socket.emit("user_status", {
          userId: partnerId,
          status: 'offline',
          lastSeen: lastSeen || new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error joining room:", err);
    }
  });

  socket.on("sent_message", async (message) => {
    console.log("sent_message received:", message);
    const { messageId, sender, receiver, message: text } = message;
    if (!messageId || !sender || !receiver || !text) {
      console.log("sent_message missing required fields");
      return;
    }

    const roomId = getRoomId(sender, receiver);
    try {
      await createMessage({ ...message, status: 'sent', roomId });
      console.log(`Message saved to DB with id ${messageId}`);
    } catch (e) {
      console.error("Error saving message:", e);
    }

    if (onlineUsers.has(receiver)) {
      message.status = 'delivered';
      await updateMessageStatus(messageId, 'delivered');
      console.log(`Message status updated to delivered for messageId ${messageId}`);
    } else {
      message.status = 'sent';
      console.log(`Receiver offline, message status remains sent for messageId ${messageId}`);
    }

    io.to(roomId).emit("message", message);
    console.log(`Message emitted to room ${roomId}`);

    if (onlineUsers.has(receiver)) {
      const receiverSocket = io.sockets.sockets.get(onlineUsers.get(receiver));
      const senderUser = await User.findById(sender).select("username");

      if (receiverSocket && !receiverSocket.rooms.has(roomId)) {
        receiverSocket.emit("notification", {
          senderId: sender,
          senderName: senderUser?.username,
          messageId,
          message: text
        });
        console.log(`Notification sent to receiver socket`);
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id} userId: ${currentUserId}`);
    if (currentUserId) {
      if (onlineUsers.get(currentUserId) === socket.id) {
        onlineUsers.delete(currentUserId);
        console.log(`User ${currentUserId} removed from onlineUsers`);
      }
      const lastSeen = new Date().toISOString();
      await updateUserLastSeen(currentUserId, lastSeen);
      io.emit("user_status", { userId: currentUserId, status: 'offline', lastSeen });
    }
  });
});


app.get("/", (req, res) => res.send("API working"));

export { httpServer };
export default app;

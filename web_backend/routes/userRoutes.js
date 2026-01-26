import express from "express";
import { registerUser, loginUser, getUsers, getProfile, updateUserProfile, verifyOTP, toggle2FA, resendOTP, changePassword, refreshAccessToken, forgotPassword, resetPassword } from "../controllers/userController.js";
import { authUser } from "../middleware/authUser.js";
import { authAdmin } from "../middleware/authAdmin.js";
import upload from "../middleware/multer.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter.js";
import { verifyRecaptcha } from "../middleware/recaptchaVerify.js";
import passport from "../config/passport.js";
import { googleOAuthCallback } from "../controllers/oauthController.js";

const userRouter = express.Router();

userRouter.post("/register", registerLimiter, verifyRecaptcha, registerUser);
userRouter.post("/login", loginLimiter, verifyRecaptcha, loginUser);

// 2FA routes
userRouter.post("/verify-otp", loginLimiter, verifyOTP);
userRouter.post("/resend-otp", loginLimiter, resendOTP);
userRouter.post("/toggle-2fa", authUser, toggle2FA);

// Refresh token route
userRouter.post("/refresh-token", refreshAccessToken);

// Google OAuth routes
userRouter.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

userRouter.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=oauth_failed' }),
    googleOAuthCallback
);

userRouter.get("/all", authAdmin, getUsers);
userRouter.get('/get-profile', authUser, getProfile)
userRouter.put('/update-profile', upload.single('image'), authUser, updateUserProfile);
userRouter.post('/change-password', authUser, changePassword);

// Password Reset Routes
userRouter.post('/forgot-password', loginLimiter, forgotPassword);
userRouter.post('/reset-password', loginLimiter, resetPassword);

export default userRouter;

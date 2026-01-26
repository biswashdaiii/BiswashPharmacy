import express from "express";
import { registerUser, loginUser, getUsers, getProfile, updateUserProfile, verifyOTP, toggle2FA, resendOTP, changePassword, refreshAccessToken, forgotPassword, resetPassword, verifyResetOTP } from "../controllers/userController.js";
import { authUser } from "../middleware/authUser.js";
import { authAdmin } from "../middleware/authAdmin.js";
import upload from "../middleware/multer.js";
import { loginLimiter, registerLimiter, passwordResetLimiter } from "../middleware/rateLimiter.js";
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
    passport.authenticate('google', { failureRedirect: 'https://localhost:5173/login?error=oauth_failed' }),
    googleOAuthCallback
);

userRouter.get("/all", authAdmin, getUsers);
userRouter.get('/get-profile', authUser, getProfile)
userRouter.put('/update-profile', upload.single('image'), authUser, updateUserProfile);
userRouter.post('/change-password', authUser, changePassword);

// Password Reset Routes
userRouter.post('/forgot-password', passwordResetLimiter, forgotPassword);
userRouter.post('/verify-reset-otp', passwordResetLimiter, verifyResetOTP);
userRouter.post('/reset-password', passwordResetLimiter, resetPassword);

export default userRouter;

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import userModel from "../models/userModel.js";
import { validatePassword } from "../utils/passwordValidator.js";
import { logAuth, logError, logSecurity, logCriticalSecurity } from "../config/logger.js";
import { generateOTP, sendOTPEmail, sendPasswordResetOTP } from "../utils/emailService.js";
import { encrypt, decrypt } from "../utils/encryption.js";


// console.log("JWT Secret:", JWT_SECRET);
const registerUser = async (req, res) => {
  const JWT_SECRET = process.env.SECRET?.trim();
  if (!JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  const { name, email, password, gender, dob, phone, address } = req.body;

  // Validation: Name (No special characters, 3-50 chars)
  const nameRegex = /^[a-zA-Z\s]{3,50}$/;
  if (!nameRegex.test(name)) {
    return res.status(400).json({ success: false, message: "Name should only contain letters and be 3-50 characters long." });
  }


  try {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      logSecurity('WEAK_PASSWORD_ATTEMPT', {
        email,
        errors: passwordValidation.errors,
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      logSecurity('DUPLICATE_REGISTRATION_ATTEMPT', { email, ip: req.ip });
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      gender,
      dob,
      phone: phone ? encrypt(phone) : phone, // Encrypt phone
      address: address ? encrypt(address) : address, // Encrypt address
      previousPasswords: [hashedPassword], // Initial password in history
      passwordLastChangedAt: Date.now()
    });

    // Generate access and refresh tokens
    const accessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET || JWT_SECRET, { expiresIn: '7d' });

    // Hash and store refresh token
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await userModel.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: hashedRefreshToken }
    });

    // Set tokens as HttpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logAuth('USER_REGISTERED', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      token: accessToken, // For compatibility
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        profileImage: user.profileImage
      },
    });
  } catch (error) {
    logError(error, { email: req.body.email, ip: req.ip });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const JWT_SECRET = process.env.SECRET?.trim();
  if (!JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      logSecurity('LOGIN_FAILURE_UNKNOWN_USER', { email, ip: req.ip });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      logSecurity('LOGIN_ATTEMPT_INACTIVE_ACCOUNT', { email, userId: user._id, ip: req.ip });
      return res.status(403).json({ message: "Account has been deactivated" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      logSecurity('LOGIN_ATTEMPT_LOCKED_ACCOUNT', { email, userId: user._id, ip: req.ip });
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let updateData = { failedLoginAttempts: failedAttempts };

      // Lock account if failed attempts reach 5
      if (failedAttempts >= 5) {
        updateData.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
        logSecurity('ACCOUNT_LOCKED', { email, userId: user._id, ip: req.ip });
        logCriticalSecurity('ACCOUNT_LOCKED', { email, userId: user._id, ip: req.ip });
      }

      await userModel.findByIdAndUpdate(user._id, updateData);

      logSecurity('LOGIN_FAILURE_WRONG_PASSWORD', { email, userId: user._id, ip: req.ip, attempts: failedAttempts });

      const remainingAttempts = 5 - failedAttempts;
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Invalid credentials. ${remainingAttempts} attempts remaining before lockout.`
          : "Invalid credentials. Account locked for 15 minutes."
      });
    }

    // Reset failed attempts on successful login
    await userModel.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      lockUntil: null
    });

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // Generate and send OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in database
      await userModel.findByIdAndUpdate(user._id, {
        otp: otp,
        otpExpiry: otpExpiry,
        otpAttempts: 0
      });

      // Send OTP via email
      const emailSent = await sendOTPEmail(user.email, otp, user.name);

      if (!emailSent) {
        logError(new Error('Failed to send OTP email'), { userId: user._id, email });
        return res.status(500).json({ message: "Failed to send verification code" });
      }

      logAuth('OTP_SENT', { userId: user._id, email: user.email, ip: req.ip });

      return res.status(200).json({
        success: true,
        requires2FA: true,
        message: "Verification code sent to your email",
        userId: user._id // Needed for OTP verification step
      });
    }

    // No 2FA - issue tokens immediately
    const accessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET || JWT_SECRET, { expiresIn: '7d' });

    // Hash and store refresh token
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await userModel.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: hashedRefreshToken }
    });

    // Set tokens as HttpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Check for password expiration (90 days)
    const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
    const lastChanged = user.passwordLastChangedAt ? new Date(user.passwordLastChangedAt).getTime() : 0;
    const passwordExpired = Date.now() - lastChanged > NINETY_DAYS_IN_MS;

    logAuth('USER_LOGGED_IN', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      passwordExpired
    });

    // Log admin access
    if (user.role === 'admin') {
      logCriticalSecurity('ADMIN_ACCESS', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
    }

    res.status(200).json({
      success: true,
      requires2FA: false,
      token: accessToken,
      passwordExpired,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        profileImage: user.profileImage
      },
    });
  } catch (error) {
    logError(error, { email, ip: req.ip });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, "-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.userId; // get userId directly from req.userId set by auth middleware
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID" });
    }

    const userData = await userModel.findById(userId).select("-password -refreshTokens");
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Decrypt and parse sensitive fields
    let decryptedAddress = userData.address ? decrypt(userData.address) : userData.address;
    try {
      // If it looks like JSON, parse it (for legacy object support)
      if (typeof decryptedAddress === 'string' && decryptedAddress.startsWith('{')) {
        const parsed = JSON.parse(decryptedAddress);
        decryptedAddress = parsed.line1 || parsed.line2 || decryptedAddress;
      }
    } catch (e) {
      // Keep as string if parsing fails
    }

    const decryptedUser = {
      ...userData.toObject(),
      phone: userData.phone ? decrypt(userData.phone) : userData.phone,
      address: decryptedAddress
    };

    res.json({ success: true, userData: decryptedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware
    const { name, email, phone, address } = req.body;
    const imageFile = req.file;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Data missing" });
    }

    // Validation: Name
    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ success: false, message: "Name should only contain letters and be 3-50 characters long." });
    }

    // Validation: Phone
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
    }

    const updatedFields = {
      name,
      email,
      phone: encrypt(phone), // Encrypt phone
      address: encrypt(address), // Encrypt address
    };

    if (imageFile) {
      updatedFields.profileImage = `uploads/${imageFile.filename}`;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      updatedFields,
      { new: true }
    ).select("-password -refreshTokens");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Decrypt for response
    let decryptedAddress = updatedUser.address ? decrypt(updatedUser.address) : updatedUser.address;
    try {
      if (typeof decryptedAddress === 'string' && decryptedAddress.startsWith('{')) {
        const parsed = JSON.parse(decryptedAddress);
        decryptedAddress = parsed.line1 || parsed.line2 || decryptedAddress;
      }
    } catch (e) { }

    const decryptedUser = {
      ...updatedUser.toObject(),
      phone: decrypt(updatedUser.phone),
      address: decryptedAddress
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: decryptedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Verify OTP for 2FA login
const verifyOTP = async (req, res) => {
  const JWT_SECRET = process.env.SECRET?.trim();
  const { userId, otp } = req.body;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Check if OTP has expired
    if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      logSecurity('OTP_EXPIRED', { userId, ip: req.ip });
      return res.status(400).json({ success: false, message: "Verification code expired. Please login again." });
    }

    // Check OTP attempts (max 3)
    if (user.otpAttempts >= 3) {
      await userModel.findByIdAndUpdate(userId, { otp: null, otpExpiry: null });
      logSecurity('OTP_MAX_ATTEMPTS', { userId, ip: req.ip });
      logCriticalSecurity('OTP_MAX_ATTEMPTS', { userId, email: user.email, ip: req.ip });
      return res.status(429).json({ success: false, message: "Too many attempts. Please login again." });
    }

    // Verify OTP
    if (user.otp !== otp) {
      await userModel.findByIdAndUpdate(userId, { $inc: { otpAttempts: 1 } });
      logSecurity('OTP_INVALID', { userId, attempt: user.otpAttempts + 1, ip: req.ip });
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // OTP verified - clear OTP and issue tokens
    await userModel.findByIdAndUpdate(userId, { otp: null, otpExpiry: null, otpAttempts: 0 });

    const accessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET || JWT_SECRET, { expiresIn: '7d' });

    // Hash and store refresh token
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await userModel.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: hashedRefreshToken }
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Check for password expiration (90 days)
    const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
    const lastChanged = user.passwordLastChangedAt ? new Date(user.passwordLastChangedAt).getTime() : 0;
    const passwordExpired = Date.now() - lastChanged > NINETY_DAYS_IN_MS;

    logAuth('USER_LOGGED_IN_2FA', { userId: user._id, email: user.email, ip: req.ip, passwordExpired });

    // Log admin access
    if (user.role === 'admin') {
      logCriticalSecurity('ADMIN_ACCESS', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
    }

    res.status(200).json({
      success: true,
      token: accessToken,
      passwordExpired,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        profileImage: user.profileImage
      },
    });
  } catch (error) {
    logError(error, { userId, ip: req.ip });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Toggle 2FA for user
const toggle2FA = async (req, res) => {
  try {
    const userId = req.userId;
    const { enable } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await userModel.findByIdAndUpdate(userId, { twoFactorEnabled: enable });

    logAuth(enable ? '2FA_ENABLED' : '2FA_DISABLED', { userId, email: user.email, ip: req.ip });

    res.json({
      success: true,
      message: `Two-factor authentication ${enable ? 'enabled' : 'disabled'}`,
      twoFactorEnabled: enable
    });
  } catch (error) {
    logError(error, { userId: req.userId });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Setup 2FA - Generate TOTP secret and QR code
const setup2FA = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `BiswashPharmacy (${user.email})`,
      issuer: 'BiswashPharmacy'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    logAuth('2FA_SETUP_INITIATED', { userId, email: user.email, ip: req.ip });

    res.json({
      success: true,
      qrCode: qrCodeUrl,
      secret: secret.base32, // For manual entry
      tempSecret: secret.base32 // Store temporarily for verification
    });
  } catch (error) {
    logError(error, { userId: req.userId });
    res.status(500).json({ success: false, message: "Failed to generate QR code" });
  }
};

// Verify 2FA Setup - Verify initial TOTP code and save secret
const verify2FASetup = async (req, res) => {
  try {
    const userId = req.userId;
    const { token, secret } = req.body;

    if (!token || !secret) {
      return res.status(400).json({ success: false, message: "Token and secret are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      logSecurity('2FA_SETUP_INVALID_TOKEN', { userId, ip: req.ip });
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Encrypt and save the secret
    const encryptedSecret = encrypt(secret);
    await userModel.findByIdAndUpdate(userId, {
      twoFactorSecret: encryptedSecret,
      twoFactorEnabled: true
    });

    logAuth('2FA_ENABLED', { userId, email: user.email, ip: req.ip });

    res.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
      twoFactorEnabled: true
    });
  } catch (error) {
    logError(error, { userId: req.userId });
    res.status(500).json({ success: false, message: "Failed to verify setup" });
  }
};

// Verify TOTP for login
const verifyTOTP = async (req, res) => {
  const JWT_SECRET = process.env.SECRET?.trim();
  const { userId, token } = req.body;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: "2FA not enabled for this account" });
    }

    // Decrypt the secret
    const secret = decrypt(user.twoFactorSecret);

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      logSecurity('TOTP_INVALID', { userId, ip: req.ip });
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // TOTP verified - issue tokens
    const accessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET || JWT_SECRET, { expiresIn: '7d' });

    // Hash and store refresh token
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await userModel.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: hashedRefreshToken }
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Check for password expiration (90 days)
    const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
    const lastChanged = user.passwordLastChangedAt ? new Date(user.passwordLastChangedAt).getTime() : 0;
    const passwordExpired = Date.now() - lastChanged > NINETY_DAYS_IN_MS;

    logAuth('USER_LOGGED_IN_TOTP', { userId: user._id, email: user.email, ip: req.ip, passwordExpired });

    // Log admin access
    if (user.role === 'admin') {
      logCriticalSecurity('ADMIN_ACCESS', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
    }

    res.status(200).json({
      success: true,
      token: accessToken,
      passwordExpired,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        profileImage: user.profileImage
      },
    });
  } catch (error) {
    logError(error, { userId, ip: req.ip });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await userModel.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    logAuth('2FA_DISABLED', { userId, email: user.email, ip: req.ip });

    res.json({
      success: true,
      message: "Two-factor authentication disabled",
      twoFactorEnabled: false
    });
  } catch (error) {
    logError(error, { userId: req.userId });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await userModel.findByIdAndUpdate(userId, { otp, otpExpiry, otpAttempts: 0 });

    const emailSent = await sendOTPEmail(user.email, otp, user.name);
    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send verification code" });
    }

    logAuth('OTP_RESENT', { userId, email: user.email, ip: req.ip });
    res.json({ success: true, message: "Verification code resent" });
  } catch (error) {
    logError(error, { userId });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Change password
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logSecurity('PASSWORD_CHANGE_FAILURE_WRONG_OLD_PASSWORD', { userId, ip: req.ip });
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    // Check password history (last 5)
    for (const historicHash of user.previousPasswords || []) {
      const isReused = await bcrypt.compare(newPassword, historicHash);
      if (isReused) {
        return res.status(400).json({
          success: false,
          message: "You cannot reuse any of your last 5 passwords"
        });
      }
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update history, keep last 5
    const updatedHistory = [hashedNewPassword, ...(user.previousPasswords || [])].slice(0, 5);

    await userModel.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      previousPasswords: updatedHistory,
      passwordLastChangedAt: Date.now()
    });

    logAuth('PASSWORD_CHANGED', { userId, ip: req.ip });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    logError(error, { userId });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Refresh token endpoint
const refreshAccessToken = async (req, res) => {
  const JWT_SECRET = process.env.SECRET?.trim();
  const REFRESH_SECRET = process.env.REFRESH_SECRET?.trim() || JWT_SECRET;

  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    // Check if refresh token exists in database
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const user = await userModel.findById(decoded.id);

    if (!user || !user.refreshTokens.includes(hashedRefreshToken)) {
      return res.status(401).json({ success: false, message: "Refresh token not found or revoked" });
    }

    // Remove old refresh token (rotation)
    await userModel.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: hashedRefreshToken }
    });

    // Generate new tokens
    const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

    // Store new refresh token
    const newHashedRefreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await userModel.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: newHashedRefreshToken }
    });

    // Set new cookies
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAuth('TOKEN_REFRESHED', { userId: user._id, ip: req.ip });

    res.json({
      success: true,
      token: newAccessToken
    });
  } catch (error) {
    logError(error, { ip: req.ip });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Secure OTP-based Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });

    // Always return success to prevent account enumeration
    const genericResponse = { success: true, message: "If an account exists with this email, a reset code has been sent." };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate secure 6-digit OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Set OTP and 10-minute expiry
    user.resetOTP = hashedOTP;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
    user.resetOTPAttempts = 0;

    await user.save();

    // Send email with PLAIN OTP
    const emailSent = await sendPasswordResetOTP(user.email, otp, user.name);

    if (!emailSent) {
      logError(new Error('Failed to send reset OTP'), { userId: user._id, email });
    }

    logAuth('PASSWORD_RESET_OTP_REQUESTED', { userId: user._id, email: user.email, ip: req.ip });
    res.json(genericResponse);
  } catch (error) {
    logError(error, { email, ip: req.ip });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify OTP for Password Reset
const verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user || !user.resetOTP || !user.resetOTPExpiry || new Date() > user.resetOTPExpiry) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset code" });
    }

    // Check attempts
    if (user.resetOTPAttempts >= 5) {
      user.resetOTP = null; // Invalidate OTP after too many attempts
      await user.save();
      logSecurity('RESET_OTP_MAX_ATTEMPTS', { email, ip: req.ip });
      return res.status(429).json({ success: false, message: "Too many attempts. Please request a new code." });
    }

    // Verify hashed OTP
    const isMatch = await bcrypt.compare(otp, user.resetOTP);
    if (!isMatch) {
      user.resetOTPAttempts += 1;
      await user.save();
      logSecurity('RESET_OTP_INVALID', { email, ip: req.ip });
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }

    // Success - OTP is valid
    res.json({ success: true, message: "Code verified successfully" });
  } catch (error) {
    logError(error, { email, ip: req.ip });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Secure Password Reset
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user || !user.resetOTP || !user.resetOTPExpiry || new Date() > user.resetOTPExpiry) {
      return res.status(400).json({ success: false, message: "Invalid or expired session" });
    }

    // Double check OTP validity
    const isOTPValid = await bcrypt.compare(otp, user.resetOTP);
    if (!isOTPValid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    // Check password history
    for (const historicHash of user.previousPasswords || []) {
      const isReused = await bcrypt.compare(newPassword, historicHash);
      if (isReused) {
        return res.status(400).json({
          success: false,
          message: "You cannot reuse any of your last 5 passwords"
        });
      }
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user and invalidate all sessions
    user.password = hashedNewPassword;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    user.resetOTPAttempts = 0;
    user.refreshTokens = []; // Log out all active sessions
    user.passwordLastChangedAt = Date.now();
    user.previousPasswords = [hashedNewPassword, ...(user.previousPasswords || [])].slice(0, 5);

    await user.save();

    logAuth('PASSWORD_RESET_SUCCESS', { userId: user._id, email: user.email, ip: req.ip });
    res.json({ success: true, message: "Password reset successfully. Please login with your new password." });
  } catch (error) {
    logError(error, { email, ip: req.ip });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  registerUser,
  loginUser,
  getUsers,
  getProfile,
  updateUserProfile,
  verifyOTP,
  verifyResetOTP,
  toggle2FA,
  setup2FA,
  verify2FASetup,
  verifyTOTP,
  disable2FA,
  resendOTP,
  changePassword,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  sendOTPEmail
};

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { validatePassword } from "../utils/passwordValidator.js";
import { logAuth, logError, logSecurity } from "../config/logger.js";
import { generateOTP, sendOTPEmail } from "../utils/emailService.js";


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
      phone,
      address,
      previousPasswords: [hashedPassword], // Initial password in history
      passwordLastChangedAt: Date.now()
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });

    // Set JWT as HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    logAuth('USER_REGISTERED', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      token, // Still returning for compatibility with existing frontend logic if needed, but cookie is primary
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

    // No 2FA - issue token immediately
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });

    // Set JWT as HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

    res.status(200).json({
      success: true,
      requires2FA: false,
      token,
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

    const userData = await userModel.findById(userId).select("-password");
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, userData });
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
      phone,
      address,
    };

    if (imageFile) {
      updatedFields.profileImage = `uploads/${imageFile.filename}`;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      updatedFields,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
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
      return res.status(429).json({ success: false, message: "Too many attempts. Please login again." });
    }

    // Verify OTP
    if (user.otp !== otp) {
      await userModel.findByIdAndUpdate(userId, { $inc: { otpAttempts: 1 } });
      logSecurity('OTP_INVALID', { userId, attempt: user.otpAttempts + 1, ip: req.ip });
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // OTP verified - clear OTP and issue token
    await userModel.findByIdAndUpdate(userId, { otp: null, otpExpiry: null, otpAttempts: 0 });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Check for password expiration (90 days)
    const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
    const lastChanged = user.passwordLastChangedAt ? new Date(user.passwordLastChangedAt).getTime() : 0;
    const passwordExpired = Date.now() - lastChanged > NINETY_DAYS_IN_MS;

    logAuth('USER_LOGGED_IN_2FA', { userId: user._id, email: user.email, ip: req.ip, passwordExpired });

    res.status(200).json({
      success: true,
      token,
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

export {
  registerUser,
  loginUser,
  getUsers,
  getProfile,
  updateUserProfile,
  verifyOTP,
  toggle2FA,
  resendOTP,
  changePassword
};

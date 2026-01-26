import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { logAuth, logError } from '../config/logger.js';

// Create transporter (configure with your email service)
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Use App Password for Gmail
        }
    });
};

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP email for 2FA verification
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} userName - User's name for personalization
 * @returns {Promise<boolean>} Success status
 */
export const sendOTPEmail = async (email, otp, userName = 'User') => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"NepGrocery Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your NepGrocery Login Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🔐 Login Verification</h1>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                        <p style="font-size: 16px; color: #333;">Your verification code for NepGrocery login is:</p>
                        <div style="background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${otp}</span>
                        </div>
                        <p style="font-size: 14px; color: #666;">⏰ This code expires in <strong>5 minutes</strong>.</p>
                        <p style="font-size: 14px; color: #666;">🚫 If you didn't request this code, please ignore this email and ensure your account is secure.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            © ${new Date().getFullYear()} NepGrocery. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        logAuth('OTP_EMAIL_SENT', { email, success: true });
        return true;
    } catch (error) {
        logError(error, { context: 'sendOTPEmail', email });
        console.error('Error sending OTP email:', error.message);
        return false;
    }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token/link
 * @param {string} userName - User's name
 * @returns {Promise<boolean>} Success status
 */
export const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
    try {
        const transporter = createTransporter();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"NepGrocery Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your NepGrocery Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🔑 Password Reset</h1>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                        <p style="font-size: 16px; color: #333;">You requested to reset your password. Click the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p style="font-size: 14px; color: #666;">⏰ This link expires in <strong>1 hour</strong>.</p>
                        <p style="font-size: 14px; color: #666;">🚫 If you didn't request this, please ignore this email.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logAuth('PASSWORD_RESET_EMAIL_SENT', { email, success: true });
        return true;
    } catch (error) {
        logError(error, { context: 'sendPasswordResetEmail', email });
        return false;
    }
};

export default { generateOTP, sendOTPEmail, sendPasswordResetEmail };

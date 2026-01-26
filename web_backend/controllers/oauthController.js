import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userModel from '../models/userModel.js';

// Google OAuth callback handler
export const googleOAuthCallback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:5173';
    try {
        // User is authenticated via Passport
        const user = req.user;

        if (!user) {
            return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }

        // Generate access and refresh tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET || process.env.SECRET, { expiresIn: '7d' });

        // Hash and store refresh token
        const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await userModel.findByIdAndUpdate(user._id, {
            $push: { refreshTokens: hashedRefreshToken }
        });

        // Set tokens as HttpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax', // Use lax for cross-site/port redirects
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Redirect to frontend (tokens are in cookies)
        console.log('Google OAuth successful, redirecting to frontend...');
        res.redirect(`${frontendUrl}/?success=true`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${frontendUrl}/login?error=server_error`);
    }
};

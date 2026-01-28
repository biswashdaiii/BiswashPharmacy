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

        // Check if refresh token exists in database or not donee
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

export {
    registerUser,
    loginUser,
    getUsers,
    getProfile,
    updateUserProfile,
    verifyOTP,
    toggle2FA,
    resendOTP,
    changePassword,
    refreshAccessToken
};

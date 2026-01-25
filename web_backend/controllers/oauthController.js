import jwt from 'jsonwebtoken';

// Google OAuth callback handler
export const googleOAuthCallback = (req, res) => {
    try {
        // User is authenticated via Passport
        const user = req.user;

        if (!user) {
            return res.redirect('http://localhost:5173/login?error=oauth_failed');
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.SECRET, {
            expiresIn: '7d',
        });

        // Redirect to frontend with token
        res.redirect(`http://localhost:5173/login?token=${token}&user=${encodeURIComponent(JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage
        }))}`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('http://localhost:5173/login?error=server_error');
    }
};

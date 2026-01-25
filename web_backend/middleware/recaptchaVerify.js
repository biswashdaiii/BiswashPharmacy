import axios from 'axios';

// Verify reCAPTCHA token
export const verifyRecaptcha = async (req, res, next) => {
    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.status(400).json({
            success: false,
            message: 'reCAPTCHA token is required'
        });
    }

    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        // Verify token with Google
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: secretKey,
                    response: recaptchaToken
                }
            }
        );

        if (response.data.success) {
            // reCAPTCHA verification successful, proceed to next middleware
            next();
        } else {
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA verification failed. Please try again.'
            });
        }
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying reCAPTCHA. Please try again.'
        });
    }
};

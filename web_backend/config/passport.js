import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import { encrypt } from '../utils/encryption.js';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // User exists, return user
                    return done(null, user);
                }

                // Create new user from Google profile
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: 'google-oauth-' + Math.random().toString(36), // Random password (won't be used)
                    googleId: profile.id,
                    profileImage: profile.photos[0]?.value || '',
                    gender: 'Not Selected',
                    dob: 'Not selected',
                    phone: encrypt('0000000000'),
                    address: encrypt(JSON.stringify({ line1: '', line2: '' })),
                    previousPasswords: [],
                    passwordLastChangedAt: Date.now()
                });

                return done(null, user);
            } catch (error) {
                console.error('Passport Google Strategy Error:', error);
                return done(error, null);
            }
        }
    )
);

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;

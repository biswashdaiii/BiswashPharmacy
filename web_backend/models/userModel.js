import mongoose from "mongoose";
const USerSchema = new mongoose.Schema(
    {

        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profileImage: { type: String, default: "" },
        address: { type: Object, default: { line1: '', line2: '' } },
        gender: { type: String, default: "Not Selected" },
        dob: { type: String, default: "Not selected" },
        phone: { type: String, default: "0000000000" },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        googleId: { type: String, default: null },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },

        // Security fields
        isActive: { type: Boolean, default: true }, // For banning/disabling users
        previousPasswords: { type: [String], default: [] }, // Store last 5 password hashes
        passwordLastChangedAt: { type: Date, default: Date.now }, // Track password rotation

        // 2FA fields
        twoFactorEnabled: { type: Boolean, default: false },
        otp: { type: String, default: null },
        otpExpiry: { type: Date, default: null },
        otpAttempts: { type: Number, default: 0 },

        // Brute-force protection
        failedLoginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
        cartData: { type: Object, default: {} },




    },

    {
        timestamps: true,
    }
)
const usermodel = mongoose.models.user || mongoose.model('user', USerSchema)

export default usermodel
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from './models/userModel.js';

dotenv.config();

const promoteToAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const user = await userModel.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(0);
        }

        user.role = 'admin';
        await user.save();

        console.log(`SUCCESS: User ${email} has been promoted to ADMIN.`);
        console.log('You can now log in and access the Admin Panel.');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const emailArgument = process.argv[2];

if (!emailArgument) {
    console.log('Usage: node promote-admin.js your-email@example.com');
} else {
    promoteToAdmin(emailArgument);
}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config(); // ✅ Load .env variables

const CONNECTION_STRING = process.env.MONGODB_URI;

export const connectDB = async () => {
    try {
        await mongoose.connect(CONNECTION_STRING, {
        
        });
        console.log(" MongoDB connected");
    } catch (err) {
        console.error(" data base connection error:", err.message);
        process.exit(1); 
    }
};

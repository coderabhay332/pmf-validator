
import mongoose from 'mongoose';
import User from './models/User';
import dotenv from 'dotenv';

dotenv.config();


async function test() {
    try {
        console.log('Connecting to MongoDB...');
        const url = process.env.MONGO_URI;
        await mongoose.connect(url || '', {
            serverSelectionTimeoutMS: 2000
        });
        console.log('Connected!');
        await mongoose.disconnect();
    } catch (e: any) {
        console.error('Error:', e);
    }
}
test();

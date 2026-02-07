// Check specific task
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TaskModel from './models/Task';

dotenv.config();

async function checkTask() {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB\n');

        const task = await TaskModel.findOne({ browserUseId: '010696b3-0c9e-47e1-a451-e79722128aae' });

        if (task) {
            console.log('Task found!');
            console.log('Status:', task.status);
            console.log('Has result:', task.result ? 'YES' : 'NO');
            if (task.result) {
                console.log('\nResult:');
                console.log(JSON.stringify(task.result, null, 2));
            }
        } else {
            console.log('Task NOT found in database!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTask();

// Script to inspect task data in MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TaskModel from './models/Task';

dotenv.config();

async function inspectTasks() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');

        // Find all tasks
        const tasks = await TaskModel.find().sort({ createdAt: -1 }).limit(5);

        console.log(`\n=== Found ${tasks.length} tasks ===\n`);

        for (const task of tasks) {
            console.log('---'.repeat(20));
            console.log(`Task ID: ${task._id}`);
            console.log(`Browser Use ID: ${task.browserUseId}`);
            console.log(`Status: ${task.status}`);
            console.log(`Prompt: ${task.prompt.substring(0, 50)}...`);
            console.log(`Created At: ${task.createdAt}`);
            console.log(`\nResult field exists: ${task.result ? 'YES' : 'NO'}`);
            if (task.result) {
                console.log('Result content:');
                console.log(JSON.stringify(task.result, null, 2));
            }
            console.log(`\nLogs field exists: ${task.logs ? 'YES' : 'NO'}`);
            if (task.logs && Array.isArray(task.logs)) {
                console.log(`Number of log entries: ${task.logs.length}`);
                if (task.logs.length > 0) {
                    console.log('Last log entry:');
                    console.log(JSON.stringify(task.logs[task.logs.length - 1], null, 2));
                }
            }
            console.log('\n');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspectTasks();

console.log("Script starting...");

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
const envPath = path.resolve(__dirname, '.env');
console.log(`Loading .env from ${envPath}`);
dotenv.config({ path: envPath });

console.log("API Key present:", !!process.env.BROWSER_USE_API_KEY);

import { BrowserUseClient } from './client';

async function testStreaming() {
    console.log("Initializing client...");
    try {
        const client = new BrowserUseClient();
        console.log("Client initialized.");

        console.log("Creating a test task...");
        const task = await client.createTask("Go to google.com and get the page title");
        console.log(`Task created with ID: ${task.task_id || task.id}`);

        const taskId = task.task_id || task.id;
        if (!taskId) {
            console.error("Failed to get task ID");
            return;
        }

        console.log("Starting to stream logs...");
        const stream = client.streamTask(taskId, 2000);

        for await (const log of stream) {
            if (log.type === 'status') {
                console.log(`[STATUS UPDATE]: ${log.status}`);
            } else {
                console.log(`[LOG]:`, JSON.stringify(log));
            }
        }

        console.log("Streaming finished.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testStreaming();

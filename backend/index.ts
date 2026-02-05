import { BrowserUseClient } from './client';
import { task } from './task';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const client = new BrowserUseClient();

    console.log("Creating task...");
    const createdTask = await client.createTask(task);

    // Check for task_id or id in the response
    const taskId = createdTask.task_id || createdTask.id;

    if (!taskId) {
        console.error("Failed to get Task ID from response:", createdTask);
        return;
    }

    console.log(`Task Created! ID: ${taskId}`);

    // Poll for status
    let status = 'active'; // Assume active initially
    while (status !== 'completed' && status !== 'failed' && status !== 'stopped') {
        const taskDetails = await client.getTask(taskId);
        status = taskDetails.status; // Adjust property name if needed based on API
        console.log(`Task Status: ${status}`);

        if (status === 'completed' || status === 'failed' || status === 'stopped') {
            break;
        }

        await sleep(2000); // Poll every 2 seconds
    }

    console.log("Task finished. Fetching logs...");
    const logs = await client.getTaskLogs(taskId);
    console.log("Logs:", JSON.stringify(logs, null, 2));

    // Example of using updateTask (e.g., to stop it, though it's likely finished here)
    // await client.updateTask(taskId, { action: 'stop' }); 
})();

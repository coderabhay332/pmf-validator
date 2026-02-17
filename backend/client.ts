import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import * as https from 'https';

dotenv.config();

export interface Task {
    id: string; // Assuming 'id' or 'task_id' - existing code used task_id but let's check response
    task_id?: string; // API seems to return task_id sometimes
    status: string;
    steps?: any[]; // Array of steps from the API
    // Add other fields as discovered from logs or docs
    [key: string]: any;
}

export class BrowserUseClient {
    private client: AxiosInstance;
    private apiKey: string;
    private baseUrl: string = "https://api.browser-use.com/api/v2";

    constructor(apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey || process.env.BROWSER_USE_API_KEY || "";
        if (!this.apiKey) {
            throw new Error("BROWSER_USE_API_KEY is not set");
        }
        if (baseUrl) {
            this.baseUrl = baseUrl;
        }

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                "X-Browser-Use-API-Key": this.apiKey,
                "Content-Type": "application/json"
            }
        });
    }

    /**
     * Create a new task
     * POST /tasks
     */
    async createTask(taskDescription: string, webhookUrl?: string): Promise<Task> {
        try {
            const payload: any = { task: taskDescription };
            const response = await this.client.post('/tasks', payload);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }


    async getTask(taskId: string): Promise<Task> {
        try {
            const response = await this.client.get(`/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Update a task (e.g., stop, pause, resume)
     * PATCH /tasks/{task_id}
     */
    async updateTask(taskId: string, payload: any): Promise<Task> {
        try {
            const response = await this.client.patch(`/tasks/${taskId}`, payload);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get task logs
     * GET /tasks/{task_id}/logs
     */
    async getTaskLogs(taskId: string): Promise<any> {
        try {
            const response = await this.client.get(`/tasks/${taskId}/logs`);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Simulation of a stream by polling the logs endpoint.
     * This keeps yielding new logs as they arrive.
     */
    async *streamTask(taskId: string, pollInterval: number = 3000): AsyncGenerator<any> {
        let lastStepCount = 0;
        let isCompleted = false;

        while (!isCompleted) {
            try {
                const task = await this.getTask(taskId);

                // Yield new steps
                if (task.steps && Array.isArray(task.steps) && task.steps.length > lastStepCount) {
                    const newSteps = task.steps.slice(lastStepCount);
                    for (const step of newSteps) {
                        yield step;
                    }
                    lastStepCount = task.steps.length;
                }

                // Check for completion
                const currentStatus = task.status ? task.status.toUpperCase() : '';
                if (['COMPLETED', 'FAILED', 'STOPPED', 'DONE', 'FINISHED'].includes(currentStatus)) {
                    isCompleted = true;
                    // Yield a final status update
                    // Map 'finished'/'completed' to 'DONE' for the store to handle it correctly
                    let finalStatus = task.status;
                    if (['FINISHED', 'COMPLETED'].includes(currentStatus)) {
                        finalStatus = 'DONE';
                    }
                    yield { type: 'status', status: finalStatus };
                }

            } catch (error) {
                console.error(`Error polling task ${taskId}:`, error);
                // Optionally yield an error or just continue trying
            }

            if (!isCompleted) {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
    }

    private handleError(error: any) {
        if (axios.isAxiosError(error)) {
            console.error("API Error:", error.response?.data || error.message);
        } else {
            console.error("Unknown Error:", error);
        }
    }
}

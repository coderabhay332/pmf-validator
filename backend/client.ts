import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export interface Task {
    id: string; // Assuming 'id' or 'task_id' - existing code used task_id but let's check response
    task_id?: string; // API seems to return task_id sometimes
    status: string;
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
            if (webhookUrl) {
                payload.webhook_url = webhookUrl;
            }
            const response = await this.client.post('/tasks', payload);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get a task by ID
     * GET /tasks/{task_id}
     */
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

    private handleError(error: any) {
        if (axios.isAxiosError(error)) {
            console.error("API Error:", error.response?.data || error.message);
        } else {
            console.error("Unknown Error:", error);
        }
    }
}

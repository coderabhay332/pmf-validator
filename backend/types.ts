
export interface BrowserUseClientConfig {
    apiKey: string;
    baseUrl?: string;
}

export interface WebhookPayload {
    type: string; // "agent.task.status_update", "test"
    timestamp: string;
    payload: {
        session_id?: string;
        task_id?: string; // or id? docs say task_id
        status?: string; // "started", "finished", "stopped"
        metadata?: any;
        test?: string; // for "test" event
        [key: string]: any;
    };
}

export type TaskStatus = 'INIT' | 'STARTED' | 'RUNNING' | 'PROCESSING' | 'FINALIZING' | 'DONE' | 'ERROR';

export interface FinalResult {
    output?: string;
    claim?: string;
    pricingVisible?: boolean;
    aiRetrieval?: {
        success: boolean;
        latencySeconds: number;
    };
    finalVerdict?: "WORKS" | "BROKEN" | "UNKNOWN";
}

export interface TaskState {
    id: string;
    status: TaskStatus;
    logs: any[]; // Store logs or messages
    latestMessage: string;
    result?: FinalResult;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTaskRequest {
    taskPrompt: string;
}

export interface CreateTaskResponse {
    taskId: string;
    status: string;
}

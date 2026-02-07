
import { Response } from 'express';
import { TaskState, TaskStatus } from './types';

export class TaskStore {
    private tasks: Map<string, TaskState> = new Map();
    private clients: Map<string, Response[]> = new Map();

    initTask(taskId: string) {
        this.tasks.set(taskId, {
            id: taskId,
            status: 'INIT',
            logs: [],
            latestMessage: 'Task initialized',
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    getTask(taskId: string): TaskState | undefined {
        return this.tasks.get(taskId);
    }

    getRunningTasks(): TaskState[] {
        return Array.from(this.tasks.values()).filter(t => 
            t.status === 'RUNNING' || t.status === 'PROCESSING' || t.status === 'STARTED' || t.status === 'INIT'
        );
    }

    updateTask(taskId: string, updates: Partial<TaskState>) {
        const task = this.tasks.get(taskId);
        if (task) {
            Object.assign(task, updates);
            task.updatedAt = new Date();
            this.tasks.set(taskId, task); // Not strictly needed for object reference but good for clarity

            // Notify clients
            this.notifyClients(taskId, task);

            // Cleanup on completion
            if (updates.status === 'DONE' || updates.status === 'ERROR') {
                // Clean up clients after sending the final message
                setTimeout(() => this.cleanup(taskId), 5000);
            }
        }
    }

    addClient(taskId: string, res: Response) {
        if (!this.clients.has(taskId)) {
            this.clients.set(taskId, []);
        }
        this.clients.get(taskId)?.push(res);

        // Send current state
        const task = this.tasks.get(taskId);
        if (task) {
            const data = JSON.stringify({ type: 'status', data: { step: task.status, message: task.latestMessage } });
            res.write(`data: ${data}\n\n`);
        }
    }

    removeClient(taskId: string, res: Response) {
        const waiting = this.clients.get(taskId);
        if (waiting) {
            this.clients.set(taskId, waiting.filter(c => c !== res));
        }
    }

    appendLogs(taskId: string, newLogs: any[]) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.logs = [...task.logs, ...newLogs];
            task.updatedAt = new Date();
            this.notifyClients(taskId, task, 'log', newLogs);
        }
    }

    private notifyClients(taskId: string, task: TaskState, explicitType?: string, explicitData?: any) {
        const waiting = this.clients.get(taskId);
        if (waiting) {
            waiting.forEach(client => {
                let eventType = explicitType || 'status';
                let payload: any = explicitData;

                if (!explicitType) {
                    payload = { step: task.status, message: task.latestMessage };
                    if (task.status === 'DONE' && task.result) {
                        eventType = 'done';
                        payload = task.result;
                    } else if (task.status === 'ERROR') {
                        eventType = 'error';
                        payload = task.error;
                    }
                }

                client.write(`data: ${JSON.stringify({ type: eventType, data: payload })}\n\n`);
            });
        }
    }

    private cleanup(taskId: string) {
        // Close connections
        const waiting = this.clients.get(taskId);
        if (waiting) {
            waiting.forEach(res => res.end());
            this.clients.delete(taskId);
        }
        // Optional: delete task from memory after a delay
        setTimeout(() => {
            this.tasks.delete(taskId);
            console.log(`Cleaned up task ${taskId}`);
        }, 1000 * 60 * 5); // 5 mins
    }
}

export const store = new TaskStore();

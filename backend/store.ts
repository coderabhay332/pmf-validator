import { Response } from 'express';

interface LogEntry {
    timestamp: string;
    type: string;
    message: string;
    data?: any;
}

interface TaskData {
    id: string;
    status: string;
    logs: LogEntry[];
    clients: Response[];
    latestMessage?: string;
    result?: any;
    error?: string;
    createdAt: number;
    updatedAt: number;
}

class TaskStore {
    private tasks: Map<string, TaskData> = new Map();

    initTask(taskId: string): void {
        if (!this.tasks.has(taskId)) {
            this.tasks.set(taskId, {
                id: taskId,
                status: 'PENDING',
                logs: [],
                clients: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            console.log(`[Store] Initialized task ${taskId}`);
        }
    }

    getTask(taskId: string): TaskData | undefined {
        return this.tasks.get(taskId);
    }

    addLog(taskId: string, log: LogEntry): void {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.initTask(taskId);
        }

        const currentTask = this.tasks.get(taskId)!;
        currentTask.logs.push(log);
        currentTask.updatedAt = Date.now();

        // Broadcast to all connected clients
        this.broadcast(taskId, {
            type: 'log',
            data: log
        });

        console.log(`[Store] Added log to ${taskId}: ${log.message.substring(0, 50)}...`);
    }

    updateTask(taskId: string, updates: Partial<Omit<TaskData, 'id' | 'clients'>>): void {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.initTask(taskId);
        }

        const currentTask = this.tasks.get(taskId)!;
        Object.assign(currentTask, updates, { updatedAt: Date.now() });

        // Broadcast update to all clients
        this.broadcast(taskId, {
            type: 'update',
            data: {
                status: currentTask.status,
                latestMessage: currentTask.latestMessage,
                result: currentTask.result,
                error: currentTask.error,
                updatedAt: currentTask.updatedAt
            }
        });

        console.log(`[Store] Updated task ${taskId}:`, updates.status || updates.latestMessage);

        // If task is finished, close all clients
        if (['DONE', 'ERROR', 'FINISHED', 'COMPLETED', 'FAILED'].includes(updates.status?.toUpperCase() || '')) {
            const task = this.tasks.get(taskId);
            if (task) {
                console.log(`[Store] Closing ${task.clients.length} clients for finished task ${taskId}`);
                task.clients.forEach(client => {
                    try {
                        client.end();
                    } catch (e) {
                        console.error(`Error closing client for ${taskId}`, e);
                    }
                });
                task.clients = [];
            }
        }
    }

    addClient(taskId: string, res: Response): void {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.initTask(taskId);
        }
        this.tasks.get(taskId)!.clients.push(res);
        console.log(`[Store] Client added to ${taskId}. Total clients: ${this.tasks.get(taskId)!.clients.length}`);
    }

    removeClient(taskId: string, res: Response): void {
        const task = this.tasks.get(taskId);
        if (task) {
            task.clients = task.clients.filter(client => client !== res);
            console.log(`[Store] Client removed from ${taskId}. Total clients: ${task.clients.length}`);

            // Cleanup if no clients and task is done
            if (task.clients.length === 0 && (task.status === 'DONE' || task.status === 'ERROR')) {
                setTimeout(() => {
                    if (this.tasks.get(taskId)?.clients.length === 0) {
                        this.tasks.delete(taskId);
                        console.log(`[Store] Cleaned up completed task ${taskId}`);
                    }
                }, 60000); // Keep for 1 minute after last client disconnects
            }
        }
    }

    broadcast(taskId: string, message: any): void {
        const task = this.tasks.get(taskId);
        if (!task || task.clients.length === 0) return;

        const data = `data: ${JSON.stringify(message)}\n\n`;
        const deadClients: Response[] = [];

        task.clients.forEach(client => {
            try {
                client.write(data);
                if ((client as any).flush) (client as any).flush();
            } catch (error) {
                console.error(`[Store] Failed to send to client, marking for removal`);
                deadClients.push(client);
            }
        });

        // Remove dead clients
        if (deadClients.length > 0) {
            task.clients = task.clients.filter(c => !deadClients.includes(c));
        }
    }

    getAllTasks(): TaskData[] {
        return Array.from(this.tasks.values());
    }
}

export const store = new TaskStore();

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { BrowserUseClient } from './client';
import { store } from './store';
import { mapWebhookStatus, extractResult, verifySecret } from './utils';
import { WebhookPayload, CreateTaskRequest } from './types';
import { connectDB } from './db';
import User from './models/User';
import TaskModel from './models/Task';
import { protect } from './middleware/auth';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';
import mongoose from 'mongoose';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 3000;
const client = new BrowserUseClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const generateToken = (id: string) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// ---------------------------------------------------------------------
// AUTH ROUTES
// ---------------------------------------------------------------------

// POST /api/auth/signup
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({ email, password });

        if (user) {
            res.status(201).json({
                _id: user.id,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await (user as any).matchPassword(password))) {
            res.json({
                _id: user.id,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ---------------------------------------------------------------------
// TASK ROUTES (Protected)
// ---------------------------------------------------------------------

/**
 * POST /api/tasks
 * Create Task
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskPrompt
 *             properties:
 *               taskPrompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 dbId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.post('/api/tasks', protect, async (req, res) => {
    try {
        const { taskPrompt } = req.body as CreateTaskRequest;
        const webhookUrl = process.env.PUBLIC_WEBHOOK_URL || `http://localhost:${PORT}/api/webhooks/browser-use`;

        if (!taskPrompt) {
            return res.status(400).json({ error: "taskPrompt is required" });
        }

        console.log(`Creating task: "${taskPrompt.substring(0, 50)}..."`);
        const browserTask = await client.createTask(taskPrompt, webhookUrl);
        const taskId = browserTask.task_id || browserTask.id;

        if (!taskId) {
            throw new Error("Failed to get taskId from Browser Use API");
        }

        // Save to DB
        const newTask = await TaskModel.create({
            user: req.user._id,
            browserUseId: taskId,
            prompt: taskPrompt,
            status: 'STARTED',
            logs: [],
        });

        // Initialize in-memory store for real-time streaming
        store.initTask(taskId);

        res.json({
            taskId, // We return browserUseId for consistency with streaming/webhooks logic
            dbId: newTask._id,
            status: "STARTED"
        });

    } catch (error: any) {
        console.error("Error creating task:", error.message);
        res.status(500).json({ error: error.message || "Failed to create task" });
    }
});

/**
 * GET /api/tasks
 * List User Tasks
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List all tasks for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.get('/api/tasks', protect, async (req, res) => {
    try {
        const tasks = await TaskModel.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tasks/:taskId
 * Get Single Task
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID (DB ID or BrowserUse ID)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.get('/api/tasks/:id', protect, async (req, res) => {
    try {
        const id = req.params.id as string;
        let query: any = { user: req.user._id };

        if (mongoose.Types.ObjectId.isValid(id)) {
            query.$or = [{ _id: id }, { browserUseId: id }];
        } else {
            query.browserUseId = id;
        }

        const task = await TaskModel.findOne(query);

        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// ---------------------------------------------------------------------
// WEBHOOK RECEIVER
// ---------------------------------------------------------------------

app.post('/api/webhooks/browser-use', verifySecret, async (req, res) => {
    try {
        const body = req.body as WebhookPayload;
        const { type, payload } = body;

        if (type === 'test') {
            console.log('Received test webhook event');
            return res.status(200).send('OK');
        }

        if (type === 'agent.task.status_update' && payload) {
            const { task_id, status } = payload;

            if (!task_id) {
                return res.status(400).send('Missing task_id');
            }

            console.log(`Webhook received for ${task_id}: ${type} (${status})`);

            const backendStatus = mapWebhookStatus(type, status);

            // Update In-Memory Store (for SSE)
            const updatePayload: any = {
                status: backendStatus,
                latestMessage: `Event: ${type} - ${status}`
            };

            store.updateTask(task_id, updatePayload);

            // Update Database
            const dbUpdate: any = { status: backendStatus };

            // Find task in DB
            let task = await TaskModel.findOne({ browserUseId: task_id });
            if (task) {
                Object.assign(task, dbUpdate);
                await task.save();
            }

            // Handle Finalization
            if (backendStatus === 'FINALIZING') {
                (async () => {
                    try {
                        console.log(`Fetching logs for finalizing task ${task_id}...`);
                        const logs = await client.getTaskLogs(task_id);

                        // Also get the full task details just in case output is there
                        const taskDetails = await client.getTask(task_id);

                        console.log('Task Details:', JSON.stringify(taskDetails, null, 2));
                        console.log('Task Logs:', JSON.stringify(logs, null, 2));

                        const result = extractResult(taskDetails, logs); // Pass taskDetails first as it might have 'output'

                        console.log('Extracted Result:', JSON.stringify(result, null, 2));

                        // Helper to update both DB and Store
                        const finalUpdate: any = {
                            status: 'DONE',
                            latestMessage: 'Task completed successfully',
                            result: result || undefined,
                            logs: logs // Optional: save all logs to DB? It might be large.
                        };

                        if (!result) {
                            finalUpdate.status = 'ERROR';
                            finalUpdate.error = 'Failed to extract valid result';
                        }

                        store.updateTask(task_id, finalUpdate);

                        if (task) {
                            task.status = finalUpdate.status;
                            task.result = finalUpdate.result;
                            task.logs = logs; // Save logs to DB if needed
                            await task.save();
                            console.log('Task saved to DB with result:', task.result ? 'YES' : 'NO');
                        }

                    } catch (err: any) {
                        console.error(`Failed to fetch logs/result for ${task_id}:`, err);
                        store.updateTask(task_id, {
                            status: 'ERROR',
                            error: err.message,
                            latestMessage: 'Failed to fetch final result'
                        });
                        if (task) {
                            task.status = 'ERROR';
                            // task.error = err.message; // Add error field to schema if needed
                            await task.save();
                        }
                    }
                })();
            }
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error("Webhook processing error:", err);
        res.status(500).send('Internal Server Error');
    }
});

// ---------------------------------------------------------------------
// SSE STREAM ENDPOINT (Public/Protected?)
// ---------------------------------------------------------------------
// Note: SSE difficult to auth with headers in EventSource. 
// Often passed via query param ?token=... or unprotected if taskId is secret enough.
// For now, leaving unprotected by Auth Middleware, but logic remains same.
// User can access stream if they know taskId.

app.get('/api/tasks/:taskId/stream', (req, res) => {
    const { taskId } = req.params;

    // Headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const task = store.getTask(taskId);
    if (!task) {
        // Just keep open to wait for it? Or close?
        // If we just created it, it should be there.
        res.write(`data: ${JSON.stringify({ type: 'status', data: { step: 'INIT', message: 'Waiting for task initialization...' } })}\n\n`);
    }

    console.log(`Client connected to stream for ${taskId}`);
    store.addClient(taskId, res);

    req.on('close', () => {
        console.log(`Client disconnected from ${taskId}`);
        store.removeClient(taskId, res);
    });
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);

    // Poll for logs and status every 2 seconds
    setInterval(async () => {
        const runningTasks = store.getRunningTasks();
        for (const task of runningTasks) {
            try {
                // Poll task status from Browser Use API
                const taskDetails = await client.getTask(task.id);
                console.log(`Polling task ${task.id}: status = ${taskDetails.status}`);

                // Check if task has finished
                if (taskDetails.status === 'finished' || taskDetails.status === 'completed' || taskDetails.status === 'done') {
                    // Task completed! Trigger finalization logic
                    console.log(`Task ${task.id} completed! Fetching logs and extracting result...`);

                    const logs = await client.getTaskLogs(task.id);
                    console.log('Task Details:', JSON.stringify(taskDetails, null, 2));
                    console.log('Task Logs:', JSON.stringify(logs, null, 2));

                    const result = extractResult(taskDetails, logs);
                    console.log('Extracted Result:', JSON.stringify(result, null, 2));

                    const finalUpdate: any = {
                        status: 'DONE',
                        latestMessage: 'Task completed successfully',
                        result: result || undefined,
                        logs: logs
                    };

                    if (!result) {
                        finalUpdate.status = 'ERROR';
                        finalUpdate.error = 'Failed to extract valid result';
                    }

                    store.updateTask(task.id, finalUpdate);

                    // Update DB
                    const dbTask = await TaskModel.findOne({ browserUseId: task.id });
                    if (dbTask) {
                        dbTask.status = finalUpdate.status;
                        dbTask.result = finalUpdate.result;
                        dbTask.logs = logs;
                        await dbTask.save();
                        console.log('Task saved to DB with result:', dbTask.result ? 'YES' : 'NO');
                    }
                } else if (taskDetails.status === 'failed' || taskDetails.status === 'error') {
                    // Task failed
                    console.log(`Task ${task.id} failed!`);
                    store.updateTask(task.id, {
                        status: 'ERROR',
                        latestMessage: 'Task failed',
                        error: 'Task reported as failed by Browser Use API'
                    });

                    const dbTask = await TaskModel.findOne({ browserUseId: task.id });
                    if (dbTask) {
                        dbTask.status = 'ERROR';
                        await dbTask.save();
                    }
                } else {
                    // Task still running - poll for logs
                    const logs = await client.getTaskLogs(task.id);

                    if (Array.isArray(logs) && logs.length > task.logs.length) {
                        const newLogs = logs.slice(task.logs.length);
                        if (newLogs.length > 0) {
                            store.appendLogs(task.id, newLogs);
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to poll task ${task.id}:`, error);
            }
        }
    }, 2000);
});

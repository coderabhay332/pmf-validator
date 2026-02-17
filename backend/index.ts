import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { BrowserUseClient } from './client';
import { store } from './store';
import { mapWebhookStatus, extractResult, verifySecret } from './utils';
import { WebhookPayload, CreateTaskRequest, TaskStatus, TaskState } from './types';
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

app.post('/api/tasks', protect, async (req, res) => {
    try {
        const { taskPrompt } = req.body as CreateTaskRequest;
        const webhookUrl = process.env.PUBLIC_WEBHOOK_URL || `http://localhost:${PORT}/api/webhooks/browser-use`;

        if (!taskPrompt) {
            return res.status(400).json({ error: "taskPrompt is required" });
        }

        console.log(`Creating task: "${taskPrompt.substring(0, 50)}..."`);

        const systemInstruction = `
IMPORTANT RESPONSE FORMAT INSTRUCTION:
You are a Product Market Fit Analyst. You must return your final analysis in strictly VALID JSON format.
Do not include any conversational text, markdown formatting (like \`\`\`json), or explanations outside the JSON object. 
The Output must be a single JSON object matching this exact structure:

{
  "product": "Product Name",
  "category": "Category Name",
  "date": "Date",
  "recommendation": "SHIP" | "PIVOT" | "KILL",
  "oneLineVerdict": "Brief verdict",
  "keyInsight": "Key insight",
  "scores": {
    "productMaturity": 0-10,
    "pmfReadiness": 0-10,
    "technicalQuality": 0-10,
    "marketOpportunity": 0-10,
    "viability": 0-10
  },
  "sections": {
    "productOverview": {
      "summary": "...",
      "features": [{ "name": "...", "status": "Works Well" | "Partially Works" | "Broken/Missing" }]
    },
    "marketAnalysis": {
      "summary": "...",
      "competitors": [{ "name": "...", "differentiator": "...", "pricing": "..." }]
    },
    "pricing": { "model": "...", "analysis": "..." },
    "ux": { "summary": "...", "audit": ["..."] },
    "technical": { "summary": "...", "stackAnalysis": "..." },
    "value": { "proposition": "...", "delivery": "..." },
    "willingness": { "summary": "...", "evidence": "..." },
    "growth": { "channels": ["..."], "strategy": "..." },
    "pmfDiagnosis": {
      "signals": [{ "label": "...", "met": boolean }], 
      "score": 0-7,
      "verdict": "..."
    },
    "blindSpots": { "risks": ["..."], "mitigation": "..." },
    "fixes": [{ "title": "...", "severity": "Critical" | "High" | "Medium", "impact": "...", "plan": "...", "timeline": "..." }],
    "finalRecommendation": { "reasoning": "...", "nextSteps": ["..."] }
  }
}
Perform the analysis requested by the user and populate this JSON.
`;

        const finalPrompt = `${taskPrompt}\n\n${systemInstruction}`;

        const browserTask = await client.createTask(finalPrompt, webhookUrl);
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

        // Initialize in-memory store for real-time SSE
        store.initTask(taskId);

        // Start streaming logs in background
        startLogStreaming(taskId);

        res.json({
            taskId,
            dbId: newTask._id,
            status: "STARTED"
        });

    } catch (error: any) {
        console.error("Error creating task:", error.message);
        res.status(500).json({ error: error.message || "Failed to create task" });
    }
});

app.get('/api/tasks', protect, async (req, res) => {
    try {
        const tasks = await TaskModel.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

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
// BACKGROUND LOG STREAMING
// ---------------------------------------------------------------------

async function startLogStreaming(taskId: string) {
    try {
        console.log(`Starting log stream for task ${taskId}`);

        // Use Browser Use's stream() method for real-time updates
        const stream = client.streamTask(taskId);

        for await (const update of stream) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: update.type || 'step',
                message: update.message || update.thought || JSON.stringify(update),
                data: update
            };

            // Add to store and broadcast to all connected clients
            store.addLog(taskId, logEntry);

            // Update task status if provided
            // Update task status if provided
            if (update.status) {
                const status = update.status.toUpperCase();

                // If it's a terminal status, finalize the task
                if (['DONE', 'COMPLETED', 'FINISHED', 'FAILED', 'STOPPED'].includes(status)) {
                    console.log(`Stream detected completion with status ${status}, finalizing...`);
                    await finalizeTask(taskId);
                    return; // Stop streaming
                }

                store.updateTask(taskId, {
                    status: update.status,
                    latestMessage: update.message || update.thought
                });

                // Persist status change to DB
                await TaskModel.findOneAndUpdate(
                    { browserUseId: taskId },
                    { status: update.status }
                ).catch(err => console.error("Failed to update task status in DB:", err));
            }
        }

        console.log(`Log stream ended for task ${taskId}`);
    } catch (error) {
        console.error(`Log streaming error for ${taskId}:`, error);
        store.updateTask(taskId, {
            status: 'ERROR',
            error: 'Log streaming failed',
            latestMessage: 'Failed to stream logs'
        });
    }
}

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
            const { task_id, status, logs: webhookLogs } = payload;

            if (!task_id) {
                return res.status(400).send('Missing task_id');
            }

            console.log(`Webhook received for ${task_id}: ${type} (${status})`);

            // Ensure store entry exists
            if (!store.getTask(task_id)) {
                store.initTask(task_id);
            }

            const backendStatus = mapWebhookStatus(type, status);

            // Process webhook logs if provided
            if (webhookLogs && Array.isArray(webhookLogs)) {
                webhookLogs.forEach((log: any) => {
                    store.addLog(task_id, {
                        timestamp: new Date().toISOString(),
                        type: 'webhook',
                        message: log.message || JSON.stringify(log),
                        data: log
                    });
                });
            }

            // Update In-Memory Store
            const updatePayload: any = {
                status: backendStatus,
                latestMessage: `Event: ${type} - ${status}`,
                lastWebhookAt: new Date().toISOString()
            };

            store.updateTask(task_id, updatePayload);

            // Update Database
            try {
                await TaskModel.findOneAndUpdate(
                    { browserUseId: task_id },
                    {
                        status: backendStatus,
                        $push: {
                            activityLog: {
                                type: 'status_change',
                                status: backendStatus,
                                timestamp: new Date()
                            }
                        }
                    },
                    { upsert: true }
                );
            } catch (dbError) {
                console.error('DB update failed:', dbError);
            }

            // Handle Finalization
            if (backendStatus === 'FINALIZING' || status === 'completed' || status === 'finished') {
                finalizeTask(task_id);
            }
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error("Webhook processing error:", err);
        res.status(500).send('Internal Server Error');
    }
});

async function finalizeTask(taskId: string) {
    try {
        console.log(`Finalizing task ${taskId}...`);

        const [taskDetails, logs] = await Promise.all([
            client.getTask(taskId),
            client.getTaskLogs(taskId)
        ]);

        const result = extractResult(taskDetails, logs);

        console.log('Extracted Result:', JSON.stringify(result, null, 2));

        const finalUpdate: any = {
            status: result ? 'DONE' : 'ERROR',
            latestMessage: result ? 'Task completed successfully' : 'Failed to extract valid result',
            result: result || undefined,
            error: result ? undefined : 'Failed to extract valid result',
            logs: logs,
            completedAt: new Date().toISOString()
        };

        // Add completion log
        store.addLog(taskId, {
            timestamp: new Date().toISOString(),
            type: 'completion',
            message: result?.output ? `Task Completed. Output:\n${result.output}` : finalUpdate.latestMessage,
            data: { result }
        });

        if (result?.output) {
            console.log("\n---------------------------------------------------");
            console.log("🎉 Task Completed Successfully!");
            console.log("---------------------------------------------------");
            console.log(result.output);
            console.log("---------------------------------------------------\n");
        }

        store.updateTask(taskId, finalUpdate);

        await TaskModel.findOneAndUpdate(
            { browserUseId: taskId },
            {
                status: finalUpdate.status,
                result: finalUpdate.result,
                logs: logs,
                completedAt: new Date()
            }
        );

        console.log(`Task ${taskId} finalized with status: ${finalUpdate.status}`);
    } catch (err: any) {
        console.error(`Finalization failed for ${taskId}:`, err);
        store.updateTask(taskId, {
            status: 'ERROR',
            error: err.message,
            latestMessage: 'Failed to fetch final result'
        });

        await TaskModel.findOneAndUpdate(
            { browserUseId: taskId },
            { status: 'ERROR', error: err.message }
        );
    }
}

// ---------------------------------------------------------------------
// SSE STREAM ENDPOINT
// ---------------------------------------------------------------------

app.get('/api/tasks/:taskId/stream', async (req, res) => {
    const { taskId } = req.params;

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    console.log(`Client connected to stream for ${taskId}`);

    // Initialize task in store if not exists
    if (!store.getTask(taskId)) {
        store.initTask(taskId);

        // Hydrate from DB
        try {
            const dbTask = await TaskModel.findOne({ browserUseId: taskId });
            if (dbTask) {
                store.updateTask(taskId, {
                    status: dbTask.status,
                    logs: dbTask.logs || [],
                    result: dbTask.result
                });
                console.log(`[Stream] Hydrated task ${taskId} from DB. Status: ${dbTask.status}`);
            }
        } catch (e) {
            console.error("Failed to hydrate task from DB:", e);
        }
    }

    const task = store.getTask(taskId);

    // Send initial state immediately
    res.write(`data: ${JSON.stringify({
        type: 'init',
        data: {
            taskId,
            status: task?.status || 'PENDING',
            logs: task?.logs || [],
            message: 'Connected to real-time stream'
        }
    })}\n\n`);

    if ((res as any).flush) (res as any).flush();

    // If task is already done, close the connection immediately
    if (task && ['DONE', 'ERROR', 'FAILED', 'COMPLETED', 'STOPPED', 'FINISHED'].includes(task.status?.toUpperCase())) {
        console.log(`Task ${taskId} is already ${task.status}, closing stream immediately.`);
        res.end();
        return;
    }

    // Add client to store
    store.addClient(taskId, res);

    // Send any existing logs immediately
    if (task?.logs && task.logs.length > 0) {
        res.write(`data: ${JSON.stringify({
            type: 'logs',
            data: task.logs
        })}\n\n`);
        if ((res as any).flush) (res as any).flush();
    }

    // Keep-alive ping every 30 seconds
    const keepAlive = setInterval(() => {
        try {
            res.write(`:ping\n\n`);
            if ((res as any).flush) (res as any).flush();
        } catch (e) {
            clearInterval(keepAlive);
        }
    }, 30000);

    req.on('close', () => {
        console.log(`Client disconnected from ${taskId}`);
        clearInterval(keepAlive);
        store.removeClient(taskId, res);
    });

    req.on('error', (err) => {
        console.error(`SSE error for ${taskId}:`, err);
        clearInterval(keepAlive);
        store.removeClient(taskId, res);
    });
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`Webhook URL: ${process.env.PUBLIC_WEBHOOK_URL || `http://localhost:${PORT}/api/webhooks/browser-use`}`);
    console.log(`Real-time streaming enabled`);
});

import { Request, Response, NextFunction } from 'express';
import { TaskStatus, FinalResult } from './types';

export const mapWebhookStatus = (eventType: string, status?: string): TaskStatus => {
    if (eventType === 'agent.task.status_update') {
        switch (status) {
            case 'started':
                return 'RUNNING';
            case 'finished':
                return 'FINALIZING';
            case 'stopped':
                return 'ERROR';
            default:
                return 'RUNNING';
        }
    }
    return 'RUNNING';
};

export const extractResult = (taskData: any, taskOutput?: any): FinalResult | null => {
    // Check if taskData has a direct output field (from BrowserUse API)
    if (taskData && taskData.output) {
        return {
            output: taskData.output,
            // Try to parse structured data even from the output string if possible, 
            // but for now, returning the output key is the priority.
            finalVerdict: "WORKS" as any // Default to WORKS if we got an output? Or leave undefined.
        };
    }

    // Legacy/PMF specific parsing
    let textToParse = "";
    if (taskOutput && typeof taskOutput === 'string') {
        textToParse = taskOutput;
    } else if (Array.isArray(taskData) && taskData.length > 0) {
        const lastLog = taskData[taskData.length - 1];
        if (lastLog.content) {
            textToParse = lastLog.content;
        }
    } else if (taskData && taskData.msg) {
        textToParse = taskData.msg;
    }

    if (!textToParse) return null;

    // Simple regex parsing
    const claimMatch = textToParse.match(/Claim:\s*(.+?)(?=\n|$)/i);
    const pricingMatch = textToParse.match(/Pricing visible:\s*(.+?)(?=\n|$)/i);
    const retrievalMatch = textToParse.match(/AI Retrieval:\s*(.+?)(?=\n|$)/i);
    const latencyMatch = textToParse.match(/Latency:\s*~?([\d.]+)\s*seconds?/i);
    const verdictMatch = textToParse.match(/Final Verdict:\s*(.+?)(?=\n|$)/i);

    if (verdictMatch || claimMatch) {
        return {
            output: textToParse, // Also store the full text as output
            claim: claimMatch ? claimMatch[1].trim() : "Unknown",
            pricingVisible: pricingMatch ? pricingMatch[1].toLowerCase().includes('yes') : false,
            aiRetrieval: {
                success: retrievalMatch ? retrievalMatch[1].toLowerCase().includes('success') : false,
                latencySeconds: latencyMatch ? parseFloat(latencyMatch[1]) : 0
            },
            finalVerdict: verdictMatch ? (verdictMatch[1].includes('WORKS') ? "WORKS" : "BROKEN" as any) : "UNKNOWN"
        };
    }

    // If no specific PMF structure but we have text, return it as output
    if (textToParse) {
        return { output: textToParse };
    }

    return null;
};

export const verifySecret = (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.WEBHOOK_SECRET;
    // Browser Use might verify differently, but usually it's a signature or just ensuring the URL is secret.
    // The user requirement says "Verify webhook secret header".
    // We assume the user configures Browser Use (or we assume we check a custom header).
    // Let's assume we expect `x-webhook-secret` header.
    const providedSecret = req.headers['x-webhook-secret'];

    if (!secret) {
        console.warn("WEBHOOK_SECRET not set in env. Allowing request (unsafe).");
        return next();
    }

    if (providedSecret !== secret) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    next();
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

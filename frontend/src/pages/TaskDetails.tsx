
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Loader2, Download, Copy, Check, Terminal, ExternalLink, Calendar, Code, Target } from 'lucide-react';
import PMFReportViewer from '../components/pmf/PMFReportViewer';
import { cn } from '../lib/utils';
import { MOCK_PMF_REPORT } from '../data/mockPMF';

interface Task {
    _id: string;
    browserUseId: string;
    status: string;
    prompt: string;
    logs: any[];
    result?: any;
    createdAt?: string;
}

export default function TaskDetails() {
    const { id } = useParams<{ id: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'logs' | 'result'>('logs');
    const [showDemo, setShowDemo] = useState(false);
    const [copied, setCopied] = useState(false);
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const eventSourceRef = useRef<EventSource | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        if (id) fetchTask();
    }, [id]);

    // Setup SSE and polling only if task is running
    useEffect(() => {
        // If task is not loaded yet, or if it's already done/error, don't start streams
        if (!task || task.status === 'DONE' || task.status === 'ERROR') {
            if (eventSourceRef.current) {
                console.log('Task finished, closing stream');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (task?.status === 'DONE') {
                setActiveTab('result'); // Switch to result tab automatically when done
            }
            return;
        }

        console.log('Starting real-time updates for task:', id);

        // Setup SSE connection
        const sse = new EventSource(`http://localhost:3000/api/tasks/${id}/stream`);

        sse.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // console.log('SSE received:', data);

            switch (data.type) {
                case 'init':
                    // console.log('Connected to stream:', data.data);
                    if (data.data?.status) {
                        setTask(prev => prev ? { ...prev, status: data.data.status } : null);
                    }
                    break;

                case 'log':
                    const logEntry = data.data;
                    const formattedLog = typeof logEntry === 'string'
                        ? logEntry
                        : `[${logEntry.type || 'info'}] ${logEntry.message}`;
                    setLogs(prev => [...prev, formattedLog]);
                    break;

                case 'logs':
                    if (Array.isArray(data.data)) {
                        const formattedLogs = data.data.map((log: any) => {
                            if (typeof log === 'string') return log;
                            return `[${log.type || 'info'}] ${log.message}`;
                        });
                        setLogs(prev => [...prev, ...formattedLogs]);
                    }
                    break;

                case 'update':
                    // console.log('Status update:', data.data);
                    if (data.data) {
                        setTask(prev => prev ? {
                            ...prev,
                            status: data.data.status || prev.status,
                            result: data.data.result || prev.result
                        } : null);
                    }

                    if (data.data?.latestMessage) {
                        setLogs(prev => [...prev, `[status] ${data.data.latestMessage}`]);
                    }

                    if (data.data?.status === 'DONE') {
                        setLogs(prev => [...prev, '✓ Task completed successfully!']);
                        sse.close();
                        fetchTask(true);
                        setActiveTab('result');
                    } else if (data.data?.status === 'ERROR') {
                        const errorMsg = data.data?.error || 'Unknown error occurred';
                        setLogs(prev => [...prev, `✗ Error: ${errorMsg}`]);
                        sse.close();
                        fetchTask(true);
                    }
                    break;
            }
        };

        sse.onerror = () => {
            console.log('SSE connection closed or failed.');
            sse.close();
        };

        eventSourceRef.current = sse;

        // Poll for task updates
        const pollInterval = setInterval(async () => {
            await fetchTask(true);
        }, 3000);

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            clearInterval(pollInterval);
        };
    }, [id, task?.status]); // Re-run if status changes

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (activeTab === 'logs') {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, activeTab]);

    const fetchTask = async (quiet = false) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`http://localhost:3000/api/tasks/${id}`, config);

            if (quiet) {
                setTask(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(data)) {
                        return data;
                    }
                    return prev;
                });
            } else {
                setTask(data);
                if (data.logs && Array.isArray(data.logs) && data.logs.length > 0 && logs.length === 0) {
                    const formattedLogs = data.logs.map((log: any) => {
                        if (typeof log === 'string') return log;
                        if (log.message) return `[${log.type || 'info'}] ${log.message}`;
                        return JSON.stringify(log);
                    });
                    setLogs(formattedLogs);
                }
                if (data.status === 'DONE') {
                    setActiveTab('result');
                }
            }
        } catch (error) {
            console.error('Error fetching task', error);
        }
    };

    const copyResultToClipboard = () => {
        if (task?.result?.output) {
            navigator.clipboard.writeText(task.result.output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!task) {
        return <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-slate-500 font-medium">Loading task details...</p>
            </div>
        </div>;
    }

    const isRunning = task.status !== 'DONE' && task.status !== 'ERROR' && task.status !== 'FAILED';


    // Helper to try parsing JSON safely
    const getPMFData = () => {
        if (showDemo) return MOCK_PMF_REPORT;
        if (!task?.result) return null;

        const validate = (data: any) => {
            const isValid = data && data.recommendation && data.scores && data.sections;
            if (!isValid && data) {
                // console.log("Validation failed for data:", Object.keys(data));
            }
            return isValid;
        };

        // 0. Check if result itself is the PMF object (or result.output is an object)
        if (validate(task.result)) return task.result;
        if (validate(task.result.output)) return task.result.output;

        if (!task.result.output || typeof task.result.output !== 'string') return null;

        try {
            const output = task.result.output.trim();

            // 1. Try direct parse
            try {
                const parsed = JSON.parse(output);
                if (validate(parsed)) return parsed;
                // Handle double-stringified JSON (e.g. "{\"product\":...}")
                if (typeof parsed === 'string') {
                    const doubleParsed = JSON.parse(parsed);
                    if (validate(doubleParsed)) return doubleParsed;
                }
            } catch (e) {
                console.log("Direct parse failed", e);
            }

            // 2. Try extracting from markdown code blocks
            const jsonBlockMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                try {
                    const parsed = JSON.parse(jsonBlockMatch[1]);
                    if (validate(parsed)) return parsed;
                } catch (e) {
                    console.log("Markdown parse failed", e);
                }
            }

            // 3. Fallback: Find first '{' and last '}'
            const firstBrace = output.indexOf('{');
            const lastBrace = output.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const potentialJson = output.substring(firstBrace, lastBrace + 1);
                try {
                    const parsed = JSON.parse(potentialJson);
                    if (validate(parsed)) return parsed;
                } catch (e) {
                    console.warn("Failed to parse extracted JSON content:", e);

                    // Fallback: Try to clean up escaped quotes and newlines if initial parse fails
                    try {
                        // Replace \" with " and \\n with \n to fix common stringification issues
                        const cleanedJson = potentialJson
                            .replace(/\\"/g, '"')
                            .replace(/\\n/g, '\n');

                        const parsed = JSON.parse(cleanedJson);
                        if (validate(parsed)) return parsed;
                    } catch (e2) {
                        console.warn("Failed to parse cleaned JSON content:", e2);
                        console.log("Failed content snippet:", potentialJson.substring(0, 100));
                    }
                }
            }

            return null;
        } catch (e) {
            console.warn("Unexpected error in getPMFData:", e);
            return null;
        }
    };

    const pmfData = getPMFData();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold text-slate-900 leading-none">Task Analysis</h1>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${task.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        task.status === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {isRunning && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                    {task.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-mono">{task.browserUseId}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                                ${activeTab === 'logs' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Terminal className="w-4 h-4" /> Live Logs
                        </button>
                        <button
                            onClick={() => {
                                setShowDemo(false);
                                setActiveTab('result');
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                                ${activeTab === 'result' && !showDemo ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Code className="w-4 h-4" /> Results
                        </button>
                        <button
                            onClick={() => {
                                setShowDemo(true);
                                setActiveTab('result');
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 
                                ${showDemo ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200'}`}
                            title="Load Mock Data for Demo"
                        >
                            <Target className="w-4 h-4" /> Demo
                        </button>
                        <button
                            onClick={() => {
                                setTask(null); // Clear state to show loading
                                fetchTask(false);
                            }}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent"
                            title="Refresh Data"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c5.2 0 9.3 2 9.3 5v7" /><path d="M21 12h-6" /><path d="M21 12v6" /></svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">

                {/* Left Column: Context & Prompt (Hidden if PMF Report is active to give full width) */}
                {(!pmfData || activeTab === 'logs') && (
                    <div className="w-full lg:w-1/3 flex flex-col gap-6 order-2 lg:order-1">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-500" />
                                Task Prompt
                            </h3>
                            <p className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                                {task.prompt}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                Metadata
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-medium uppercase">Task ID</label>
                                    <div className="text-sm font-mono text-slate-800 break-all">{task.browserUseId}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium uppercase">Created At</label>
                                    <div className="text-sm text-slate-800">
                                        {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium uppercase">Status</label>
                                    <div className="text-sm text-slate-800">{task.status}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Column: Logs / Results */}
                <div className={cn(
                    "w-full order-1 lg:order-2 flex flex-col min-h-[500px]",
                    (pmfData && activeTab === 'result') ? "lg:w-full" : "lg:w-2/3"
                )}>

                    {activeTab === 'logs' && (
                        <div className="flex-1 bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                            <div className="bg-slate-950 px-4 py-3 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                    </div>
                                    <span className="ml-3 text-xs font-mono text-slate-400">agent-logs.log</span>
                                </div>
                                {isRunning && (
                                    <span className="flex items-center gap-2 text-xs text-emerald-400 font-mono animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs sm:text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {logs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-50" />
                                        <p>Waiting for agent stream...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {logs.map((log, i) => (
                                            <div key={i} className="break-words leading-relaxed text-slate-300 border-l-2 border-transparent hover:border-slate-700 pl-2 -ml-2 py-0.5">
                                                <span className="opacity-50 mr-2 select-none">
                                                    {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                                {log}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'result' && (
                        <div className={cn(
                            "flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col",
                            pmfData ? "bg-slate-50 border-0 shadow-none overflow-visible" : ""
                        )}>
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    {pmfData ? 'PMF Analysis Report' : 'Agent Output'}
                                </h3>
                                <button
                                    onClick={() => {
                                        const textToCopy = pmfData ? JSON.stringify(pmfData, null, 2) : task.result?.output;
                                        if (textToCopy) {
                                            navigator.clipboard.writeText(textToCopy);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }
                                    }}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy JSON'}
                                </button>
                            </div>

                            <div className={cn("flex-1", !pmfData && "p-6 overflow-y-auto bg-white")}>
                                {task.result ? (
                                    pmfData ? (
                                        <PMFReportViewer data={pmfData} />
                                    ) : (
                                        <div className="prose prose-slate prose-sm max-w-none">
                                            {task.result.output ? (
                                                <div className="markdown-body">
                                                    <ReactMarkdown
                                                        components={{
                                                            h1: (props) => <h1 className="text-2xl font-bold text-slate-900 mb-4" {...props} />,
                                                            h2: (props) => <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3" {...props} />,
                                                            h3: (props) => <h3 className="text-lg font-medium text-slate-800 mt-4 mb-2" {...props} />,
                                                            ul: (props) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1" {...props} />,
                                                            ol: (props) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1" {...props} />,
                                                            li: (props) => <li className="text-slate-700" {...props} />,
                                                            p: (props) => <p className="text-slate-700 leading-relaxed mb-4" {...props} />,
                                                            code: (props) => <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                                                            pre: (props) => <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                                                            blockquote: (props) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-indigo-50/50 italic text-slate-700" {...props} />,
                                                            a: (props) => <a className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                        }}
                                                    >
                                                        {task.result.output}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 font-mono text-xs text-slate-700">
                                                    {JSON.stringify(task.result, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <div className="bg-slate-50 p-4 rounded-full mb-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                        </div>
                                        <p>Waiting for final results...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

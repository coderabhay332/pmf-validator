
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Task {
    _id: string;
    browserUseId: string;
    status: string;
    prompt: string;
    logs: any[];
    result?: any;
}

export default function TaskDetails() {
    const { id } = useParams<{ id: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const eventSourceRef = useRef<EventSource | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTask();

        // Setup SSE connection
        // Note: Standard EventSource doesn't support headers. 
        // We assume the stream endpoint is public or checking simple params if strictly protected.
        // For this POC, we'll try connecting directly.
        const sse = new EventSource(`http://localhost:3000/api/tasks/${id}/stream`);

        sse.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('SSE received:', data);

            if (data.type === 'log') {
                // Backend sends { type: 'log', data: [...newLogs] }
                // Each log could be a string or an object
                if (Array.isArray(data.data)) {
                    const formattedLogs = data.data.map((log: any) =>
                        typeof log === 'string' ? log : JSON.stringify(log)
                    );
                    setLogs(prev => [...prev, ...formattedLogs]);
                }
            } else if (data.type === 'status') {
                // Backend sends { type: 'status', data: { step: '...', message: '...' } }
                const message = data.data?.message || JSON.stringify(data.data);
                setLogs(prev => [...prev, message]);
                console.log('Status update:', message);
            } else if (data.type === 'done') {
                // Task completed successfully
                console.log('Task completed! Fetching final result...');
                setLogs(prev => [...prev, 'Task completed successfully!']);
                fetchTask();
                sse.close();
            } else if (data.type === 'error') {
                // Task failed
                const errorMsg = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
                setLogs(prev => [...prev, `Error: ${errorMsg}`]);
                fetchTask();
                sse.close();
            }
        };

        sse.onerror = () => {
            console.log('SSE connection closed or failed.');
            sse.close();
        };

        eventSourceRef.current = sse;

        //Poll for task updates every 3 seconds (in case SSE events are missed)
        const pollInterval = setInterval(async () => {
            await fetchTask();
        }, 3000);

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            clearInterval(pollInterval);
        };
    }, [id]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const fetchTask = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`http://localhost:3000/api/tasks/${id}`, config);
            setTask(data);
        } catch (error) {
            console.error('Error fetching task', error);
        }
    };

    if (!task) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow p-4">
                <div className="max-w-7xl mx-auto flex items-center">
                    <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold">Task Details: {id}</h1>
                    <span className={`ml-4 px-2 py-1 rounded text-xs font-bold 
                ${task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                            task.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                        {task.status}
                    </span>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex gap-4">
                {/* Logs Console */}
                <div className="w-2/3 bg-black rounded-lg shadow-lg overflow-hidden flex flex-col">
                    <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                        <span className="text-gray-300 font-mono text-sm">Real-time Logs</span>
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm text-green-400 overflow-y-auto max-h-[70vh]">
                        {logs.length === 0 && <span className="text-gray-500">Waiting for logs...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 break-words">{log}</div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Info & Result */}
                <div className="w-1/3 flex flex-col gap-4">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-semibold mb-2 text-gray-700">Prompt</h3>
                        <p className="text-gray-600 text-sm">{task.prompt}</p>
                    </div>

                    {task.result && (
                        <div className="bg-white p-6 rounded-lg shadow flex-1">
                            <h3 className="font-semibold mb-2 text-gray-700">Analysis Result</h3>
                            <div className="prose prose-sm max-w-none text-gray-800">
                                {task.result.output ? (
                                    <div className="whitespace-pre-wrap">{task.result.output}</div>
                                ) : (
                                    <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs">
                                        {JSON.stringify(task.result, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}


import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, LogOut, Terminal, Search, User, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';

interface Task {
    _id: string;
    browserUseId: string;
    status: string;
    prompt: string;
    createdAt: string;
}

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

    useEffect(() => {
        if (!user.token) {
            navigate('/login');
            return;
        }
        fetchTasks();
    }, [navigate]);

    const fetchTasks = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get('http://localhost:3000/api/tasks', config);
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks', error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.post('http://localhost:3000/api/tasks', { taskPrompt: prompt }, config);
            setPrompt('');
            navigate(`/tasks/${data.taskId}`);
        } catch (error) {
            console.error('Error creating task', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DONE':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Done</span>;
            case 'ERROR':
            case 'FAILED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3 h-3 mr-1" />Error</span>;
            case 'Running':
            case 'STARTED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"><Clock className="w-3 h-3 mr-1" />{status}</span>;
        }
    };

    const filteredTasks = tasks.filter(task =>
        task.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <Terminal className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                PMF Checker
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">{user.email?.split('@')[0]}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Hero / Create Task */}
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">What would you like to verify today?</h2>
                    <p className="text-slate-500 mb-8 text-lg">Enter a task to spin up an AI agent and check product-market fit metrics.</p>

                    <form onSubmit={handleCreateTask} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                        <div className="relative flex bg-white rounded-xl shadow-xl">
                            <input
                                type="text"
                                className="flex-1 p-4 pl-6 bg-transparent border-none rounded-l-xl focus:ring-0 text-slate-900 placeholder-slate-400 text-lg"
                                placeholder="e.g., 'Check if Notion is good for students'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-r-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Starting...</>
                                ) : (
                                    <><Plus className="w-5 h-5" /> Launch Agent</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Task List Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" /> Recent Tasks
                    </h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tasks Grid/Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {tasks.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Terminal className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No tasks yet</h3>
                            <p className="text-slate-500">Create your first agent task above to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompt</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                                        <tr key={task._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900 truncate max-w-md" title={task.prompt}>
                                                    {task.prompt}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(task.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    to={`/tasks/${task.browserUseId}`}
                                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
                                                >
                                                    View Details <ChevronRight className="w-4 h-4 ml-1" />
                                                </Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                No matching tasks found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}


import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, LogOut, Terminal } from 'lucide-react';

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
            // Optional: Handle token expiry
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.post('http://localhost:3000/api/tasks', { taskPrompt: prompt }, config);
            setPrompt('');
            // Redirect to task details page to show real-time logs
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

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">PMF Checker</h1>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-4 text-gray-600">Hello, {user.email?.split('@')[0]}</span>
                            <button
                                onClick={logout}
                                className="flex items-center text-red-500 hover:text-red-700"
                            >
                                <LogOut className="w-5 h-5 mr-1" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {/* Create Task Section */}
                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
                        <form onSubmit={handleCreateTask} className="flex gap-4">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                                placeholder="Describe user persona and task (e.g., 'Check if Notion is good for students')"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {loading ? 'Creating...' : <><Plus className="w-5 h-5 mr-1" /> Create Task</>}
                            </button>
                        </form>
                    </div>

                    {/* Task List Section */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Your Tasks</h2>
                        {tasks.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No tasks yet. Create one above!</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tasks.map((task) => (
                                            <tr key={task._id}>
                                                <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{task.prompt}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                                            task.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(task.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link to={`/tasks/${task.browserUseId}`} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                                                        <Terminal className="w-4 h-4 mr-1" /> View Logs
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}

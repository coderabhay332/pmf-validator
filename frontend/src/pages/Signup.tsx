
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:3000/api/auth/signup', {
                email,
                password,
            });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Signup failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h2 className="mb-6 text-3xl font-bold text-center text-gray-800">Sign Up</h2>
                {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded">{error}</div>}
                <form onSubmit={handleSignup}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="email">
                            Email
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Mail className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                type="email"
                                id="email"
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Lock className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                type="password"
                                id="password"
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                                placeholder="Choose a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:shadow-outline"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-500 hover:text-blue-700">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

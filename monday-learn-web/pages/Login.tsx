
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // OAuth2PasswordRequestForm expects 'username'
            formData.append('password', password);

            const data = await api.post<{ access_token: string }>('/auth/login', formData);

            localStorage.setItem('token', data.access_token);

            // Success
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="px-4 py-4">
                <button
                    onClick={() => navigate('/welcome')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            <div className="flex-1 px-6 max-w-md mx-auto w-full pt-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">登录</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase hidden">电子邮件或用户名</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="电子邮件地址或用户名"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1 relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="密码"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={!email || !password || loading}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-sm transition-all active:scale-[0.98] text-lg mt-4 flex items-center justify-center"
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>

                    <div className="text-center pt-2">
                        <button type="button" className="text-primary font-bold text-sm hover:underline">
                            忘记密码？
                        </button>
                    </div>
                </form>

                {/* Social Logins at bottom */}
                <div className="mt-auto pt-12 pb-8">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">或</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            继续用 Google 登录
                        </button>
                        <button className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                            <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor">
                                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                            </svg>
                            继续用 Apple 帐户登录
                        </button>
                        <button className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.647 4.535-4.647 1.313 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            继续用 Facebook 登录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

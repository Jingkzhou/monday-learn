
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

            const data = await api.post<{ access_token: string; role?: string }>('/auth/login', formData);

            localStorage.setItem('token', data.access_token);
            if (data.role) {
                localStorage.setItem('userRole', data.role);
            } else {
                localStorage.removeItem('userRole');
            }

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


            </div>
        </div>
    );
};

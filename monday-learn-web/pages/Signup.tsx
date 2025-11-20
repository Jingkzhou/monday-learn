
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ChevronDown } from 'lucide-react';

export const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Birthday, 2: Email/Pass

    const [birthday, setBirthday] = useState({ day: '', month: '', year: '' });
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    username,
                    password,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }

            // Success
            navigate('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between">
                <button
                    onClick={() => step === 1 ? navigate('/welcome') : setStep(1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <button onClick={() => navigate('/login')} className="text-primary font-bold text-sm hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">
                    登录
                </button>
            </div>

            <div className="flex-1 px-6 max-w-md mx-auto w-full pt-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">创建一个账户</h1>
                <p className="text-gray-500 mb-8 font-medium">快速、免费。</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-6">

                    {/* Birthday Inputs - Quizlet usually asks this first for COPPA compliance */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">出生日期</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg relative">
                                <select
                                    className="w-full h-full p-3 bg-transparent appearance-none outline-none font-medium text-gray-900 z-10 relative"
                                    value={birthday.day}
                                    onChange={e => setBirthday({ ...birthday, day: e.target.value })}
                                >
                                    <option value="" disabled>日</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-[2] bg-gray-50 border border-gray-200 rounded-lg relative">
                                <select
                                    className="w-full h-full p-3 bg-transparent appearance-none outline-none font-medium text-gray-900 z-10 relative"
                                    value={birthday.month}
                                    onChange={e => setBirthday({ ...birthday, month: e.target.value })}
                                >
                                    <option value="" disabled>月份</option>
                                    {["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"].map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-[1.5] bg-gray-50 border border-gray-200 rounded-lg relative">
                                <select
                                    className="w-full h-full p-3 bg-transparent appearance-none outline-none font-medium text-gray-900 z-10 relative"
                                    value={birthday.year}
                                    onChange={e => setBirthday({ ...birthday, year: e.target.value })}
                                >
                                    <option value="" disabled>年</option>
                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">电子邮件</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="输入您的电子邮件"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">用户名</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="andrew_123"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase">密码</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="●●●●●●●●"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-all font-medium pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2">
                        <input type="checkbox" id="terms" className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="terms" className="text-sm text-gray-500 leading-tight">
                            我接受 Quizlet 的<span className="text-primary font-bold">服务条款</span>和<span className="text-primary font-bold">隐私政策</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={!email || !username || !password || !birthday.year || loading}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-sm transition-all active:scale-[0.98] text-lg mt-4 flex items-center justify-center"
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>
            </div>
        </div>
    );
};


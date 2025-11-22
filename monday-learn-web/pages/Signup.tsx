
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';

export const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Birthday, 2: Email/Pass

    const [birthday, setBirthday] = useState({ day: '', month: '', year: '' });
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!birthday.day || !birthday.month || !birthday.year) {
            newErrors.birthday = '请填写完整的出生日期';
        }

        if (!email) {
            newErrors.email = '请输入电子邮件';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = '请输入有效的电子邮件地址';
        }

        if (!username) {
            newErrors.username = '请输入用户名';
        } else if (username.length < 3) {
            newErrors.username = '用户名至少需要3个字符';
        }

        if (!password) {
            newErrors.password = '请输入密码';
        } else if (password.length < 8) {
            newErrors.password = '密码至少需要8个字符';
        }

        if (!termsAccepted) {
            newErrors.terms = '请接受服务条款和隐私政策';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/signup', {
                email,
                username,
                password,
                role,
            });

            // Success
            navigate('/login');
        } catch (err: any) {
            setApiError(err.message || '注册失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-dark-blue flex flex-col transition-colors duration-200">
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between">
                <button
                    onClick={() => step === 1 ? navigate('/welcome') : setStep(1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <button onClick={() => navigate('/login')} className="text-primary dark:text-indigo-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 px-4 py-2 rounded-full transition-colors">
                    登录
                </button>
            </div>

            <div className="flex-1 px-6 max-w-md mx-auto w-full pt-4 pb-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">创建一个账户</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">快速、免费。</p>

                {apiError && (
                    <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-6">

                    {/* Birthday Inputs */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">出生日期</label>
                        <div className="flex gap-2">
                            <div className={`flex-1 bg-gray-50 dark:bg-[#15143c] border rounded-lg relative ${errors.birthday ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'}`}>
                                <select
                                    className="w-full h-full p-3 bg-transparent appearance-none outline-none font-medium text-gray-900 dark:text-white z-10 relative"
                                    value={birthday.day}
                                    onChange={e => setBirthday({ ...birthday, day: e.target.value })}
                                >
                                    <option value="" disabled>日</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                        <option key={d} value={d} className="text-gray-900 bg-white dark:bg-slate-800">{d}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <div className={`flex-[2] bg-gray-50 dark:bg-[#15143c] border rounded-lg relative ${errors.birthday ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'}`}>
                                <select
                                    className="w-full h-full p-3 bg-transparent appearance-none outline-none font-medium text-gray-900 dark:text-white z-10 relative"
                                    value={birthday.month}
                                    onChange={e => setBirthday({ ...birthday, month: e.target.value })}
                                >
                                    <option value="" disabled>月份</option>
                                    {["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"].map((m, i) => (
                                        <option key={i} value={i + 1} className="text-gray-900 bg-white dark:bg-slate-800">{m}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <div className={`flex-[1.5] bg-gray-50 dark:bg-[#15143c] border rounded-lg relative ${errors.birthday ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'}`}>
                                <select
                                    className="w-full h-full p-3 bg-transparent appearance-none outline-none font-medium text-gray-900 dark:text-white z-10 relative"
                                    value={birthday.year}
                                    onChange={e => setBirthday({ ...birthday, year: e.target.value })}
                                >
                                    <option value="" disabled>年</option>
                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y} className="text-gray-900 bg-white dark:bg-slate-800">{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        {errors.birthday && <p className="text-xs text-red-500 font-medium mt-1">{errors.birthday}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">电子邮件</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="输入您的电子邮件"
                            className={`w-full bg-gray-50 dark:bg-[#15143c] border rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#1a1b4b] focus:border-gray-900 dark:focus:border-white focus:ring-0 outline-none transition-all font-medium ${errors.email ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'}`}
                        />
                        {errors.email && <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">用户名</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="andrew_123"
                            className={`w-full bg-gray-50 dark:bg-[#15143c] border rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#1a1b4b] focus:border-gray-900 dark:focus:border-white focus:ring-0 outline-none transition-all font-medium ${errors.username ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'}`}
                        />
                        {errors.username && <p className="text-xs text-red-500 font-medium mt-1">{errors.username}</p>}
                    </div>

                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">密码</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="●●●●●●●●"
                                className={`w-full bg-gray-50 dark:bg-[#15143c] border rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#1a1b4b] focus:border-gray-900 dark:focus:border-white focus:ring-0 outline-none transition-all font-medium pr-12 ${errors.password ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 font-medium mt-1">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">身份</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'student', label: '学生' },
                                { value: 'teacher', label: '老师' },
                            ].map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setRole(option.value as 'student' | 'teacher')}
                                    className={`border rounded-lg py-3 px-4 text-sm font-semibold transition-colors ${role === option.value
                                        ? 'border-primary bg-indigo-50 dark:bg-indigo-500/20 text-primary dark:text-indigo-400'
                                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">管理员账号受限，默认保留为平台管理员。</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer bg-white dark:bg-white/5"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400 leading-tight cursor-pointer select-none">
                                我接受 Quizlet 的<span className="text-primary dark:text-indigo-400 font-bold">服务条款</span>和<span className="text-primary dark:text-indigo-400 font-bold">隐私政策</span>
                            </label>
                        </div>
                        {errors.terms && <p className="text-xs text-red-500 font-medium ml-8">{errors.terms}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-sm transition-all active:scale-[0.98] text-lg mt-4 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : '注册'}
                    </button>
                </form>
            </div>
        </div>
    );
};

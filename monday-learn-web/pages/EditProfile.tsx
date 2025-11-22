import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Save } from 'lucide-react';
import { api } from '../utils/api';
import { UserResponse } from '../types';

const AVATARS = [
    '/avatars/panda.png',
    '/avatars/owl.png',
    '/avatars/cat.png',
    '/avatars/shiba.png',
    '/avatars/rabbit.png',
    '/avatars/fox.png',
    '/avatars/koala.png',
    '/avatars/bear.svg',
    '/avatars/tiger.svg',
    '/avatars/pig.svg',
    '/avatars/frog.svg',
    '/avatars/chick.svg',
    '/avatars/penguin.svg',
    '/avatars/lion.svg',
    '/avatars/monkey.svg',
    '/avatars/elephant.svg',
    '/avatars/cow.svg',
    // Add more if we generate more
];

export const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserResponse | null>(null);
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const data = await api.get<UserResponse>('/auth/me');
                setUser(data);
                setUsername(data.username);
                setAvatarUrl(data.avatar_url);
            } catch (err: any) {
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const handleSave = async () => {
        if (!username.trim()) return;
        setSaving(true);
        setError('');
        try {
            await api.put('/auth/me', {
                username,
                avatar_url: avatarUrl
            });
            navigate('/profile');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="pt-20 px-4 md:px-8 md:ml-64 pb-10 min-h-screen bg-bg-gray dark:bg-[#0a092d] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="pt-20 px-4 md:px-8 md:ml-64 pb-10 min-h-screen bg-bg-gray dark:bg-[#0a092d]">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    返回个人资料
                </button>

                <div className="bg-white dark:bg-[#15143c] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-white/10">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">编辑个人资料</h1>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Avatar Section */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                                个人图片
                            </label>
                            <div className="flex flex-wrap items-center gap-6">
                                {/* Current Avatar Large */}
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 border-4 border-white dark:border-gray-800 shadow-md overflow-hidden flex items-center justify-center text-3xl">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-purple-600">{username[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                {/* Avatar Selection Grid */}
                                <div className="flex flex-wrap gap-3">
                                    {AVATARS.map((url) => (
                                        <button
                                            key={url}
                                            onClick={() => setAvatarUrl(url)}
                                            className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${avatarUrl === url
                                                ? 'border-primary ring-2 ring-primary/20 scale-110'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:scale-105'
                                                }`}
                                        >
                                            <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                    {/* Reset Button */}
                                    <button
                                        onClick={() => setAvatarUrl(null)}
                                        className={`w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all ${!avatarUrl ? 'border-primary text-primary bg-primary/5' : ''
                                            }`}
                                        title="使用文字头像"
                                    >
                                        <span className="font-bold text-sm">Aa</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    用户名
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                                    placeholder="输入用户名"
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    这是您在 Monday Learn 上的公开显示名称。
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    电子邮箱
                                </label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving || !username.trim()}
                                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        保存更改
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

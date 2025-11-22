import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, MoreVertical, Copy, LogIn } from 'lucide-react';
import { api } from '../utils/api';
import { UserRole } from '../types';

interface StudyGroup {
    id: number;
    name: string;
    description?: string;
    teacher_id: number;
    teacher_name?: string;
    join_code?: string;
    member_count: number;
    created_at: string;
}

export const Classes: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole | null>(null);

    // Join Class Modal State
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const userRole = localStorage.getItem('userRole') as UserRole;
        setRole(userRole);
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const data = await api.get<StudyGroup[]>('/classes/');
            setClasses(data);
        } catch (err) {
            console.error("Failed to fetch classes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoining(true);
        setJoinError('');

        try {
            await api.post('/classes/join', { join_code: joinCode });
            setShowJoinModal(false);
            setJoinCode('');
            fetchClasses(); // Refresh list
        } catch (err: any) {
            setJoinError(err.message || '加入班级失败，请检查班级码');
        } finally {
            setJoining(false);
        }
    };

    const copyJoinCode = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        // Could add a toast here
    };

    return (
        <div className="min-h-screen bg-bg-gray dark:bg-[#0a092d] pt-20 px-4 md:px-8 md:ml-64 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {role === 'teacher' ? '管理的班级' : '加入的班级'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {role === 'teacher' ? '管理您的班级和学生' : '查看您所在的班级'}
                        </p>
                    </div>
                </div>

                {role === 'teacher' ? (
                    <button
                        onClick={() => navigate('/create-class')}
                        className="bg-primary text-white px-4 py-2 rounded-md font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">创建班级</span>
                    </button>
                ) : (
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="bg-white dark:bg-transparent text-primary border-2 border-primary px-4 py-2 rounded-md font-bold hover:bg-indigo-50 dark:hover:bg-primary/10 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <LogIn className="w-5 h-5" />
                        <span className="hidden sm:inline">加入班级</span>
                    </button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => (
                        <div
                            key={cls.id}
                            className="bg-white dark:bg-[#15143c] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col h-48 justify-between relative overflow-hidden"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-white/10 transition-colors"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-primary font-bold text-lg">
                                        {cls.name.charAt(0)}
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 mb-1">{cls.name}</h3>
                                {role === 'student' && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">教师: {cls.teacher_name}</p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 h-8">{cls.description || "无描述"}</p>
                            </div>

                            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <Users className="w-4 h-4" />
                                    {cls.member_count} 名学生
                                </div>

                                {role === 'teacher' && cls.join_code && (
                                    <div
                                        className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-xs font-mono text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                        onClick={(e) => copyJoinCode(e, cls.join_code!)}
                                        title="点击复制班级码"
                                    >
                                        {cls.join_code}
                                        <Copy className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-[#15143c] rounded-xl border border-dashed border-gray-300 dark:border-white/10">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {role === 'teacher' ? '还没有创建班级' : '还没有加入班级'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {role === 'teacher' ? '创建一个班级来开始管理学生' : '输入班级码加入老师的班级'}
                    </p>
                    <button
                        onClick={() => role === 'teacher' ? navigate('/create-class') : setShowJoinModal(true)}
                        className="text-primary font-bold hover:underline"
                    >
                        {role === 'teacher' ? '创建班级' : '加入班级'}
                    </button>
                </div>
            )}

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#15143c] rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">加入班级</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">请输入老师提供的6位班级邀请码</p>

                        <form onSubmit={handleJoinClass}>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="例如：X7Y9Z2"
                                className="w-full p-4 text-center text-2xl font-mono tracking-widest bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-lg focus:border-primary focus:bg-white dark:focus:bg-black/40 outline-none transition-all mb-4 uppercase"
                                maxLength={6}
                                autoFocus
                            />

                            {joinError && (
                                <p className="text-red-500 text-sm font-medium mb-4 text-center">{joinError}</p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 py-3 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={!joinCode || joining}
                                    className="flex-1 py-3 font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {joining ? '加入中...' : '加入'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

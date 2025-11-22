import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { api } from '../utils/api';

export const CreateClass: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await api.post('/classes/', {
                name,
                description
            });
            navigate('/classes');
        } catch (err) {
            console.error("Failed to create class", err);
            alert("创建班级失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-gray dark:bg-[#0a092d] pt-20 px-4 md:px-8 md:ml-64 pb-20">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 text-sm font-bold mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> 返回
                </button>

                <div className="bg-white dark:bg-[#15143c] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">创建新班级</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">创建一个班级来管理学生和分配学习任务</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">班级名称</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例如：2024秋季英语一班"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-medium text-gray-900 dark:text-white"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">描述（可选）</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="输入班级描述..."
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary focus:bg-white dark:focus:bg-gray-800 outline-none transition-all min-h-[100px] resize-none text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={!name.trim() || loading}
                                className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {loading ? '创建中...' : '创建班级'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

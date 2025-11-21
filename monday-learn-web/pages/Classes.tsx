import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, MoreVertical } from 'lucide-react';
import { api } from '../utils/api';

interface StudyGroup {
    id: number;
    name: string;
    description?: string;
    teacher_id: number;
    created_at: string;
}

export const Classes: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchClasses();
    }, []);

    return (
        <div className="min-h-screen bg-bg-gray pt-20 px-4 md:px-8 md:ml-64 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">您的班级</h1>
                </div>
                <button
                    onClick={() => navigate('/create-class')}
                    className="bg-primary text-white px-4 py-2 rounded-md font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">创建班级</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => (
                        <div
                            key={cls.id}
                            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col h-40 justify-between relative overflow-hidden"
                        >
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-gray-50 rounded-full group-hover:bg-indigo-50 transition-colors"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                    <Users className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{cls.name}</h3>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cls.description || "无描述"}</p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-gray-600">
                                <div className="bg-gray-100 px-2 py-1 rounded group-hover:bg-white group-hover:shadow-sm transition-all">
                                    0 名学生
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">还没有班级</h3>
                    <p className="text-gray-500 mb-6">创建一个班级来开始管理学生</p>
                    <button
                        onClick={() => navigate('/create-class')}
                        className="text-primary font-bold hover:underline"
                    >
                        创建班级
                    </button>
                </div>
            )}
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../utils/api';
import { UserResponse } from '../types';
import { useNavigate } from 'react-router-dom';

interface PermissionToggle {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
}

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState<PermissionToggle[]>([
        { key: 'create_sets', label: '创建学习集', description: '允许用户创建新的学习集', enabled: true },
        { key: 'share_public', label: '公开分享', description: '允许用户将学习集设为公开', enabled: true },
        { key: 'ai_tools', label: 'AI 功能', description: '允许使用 AI 辅助功能', enabled: true },
        { key: 'upload_materials', label: '上传资料', description: '允许上传课堂资料文件', enabled: true },
    ]);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const data = await api.get<UserResponse>('/auth/me');
                setUser(data);
            } catch (err) {
                console.error('Failed to load admin profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const togglePermission = (key: string) => {
        setPermissions((prev) =>
            prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item))
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-gray pt-24 md:ml-64 px-4 md:px-8 flex items-center justify-center text-gray-500">
                正在加载...
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-bg-gray pt-24 md:ml-64 px-4 md:px-8 flex flex-col items-center justify-center text-center text-gray-600">
                <ShieldCheck className="w-12 h-12 text-red-400 mb-4" />
                <p className="font-bold text-lg mb-2">无权限访问</p>
                <p className="text-sm text-gray-500 mb-6">仅管理员可查看此页面。</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                    返回首页
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-gray pt-24 md:ml-64 px-4 md:px-8 pb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">管理中心</h1>
                        <p className="text-sm text-gray-500">配置平台的功能与权限</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-800">功能权限</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {permissions.map((perm) => (
                        <div key={perm.key} className="py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{perm.label}</p>
                                <p className="text-xs text-gray-500">{perm.description}</p>
                            </div>
                            <button
                                onClick={() => togglePermission(perm.key)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
                            >
                                {perm.enabled ? (
                                    <>
                                        <ToggleRight className="w-6 h-6 text-primary" />
                                        开启
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                                        关闭
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500">当前为演示配置，保存后可接入后端权限控制。</p>
            </div>
        </div>
    );
};

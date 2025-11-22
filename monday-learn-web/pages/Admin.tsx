import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, ToggleLeft, ToggleRight, Bot, Plus, Trash2, Edit2, Check, X, Key, Server, Cpu } from 'lucide-react';
import { api } from '../utils/api';
import { UserResponse, AIConfig, AIUsageLog } from '../types';
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

    // AI Config State
    const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
    const [showAiModal, setShowAiModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        provider: 'openai',
        api_key: '',
        base_url: '',
        model_name: '',
    });
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; latency?: string; message?: string } | null>(null);

    const [showLogsModal, setShowLogsModal] = useState(false);
    const [logs, setLogs] = useState<AIUsageLog[]>([]);
    const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);

    const handleViewLogs = async (configId: number) => {
        setCurrentConfigId(configId);
        setShowLogsModal(true);
        try {
            const data = await api.get<AIUsageLog[]>(`/admin/ai-configs/${configId}/logs`);
            setLogs(data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
            alert('获取日志失败');
        }
    };

    const handleTestConnection = async () => {
        if (!formData.api_key || !formData.model_name) {
            alert('请先填写 API Key 和模型名称');
            return;
        }
        const payload = {
            ...formData,
            config_id: editingConfig?.id, // ensure backend attributes tokens to the exact config
        };
        setTestingConnection(true);
        setTestResult(null);
        try {
            const res = await api.post<any>('/admin/ai-configs/test', payload);
            if (res.status === 'success') {
                setTestResult({ status: 'success', latency: res.latency });
                // Refresh configs to update token count if we tested an existing one (though we don't know ID here easily without more logic, 
                // but if we are editing, we might want to refresh. For now, let's just leave it.)
                // Actually, if we just added tokens, we should refresh the list to see the new count.
                fetchAiConfigs();
            } else {
                setTestResult({ status: 'error', message: res.message });
                alert(`连接失败: ${res.message}\n${res.details || ''}`);
            }
        } catch (err: any) {
            console.error('Test failed', err);
            setTestResult({ status: 'error', message: err.message });
            alert('连接测试失败，请检查网络或配置');
        } finally {
            setTestingConnection(false);
        }
    };

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const data = await api.get<UserResponse>('/auth/me');
                setUser(data);
                if (data.role === 'admin') {
                    fetchAiConfigs();
                }
            } catch (err) {
                console.error('Failed to load admin profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const fetchAiConfigs = async () => {
        try {
            const data = await api.get<AIConfig[]>('/admin/ai-configs');
            setAiConfigs(data);
        } catch (err) {
            console.error('Failed to fetch AI configs', err);
        }
    };

    const togglePermission = (key: string) => {
        setPermissions((prev) =>
            prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item))
        );
    };

    const handleEnableAiConfig = async (id: number) => {
        try {
            await api.post(`/admin/ai-configs/${id}/enable`, {});
            fetchAiConfigs();
        } catch (err) {
            console.error('Failed to enable config', err);
            alert('启用失败');
        }
    };

    const handleDeleteAiConfig = async (id: number) => {
        if (!confirm('确定要删除这个配置吗？')) return;
        try {
            await api.delete(`/admin/ai-configs/${id}`);
            fetchAiConfigs();
        } catch (err) {
            console.error('Failed to delete config', err);
            alert('删除失败');
        }
    };

    const handleSaveAiConfig = async () => {
        try {
            if (editingConfig) {
                await api.put(`/admin/ai-configs/${editingConfig.id}`, formData);
            } else {
                await api.post('/admin/ai-configs', formData);
            }
            setShowAiModal(false);
            setEditingConfig(null);
            setFormData({
                name: '',
                provider: 'openai',
                api_key: '',
                base_url: '',
                model_name: '',
            });
            fetchAiConfigs();
        } catch (err) {
            console.error('Failed to save config', err);
            alert('保存失败');
        }
    };

    const openEditModal = (config: AIConfig) => {
        setEditingConfig(config);
        setFormData({
            name: config.name,
            provider: config.provider,
            api_key: config.api_key,
            base_url: config.base_url || '',
            model_name: config.model_name,
        });
        setShowAiModal(true);
    };

    const openCreateModal = () => {
        setEditingConfig(null);
        setFormData({
            name: '',
            provider: 'openai',
            api_key: '',
            base_url: '',
            model_name: '',
        });
        setShowAiModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-blue pt-24 md:ml-64 px-4 md:px-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                正在加载...
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-blue pt-24 md:ml-64 px-4 md:px-8 flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-300">
                <ShieldCheck className="w-12 h-12 text-red-400 mb-4" />
                <p className="font-bold text-lg mb-2">无权限访问</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">仅管理员可查看此页面。</p>
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-blue pt-24 md:ml-64 px-4 md:px-8 pb-12 transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理中心</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">配置平台的功能与权限</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* AI Configuration Section */}
                <div className="bg-white dark:bg-[#15143c] border border-gray-100 dark:border-white/10 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">AI 模型配置</h2>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            添加模型
                        </button>
                    </div>

                    <div className="space-y-4">
                        {aiConfigs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-white/10">
                                暂无 AI 模型配置，请添加一个。
                            </div>
                        ) : (
                            aiConfigs.map((config) => (
                                <div key={config.id} className={`p-4 rounded-lg border transition-all ${config.is_active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white">{config.name}</h3>
                                                {config.is_active && (
                                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full">
                                                        使用中
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {config.provider}</span>
                                                <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {config.model_name}</span>
                                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                                    Tokens: {config.total_tokens.toLocaleString()}
                                                </span>
                                                {config.base_url && <span className="truncate max-w-[200px]">{config.base_url}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewLogs(config.id)}
                                                className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors"
                                            >
                                                日志
                                            </button>
                                            {!config.is_active && (
                                                <button
                                                    onClick={() => handleEnableAiConfig(config.id)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-full transition-colors"
                                                    title="启用此模型"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(config)}
                                                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAiConfig(config.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-full transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Permissions Section */}
                <div className="bg-white dark:bg-[#15143c] border border-gray-100 dark:border-white/10 rounded-xl shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">功能权限</h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/10">
                        {permissions.map((perm) => (
                            <div key={perm.key} className="py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{perm.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{perm.description}</p>
                                </div>
                                <button
                                    onClick={() => togglePermission(perm.key)}
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-indigo-400 transition-colors"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">当前为演示配置，保存后可接入后端权限控制。</p>
                </div>
            </div>

            {/* AI Config Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-[#15143c] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white">{editingConfig ? '编辑模型配置' : '添加模型配置'}</h3>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Curl Parser Section */}
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 mb-4">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    快速导入 (粘贴 cURL 命令自动解析)
                                </label>
                                <div className="flex gap-2">
                                    <textarea
                                        placeholder="curl https://api.example.com/v1/chat/completions -H 'Authorization: Bearer sk-...' -d '{...}'"
                                        className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-16 resize-none font-mono bg-white dark:bg-[#1a1b4b] text-gray-900 dark:text-white"
                                        onChange={(e) => {
                                            const curl = e.target.value;
                                            if (!curl) return;

                                            // Parse API Key
                                            const keyMatch = curl.match(/Authorization:\s*Bearer\s+([a-zA-Z0-9\-\._]+)/i);
                                            const apiKey = keyMatch ? keyMatch[1] : '';

                                            // Parse URL
                                            const urlMatch = curl.match(/curl\s+(?:-X\s+POST\s+)?['"]?(https?:\/\/[^\s'"]+)['"]?/i);
                                            let baseUrl = '';
                                            if (urlMatch) {
                                                let fullUrl = urlMatch[1];
                                                // Remove /chat/completions if present
                                                if (fullUrl.endsWith('/chat/completions')) {
                                                    baseUrl = fullUrl.replace('/chat/completions', '');
                                                } else {
                                                    baseUrl = fullUrl;
                                                }
                                            }

                                            // Parse Model
                                            const modelMatch = curl.match(/"model":\s*"([^"]+)"/);
                                            const modelName = modelMatch ? modelMatch[1] : '';

                                            // Detect Provider
                                            let provider = formData.provider;
                                            if (baseUrl.includes('volces.com')) provider = 'volcengine';
                                            else if (baseUrl.includes('openai.com')) provider = 'openai';
                                            else if (baseUrl.includes('anthropic.com')) provider = 'anthropic';
                                            else if (baseUrl.includes('deepseek')) provider = 'deepseek';
                                            else if (baseUrl.includes('moonshot')) provider = 'moonshot';
                                            else if (baseUrl.includes('dashscope')) provider = 'qwen'; // Alibaba
                                            else if (baseUrl.includes('01.ai')) provider = 'yi'; // Yi
                                            else if (baseUrl.includes('zhipu')) provider = 'zhipu'; // Zhipu

                                            if (apiKey || baseUrl || modelName) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    api_key: apiKey || prev.api_key,
                                                    base_url: baseUrl || prev.base_url,
                                                    model_name: modelName || prev.model_name,
                                                    provider: provider
                                                }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">配置名称</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="例如：GPT-4 Turbo"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#1a1b4b] text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">提供商</label>
                                <select
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#1a1b4b] text-gray-900 dark:text-white"
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="google">Google Gemini</option>
                                    <option value="anthropic">Anthropic Claude</option>
                                    <option value="deepseek">DeepSeek (深度求索)</option>
                                    <option value="qwen">Qwen (通义千问)</option>
                                    <option value="yi">Yi (零一万物)</option>
                                    <option value="moonshot">Moonshot (月之暗面)</option>
                                    <option value="zhipu">Zhipu AI (智谱)</option>
                                    <option value="volcengine">Volcengine (火山引擎)</option>
                                    <option value="custom">Custom / Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">模型名称 (Model ID)</label>
                                <input
                                    type="text"
                                    value={formData.model_name}
                                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                                    placeholder="例如：gpt-4-turbo-preview"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#1a1b4b] text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={formData.api_key}
                                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                        placeholder="sk-..."
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#1a1b4b] text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base URL (可选)</label>
                                <input
                                    type="text"
                                    value={formData.base_url}
                                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-[#1a1b4b] text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={testingConnection}
                                    className={`px-4 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2 ${testingConnection ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {testingConnection ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            测试中...
                                        </>
                                    ) : (
                                        <>
                                            <Server className="w-4 h-4" />
                                            测试连接
                                        </>
                                    )}
                                </button>
                                {testResult && (
                                    <span className={`text-xs font-medium ${testResult.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {testResult.status === 'success' ? `连接成功 (${testResult.latency})` : '连接失败'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveAiConfig}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-[#15143c] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white">使用日志</h3>
                            <button onClick={() => setShowLogsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {logs.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">暂无使用记录</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3">时间</th>
                                            <th className="px-4 py-3">功能</th>
                                            <th className="px-4 py-3">用户</th>
                                            <th className="px-4 py-3">类型</th>
                                            <th className="px-4 py-3 text-right">消耗 Tokens</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                                                    {log.feature || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {log.user_email || `User #${log.user_id}`}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.request_type === 'test'
                                                        ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                                        : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                                        }`}>
                                                        {log.request_type === 'test' ? '测试' : '生成'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    {log.tokens_used.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end">
                            <button
                                onClick={() => setShowLogsModal(false)}
                                className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

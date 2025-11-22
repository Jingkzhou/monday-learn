
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, StudySet } from '../types';
import { MOCK_FOLDERS, RECENT_SETS } from '../constants';
import { api } from '../utils/api';
import {
    Folder as FolderIcon,
    Plus,
    MoreVertical,
    Search,
    User,
    ArrowLeft,
    Copy,
    Trash2,
    FolderPlus,
    X
} from 'lucide-react';

export const Folders: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddSetModal, setShowAddSetModal] = useState(false);

    // Form Inputs
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [newFolderDesc, setNewFolderDesc] = useState('');

    // Fetch Folders
    const fetchFolders = async () => {
        setLoading(true);
        try {
            const data = await api.get<Folder[]>('/folders/');
            setFolders(data);
        } catch (err) {
            console.error("Failed to fetch folders", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Single Folder (to refresh details)
    const fetchFolderDetails = async (folderId: number) => {
        try {
            const data = await api.get<Folder>(`/folders/${folderId}`);
            setCurrentFolder(data);
            // Update list as well
            setFolders(prev => prev.map(f => f.id === folderId ? data : f));
        } catch (err) {
            console.error("Failed to fetch folder details", err);
        }
    };

    React.useEffect(() => {
        fetchFolders();
    }, []);

    // Handlers
    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderTitle.trim()) return;

        try {
            const newFolder = await api.post<Folder>('/folders/', {
                title: newFolderTitle,
                description: newFolderDesc
            });
            setFolders([newFolder, ...folders]);
            setShowCreateModal(false);
            setNewFolderTitle('');
            setNewFolderDesc('');
            setCurrentFolder(newFolder);
        } catch (err) {
            console.error("Failed to create folder", err);
            alert("创建文件夹失败");
        }
    };

    const handleAddSetToFolder = async (setId: number | string) => {
        if (!currentFolder) return;

        // Check if already in folder (client-side check for UI toggle)
        const isAdded = currentFolder.study_sets.some(s => s.id === Number(setId));

        try {
            if (isAdded) {
                await api.delete(`/folders/${currentFolder.id}/sets/${setId}`);
            } else {
                await api.post(`/folders/${currentFolder.id}/sets/${setId}`, {});
            }
            // Refresh folder details
            await fetchFolderDetails(currentFolder.id);
        } catch (err) {
            console.error("Failed to update folder sets", err);
        }
    };

    const handleDeleteFolder = async () => {
        if (!currentFolder) return;
        if (confirm('确定要删除这个文件夹吗？包含的学习集不会被删除。')) {
            try {
                await api.delete(`/folders/${currentFolder.id}`);
                setFolders(prev => prev.filter(f => f.id !== currentFolder.id));
                setCurrentFolder(null);
            } catch (err) {
                console.error("Failed to delete folder", err);
                alert("删除失败");
            }
        }
    };

    // Fetch Sets for Modal
    const [availableSets, setAvailableSets] = useState<StudySet[]>([]);

    const fetchAvailableSets = async () => {
        try {
            const data = await api.get<StudySet[]>('/study-sets/');
            setAvailableSets(data);
        } catch (err) {
            console.error("Failed to fetch study sets", err);
        }
    };

    useEffect(() => {
        if (showAddSetModal) {
            fetchAvailableSets();
        }
    }, [showAddSetModal]);

    // --- RENDER: Detail View ---
    if (currentFolder) {
        return (
            <div className="min-h-screen bg-bg-gray dark:bg-dark-blue pt-20 px-4 md:px-8 md:ml-64 pb-20 transition-colors duration-200">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => setCurrentFolder(null)}
                        className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> 所有文件夹
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                <FolderIcon className="w-4 h-4" />
                                {currentFolder.set_count} 个学习集 • {currentFolder.study_sets.reduce((acc, set) => acc + (set.term_count || 0), 0)} 个词语
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{currentFolder.title}</h1>
                            <p className="text-gray-600 dark:text-gray-300">{currentFolder.description}</p>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="w-6 h-6 bg-purple-500 rounded-full text-white flex items-center justify-center text-xs font-bold">
                                    {currentFolder.author_username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{currentFolder.author_username}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddSetModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md font-bold shadow-sm hover:bg-primary-dark transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                添加学习集
                            </button>
                            <button
                                onClick={handleDeleteFolder}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="删除文件夹"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sets Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {currentFolder.study_sets.length > 0 ? (
                        currentFolder.study_sets.map(set => (
                            <div
                                key={set.id}
                                onClick={() => navigate(`/set/${set.id}`)}
                                className="bg-white dark:bg-[#15143c] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Copy className="w-6 h-6 transform rotate-90" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors">{set.title}</h3>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{set.term_count} 个词语 • {set.author_username}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddSetToFolder(set.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        title="从文件夹移除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-[#15143c] rounded-xl border border-dashed border-gray-300 dark:border-white/10">
                            <FolderIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">这个文件夹是空的</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">添加学习集来整理您的内容</p>
                            <button
                                onClick={() => setShowAddSetModal(true)}
                                className="text-primary font-bold hover:underline"
                            >
                                添加学习集
                            </button>
                        </div>
                    )}
                </div>

                {/* Add Set Modal */}
                {showAddSetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a1b4b] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white">添加到文件夹</h3>
                                <button onClick={() => setShowAddSetModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
                            </div>
                            <div className="p-4 border-b border-gray-100 dark:border-white/10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="搜索您的学习集" className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {availableSets.map(set => {
                                    const isAdded = currentFolder.study_sets.some(s => s.id === Number(set.id));
                                    return (
                                        <div
                                            key={set.id}
                                            onClick={() => handleAddSetToFolder(set.id)}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded flex items-center justify-center text-gray-400 dark:text-gray-500">
                                                    <Copy className="w-5 h-5 transform rotate-90" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-gray-800 dark:text-white">{set.title}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{set.termCount || set.term_count} 个词语</span>
                                                </div>
                                            </div>
                                            <button
                                                className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isAdded ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-white/20 group-hover:border-primary'}`}
                                            >
                                                {isAdded && <Plus className="w-4 h-4 transform rotate-45" />}
                                                {!isAdded && <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                            <button onClick={() => setShowAddSetModal(false)} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark">
                                完成
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: List View ---
    return (
        <div className="min-h-screen bg-bg-gray dark:bg-dark-blue pt-20 px-4 md:px-8 md:ml-64 pb-20 transition-colors duration-200">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center text-primary dark:text-indigo-400">
                        <FolderIcon className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">您的文件夹</h1>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-md font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">创建文件夹</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            onClick={() => setCurrentFolder(folder)}
                            className="bg-white dark:bg-[#15143c] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col h-40 justify-between relative overflow-hidden"
                        >
                            {/* Decor */}
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                    <FolderIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-primary transition-colors" />
                                    {/* <MoreVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" /> */}
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{folder.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{folder.description || "无描述"}</p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                                <div className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded group-hover:bg-white dark:group-hover:bg-white/20 group-hover:shadow-sm transition-all">
                                    {folder.set_count} 个学习集 • {folder.study_sets.reduce((acc, set) => acc + (set.term_count || 0), 0)} 个词语
                                </div>
                                <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" /> {folder.author_username}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Create New Placeholder Card */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary hover:border-primary dark:hover:border-primary hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 transition-all h-40"
                    >
                        <FolderPlus className="w-8 h-8 mb-2" />
                        <span className="font-bold">新建文件夹</span>
                    </button>
                </div>
            )}

            {/* Create Folder Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
                    <form onSubmit={handleCreateFolder} className="bg-white dark:bg-[#1a1b4b] w-full max-w-md rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">创建新文件夹</h2>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">标题</label>
                                <input
                                    type="text"
                                    value={newFolderTitle}
                                    onChange={(e) => setNewFolderTitle(e.target.value)}
                                    placeholder="输入文件夹标题"
                                    className="w-full p-2 border-b-2 border-gray-200 dark:border-white/10 bg-transparent focus:border-primary outline-none text-lg font-medium transition-colors dark:text-white"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">描述（可选）</label>
                                <input
                                    type="text"
                                    value={newFolderDesc}
                                    onChange={(e) => setNewFolderDesc(e.target.value)}
                                    placeholder="输入描述..."
                                    className="w-full p-2 border-b-2 border-gray-200 dark:border-white/10 bg-transparent focus:border-primary outline-none transition-colors dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!newFolderTitle.trim()}
                            >
                                创建文件夹
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

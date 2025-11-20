import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, FileText, FileSpreadsheet, Trash2, Download, Loader2, AlertCircle, HardDrive } from 'lucide-react';
import { api } from '../utils/api';

interface Material {
    id: number;
    filename: string;
    file_type: string;
    file_size: number;
    upload_date: string;
    user_id: number;
}

export const Library: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const data = await api.get<Material[]>('/materials/');
            setMaterials(data);
        } catch (err: any) {
            setError(err.message || '无法加载资料库');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // We need to use a raw fetch or modify api utility to handle FormData if it doesn't already.
            // Assuming api.post handles JSON by default, we might need a specific way to send FormData.
            // Let's check api.ts later, but for now I'll try to use the token from localStorage manually if needed,
            // or assume api utility can handle it if I pass the right headers (or let browser set them).
            // Actually, standard fetch with FormData sets Content-Type to multipart/form-data automatically with boundary.
            // If api wrapper forces Content-Type: application/json, it will fail.
            // I will implement a direct fetch here for safety or check api.ts. 
            // Given I can't check api.ts right now easily without interrupting, I will use the api utility but I suspect I might need to adjust it.
            // Let's try to use the api utility but pass a flag or just use raw fetch for upload.

            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/materials/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const newMaterial = await response.json();
            setMaterials([newMaterial, ...materials]);
        } catch (err: any) {
            setError('上传失败，请重试');
            console.error(err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleUpload(e.dataTransfer.files[0]);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
        if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-8 h-8 text-blue-500" />;
        if (['xls', 'xlsx'].includes(ext || '')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
        if (['txt', 'md'].includes(ext || '')) return <FileText className="w-8 h-8 text-gray-500" />;
        return <File className="w-8 h-8 text-indigo-500" />;
    };

    const handlePreview = (file: Material) => {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/materials/${file.id}/file?token=${token}`;
        // Since we can't easily pass headers in a new tab open, we might need a way to auth via query param or cookie.
        // For now, let's assume the browser session or a query param token (if backend supported it) would work.
        // But wait, my backend expects Bearer token in header.
        // Opening in new tab directly won't send the header.
        // I'll implement a fetch-and-blob approach for preview if possible, or just open it and hope for the best (it will fail 401).
        // Actually, for a simple "preview", if it's a PDF, we can fetch it as blob, create object URL, and open that.

        handleDownload(file, true);
    };

    const handleDownload = async (file: Material, preview = false) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/materials/${file.id}/file`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            if (!preview) {
                a.download = file.filename;
            } else {
                a.target = '_blank';
            }
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            setError('下载失败');
        }
    };

    const handleDelete = async (file: Material) => {
        if (!confirm(`确定要删除 ${file.filename} 吗？`)) return;

        try {
            await api.delete(`/materials/${file.id}`);
            setMaterials(materials.filter(m => m.id !== file.id));
        } catch (err: any) {
            console.error('Delete error:', err);
            setError('删除失败');
        }
    };

    return (
        <div className="min-h-screen bg-bg-gray pt-20 px-4 md:px-8 md:ml-64 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <HardDrive className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">我的资料库</h1>
                </div>
            </div>

            {/* Upload Area */}
            <div
                className={`bg-white border-2 border-dashed rounded-2xl p-10 mb-8 text-center transition-colors ${uploading ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        <p className="text-indigo-600 font-medium">正在上传文件...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                            <Upload className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">点击或拖拽上传文件</h3>
                        <p className="text-gray-500 text-sm">支持 PDF, Word, Excel, TXT 等格式</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* File List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">已上传文件 ({materials.length})</h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        加载中...
                    </div>
                ) : materials.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {materials.map((file) => (
                            <div key={file.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                                        {getFileIcon(file.filename)}
                                    </div>
                                    <div>
                                        <h4
                                            className="font-bold text-gray-900 mb-1 cursor-pointer hover:text-indigo-600 hover:underline"
                                            onClick={() => handlePreview(file)}
                                        >
                                            {file.filename}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>{formatSize(file.file_size)}</span>
                                            <span>•</span>
                                            <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                        title="下载"
                                        onClick={() => handleDownload(file)}
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="删除"
                                        onClick={() => handleDelete(file)}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <File className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>暂无文件，快去上传吧</p>
                    </div>
                )}
            </div>
        </div>
    );
};

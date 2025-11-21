import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { StudySet, Term, Folder } from '../types';
import { ArrowLeft, CheckCircle2, Plus, Merge, Filter, Folder as FolderIcon, Star } from 'lucide-react';

export const MergeSets: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // The ID of the set we started from
    const [studySets, setStudySets] = useState<StudySet[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedSetIds, setSelectedSetIds] = useState<Set<number>>(new Set(id ? [parseInt(id)] : []));
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<number>>(new Set());
    const [mergeStarredOnly, setMergeStarredOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [setsData, foldersData] = await Promise.all([
                api.get<StudySet[]>('/study-sets?limit=100'),
                api.get<Folder[]>('/folders')
            ]);
            setStudySets(setsData);
            setFolders(foldersData);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (setId: number) => {
        const newSelection = new Set(selectedSetIds);
        if (newSelection.has(setId)) {
            newSelection.delete(setId);
        } else {
            newSelection.add(setId);
        }
        setSelectedSetIds(newSelection);
    };

    const toggleFolderSelection = (folderId: number) => {
        const newSelection = new Set(selectedFolderIds);
        if (newSelection.has(folderId)) {
            newSelection.delete(folderId);
        } else {
            newSelection.add(folderId);
        }
        setSelectedFolderIds(newSelection);
    };

    const filteredSets = useMemo(() => {
        let sets = studySets;

        if (selectedFolderIds.size > 0) {
            // Get all set IDs that belong to the selected folders
            const setsInFolders = new Set<number>();
            folders.forEach(folder => {
                if (selectedFolderIds.has(folder.id)) {
                    folder.study_sets.forEach(set => setsInFolders.add(set.id));
                }
            });
            sets = sets.filter(set => setsInFolders.has(Number(set.id)));
        }

        // Calculate starred counts and attach to set objects for easier access in render
        return sets.map(set => ({
            ...set,
            starredCount: (set.terms || []).filter(t => t.starred).length
        }));
    }, [studySets, folders, selectedFolderIds]);

    const handleMerge = async () => {
        if (selectedSetIds.size < 2) return;
        setMerging(true);

        try {
            // Fetch details for all selected sets to get their terms
            const promises = Array.from(selectedSetIds).map(setId =>
                api.get<any>(`/study-sets/${setId}`)
            );

            const results = await Promise.all(promises);

            let combinedTerms: Term[] = [];
            let combinedTitle = "合并: ";
            const seenTerms = new Set<string>();

            results.forEach((set, index) => {
                if (index > 0) combinedTitle += " + ";
                combinedTitle += set.title;

                let setTerms = set.terms || [];

                // Filter for starred terms if enabled
                if (mergeStarredOnly) {
                    setTerms = setTerms.filter((t: any) => t.starred);
                }

                setTerms.forEach((t: any) => {
                    // Create a unique key for the term based on content
                    // Normalize by trimming and converting to lowercase for better matching? 
                    // User said "completely repeat", usually means exact match. 
                    // Let's stick to exact match of trimmed content.
                    const uniqueKey = `${t.term.trim()}|${t.definition.trim()}`;

                    if (!seenTerms.has(uniqueKey)) {
                        seenTerms.add(uniqueKey);
                        combinedTerms.push({
                            id: `merged-${set.id}-${t.id}`,
                            term: t.term,
                            definition: t.definition,
                            imageUrl: t.image_url,
                            status: 'not_started',
                            order: 0, // Will be re-indexed in EditSet
                            starred: t.starred
                        });
                    }
                });
            });

            if (combinedTerms.length === 0) {
                alert('选中的学习集中没有符合条件的术语（可能是因为开启了“仅合并星标词卡”但没有星标词卡）。');
                setMerging(false);
                return;
            }

            // Navigate to Create page with initial state
            navigate('/create', {
                state: {
                    initialTitle: combinedTitle.substring(0, 100), // Limit title length
                    initialDescription: `包含来自 ${results.length} 个学习集的${combinedTerms.length}个术语${mergeStarredOnly ? ' (仅星标)' : ''}`,
                    initialTerms: combinedTerms
                }
            });

        } catch (err) {
            console.error('Failed to merge sets', err);
            alert('合并失败，请重试');
        } finally {
            setMerging(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">加载中...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
                    <button onClick={() => id ? navigate(`/set/${id}`) : navigate(-1)} className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">合并学习集</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Description */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-800 text-sm">
                    选择多个学习集，将它们的术语合并到一个新的学习集中。
                </div>

                {/* Filters Section */}
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2 px-1">
                        <Filter className="w-3 h-3" />
                        筛选
                    </h2>

                    {/* Folder Filter */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {folders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => toggleFolderSelection(folder.id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${selectedFolderIds.has(folder.id)
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FolderIcon className={`w-3.5 h-3.5 ${selectedFolderIds.has(folder.id) ? 'text-white' : 'text-gray-400'}`} />
                                {folder.title}
                            </button>
                        ))}
                        {folders.length === 0 && (
                            <span className="text-sm text-gray-400 italic px-1">暂无文件夹</span>
                        )}
                    </div>

                    {/* Starred Only Toggle */}
                    <div
                        onClick={() => {
                            const newValue = !mergeStarredOnly;
                            setMergeStarredOnly(newValue);
                            if (newValue) {
                                const newSelection = new Set<number>();
                                selectedSetIds.forEach(id => {
                                    const set = studySets.find(s => s.id === id);
                                    const starredCount = (set?.terms || []).filter(t => t.starred).length;
                                    if (starredCount > 0) {
                                        newSelection.add(id);
                                    }
                                });
                                setSelectedSetIds(newSelection);
                            }
                        }}
                        className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${mergeStarredOnly ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                <Star className={`w-5 h-5 ${mergeStarredOnly ? 'fill-current' : ''}`} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">仅合并星标词卡</h3>
                                <p className="text-xs text-gray-500">只包含选定学习集中的星标术语</p>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors relative ${mergeStarredOnly ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${mergeStarredOnly ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
                                }`} />
                        </div>
                    </div>
                </div>

                {/* Study Sets List */}
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">
                        选择学习集 ({selectedSetIds.size})
                    </h2>
                    <div className="space-y-3">
                        {filteredSets.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                                没有找到符合条件的学习集
                            </div>
                        ) : (
                            filteredSets.map((set: any) => {
                                const isDisabled = mergeStarredOnly && set.starredCount === 0;
                                const displayCount = mergeStarredOnly ? set.starredCount : (set.termCount || set.term_count || 0);
                                const isSelected = selectedSetIds.has(Number(set.id));

                                return (
                                    <div
                                        key={set.id}
                                        onClick={() => !isDisabled && toggleSelection(Number(set.id))}
                                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${isDisabled
                                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                            : isSelected
                                                ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm cursor-pointer'
                                            }`}
                                    >
                                        <div>
                                            <h3 className={`font-bold mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{set.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {displayCount} 词
                                                </span>
                                                <span>•</span>
                                                <span>{set.authorUsername || set.author_username}</span>
                                            </div>
                                        </div>

                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isDisabled
                                            ? 'border-gray-200 bg-gray-100'
                                            : isSelected
                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                : 'border-gray-300 group-hover:border-indigo-400'
                                            }`}>
                                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 pb-safe">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div className="text-sm text-gray-500 hidden sm:block">
                        已选择 <span className="font-bold text-gray-900">{selectedSetIds.size}</span> 个学习集
                    </div>
                    <div className="flex items-center gap-3 flex-1 sm:flex-none justify-end w-full sm:w-auto">
                        <button
                            onClick={() => id ? navigate(`/set/${id}`) : navigate(-1)}
                            className="px-6 h-12 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleMerge}
                            disabled={selectedSetIds.size < 2 || merging}
                            className="flex-1 sm:flex-none sm:w-48 bg-indigo-600 text-white h-12 rounded-full font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                        >
                            {merging ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>处理中...</span>
                                </>
                            ) : (
                                <>
                                    <Merge className="w-5 h-5" />
                                    <span>开始合并</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

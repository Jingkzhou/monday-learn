import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Layers, Lock, User, Calendar } from 'lucide-react';
import { StudySet } from '../types';
import { api } from '../utils/api';
import { format, isToday, isThisWeek, isThisMonth, isSameYear, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const WordCards: React.FC = () => {
    const navigate = useNavigate();
    const [sets, setSets] = useState<StudySet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLibrary = async () => {
            setLoading(true);
            try {
                const data = await api.get<StudySet[]>('/study-sets/library');
                setSets(data);
            } catch (err: any) {
                setError(err.message || '加载单词卡失败');
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, []);

    // Group sets by date
    const groupedSets = sets.reduce((groups, set) => {
        // Use last_reviewed if available, otherwise updated_at or created_at
        const dateStr = set.last_reviewed || set.updated_at || set.createdAt;
        if (!dateStr) return groups;

        const date = new Date(dateStr);
        let groupKey = '';

        if (isToday(date)) {
            groupKey = '今天';
        } else if (isThisWeek(date, { weekStartsOn: 1 })) {
            groupKey = '本周';
        } else if (isThisMonth(date)) {
            groupKey = '本月';
        } else if (isSameYear(date, new Date())) {
            groupKey = format(date, 'M月', { locale: zhCN });
        } else {
            groupKey = format(date, 'yyyy年 M月', { locale: zhCN });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(set);
        return groups;
    }, {} as Record<string, StudySet[]>);

    // Sort groups order
    const groupOrder = ['今天', '本周', '本月'];
    const sortedGroupKeys = Object.keys(groupedSets).sort((a, b) => {
        const indexA = groupOrder.indexOf(a);
        const indexB = groupOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // For other dates (months/years), sort descending (newest first)
        // This is a bit tricky with string keys like "5月", "2024年 11月"
        // But since the API returns sorted data, and we process in order, 
        // we might just need to rely on insertion order or parse the keys.
        // However, Object.keys order isn't guaranteed.
        // Let's rely on the fact that "Today" etc are special.
        return b.localeCompare(a); // Simple string sort for others might be wrong for "10月" vs "2月"
    });

    // Better sort for keys not in predefined list
    const finalSortedKeys = Object.keys(groupedSets).sort((a, b) => {
        const indexA = groupOrder.indexOf(a);
        const indexB = groupOrder.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // If both are not special, try to parse dates or just keep them?
        // Since we want recent first, and the API data is sorted by recent first,
        // we can iterate the API data and build a list of groups in order of appearance.
        return 0;
    });

    // Re-implement grouping to preserve order from API
    const orderedGroups: { title: string; items: StudySet[] }[] = [];
    sets.forEach(set => {
        const dateStr = set.last_reviewed || set.updated_at || set.createdAt;
        if (!dateStr) return;
        const date = new Date(dateStr);
        let groupKey = '';

        if (isToday(date)) {
            groupKey = '今天';
        } else if (isThisWeek(date, { weekStartsOn: 1 })) {
            groupKey = '本周';
        } else if (isThisMonth(date)) {
            groupKey = '本月';
        } else if (isSameYear(date, new Date())) {
            groupKey = format(date, 'yyyy年 M月', { locale: zhCN });
        } else {
            groupKey = format(date, 'yyyy年 M月', { locale: zhCN });
        }

        let group = orderedGroups.find(g => g.title === groupKey);
        if (!group) {
            group = { title: groupKey, items: [] };
            orderedGroups.push(group);
        }
        group.items.push(set);
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pl-64 pt-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">我的单词卡</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">{error}</div>
                ) : (
                    <div className="space-y-8">
                        {orderedGroups.map(group => (
                            <section key={group.title}>
                                <h2 className="text-sm font-bold text-gray-500 mb-4 sticky top-20 bg-gray-50 py-2 z-10">
                                    {group.title}
                                </h2>
                                <div className="space-y-3">
                                    {group.items.map(set => (
                                        <div
                                            key={set.id}
                                            onClick={() => navigate(`/set/${set.id}`)}
                                            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                    <span className="font-medium text-gray-900">{set.termCount}个词语</span>
                                                    <span>•</span>
                                                    <div className="flex items-center gap-1">
                                                        {set.authorUsername ? (
                                                            <>
                                                                <User className="w-3 h-3" />
                                                                <span>{set.authorUsername}</span>
                                                            </>
                                                        ) : (
                                                            <span>未知作者</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                    {set.title}
                                                </h3>
                                            </div>

                                            {!set.isPublic && (
                                                <Lock className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        {orderedGroups.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                暂无单词卡记录
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

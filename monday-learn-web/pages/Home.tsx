import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Copy, PartyPopper, Sparkles, X, Calendar, TrendingUp, AlertCircle, BrainCircuit, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon, Zap, Activity, Folder, Trophy, BarChart2, Users, Layers } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { StudySet } from '../types';
import { api } from '../utils/api';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportStatus, setReportStatus] = useState<'idle' | 'generating' | 'complete'>('idle');
    const [reportContent, setReportContent] = useState<string>('');
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('本周');
    const [studySets, setStudySets] = useState<StudySet[]>([]);
    const [loadingSets, setLoadingSets] = useState(true);
    const [setsError, setSetsError] = useState('');
    const [recommendedSets, setRecommendedSets] = useState<StudySet[]>([]);
    const [loadingRecommended, setLoadingRecommended] = useState(true);
    const [recommendedError, setRecommendedError] = useState('');
    const recentRef = useRef<HTMLDivElement | null>(null);
    const recommendedRef = useRef<HTMLDivElement | null>(null);

    const timeframes = ['本周', '本月', '半年', '本年'];

    const normalizeSet = (item: any): StudySet => ({
        ...item,
        termCount: item.termCount ?? item.term_count ?? item.terms?.length ?? 0,
        viewCount: item.viewCount ?? item.view_count ?? 0,
        isPublic: item.isPublic ?? item.is_public ?? true,
        isOwner: item.isOwner ?? item.is_owner ?? false,
    });

    useEffect(() => {
        const fetchSets = async () => {
            setLoadingSets(true);
            setSetsError('');
            try {
                const data = await api.get<StudySet[]>('/study-sets');
                const normalized = (data || []).map(normalizeSet);
                setStudySets(normalized);
            } catch (err: any) {
                setSetsError(err.message || '加载学习集失败');
            } finally {
                setLoadingSets(false);
            }
        };

        fetchSets();
    }, []);

    useEffect(() => {
        const fetchRecommended = async () => {
            setLoadingRecommended(true);
            setRecommendedError('');
            try {
                const data = await api.get<StudySet[]>('/study-sets/public/top?limit=5');
                const normalized = (data || []).map(normalizeSet);
                setRecommendedSets(normalized);
            } catch (err: any) {
                setRecommendedError(err.message || '加载推荐内容失败');
            } finally {
                setLoadingRecommended(false);
            }
        };

        fetchRecommended();
    }, []);

    const heroSet = useMemo(() => studySets[0], [studySets]);

    const setTitleForReport = heroSet?.title || '示例学习集';

    // Mock history data generator to simulate user activity for the AI
    const getMockHistory = (timeframe: string) => {
        return {
            timeframe,
            totalStudyTime: timeframe === '本周' ? '4.5小时' : '120小时',
            setsCompleted: timeframe === '本周' ? 3 : 15,
            averageScore: '78%',
            weakPoints: ['多音字辨析', '生僻字书写', '形近字混淆'],
            recentTests: [
                { name: setTitleForReport, score: '85%', date: '2024-11-15' },
                { name: 'Fast Phonics Peak 2', score: '60%', date: '2024-11-12' },
                { name: '古诗词填空', score: '92%', date: '2024-11-10' }
            ]
        };
    };

    const generateReport = async () => {
        setReportStatus('generating');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const history = getMockHistory(selectedTimeframe);

            const prompt = `
        作为一名专业的个性化学习顾问，请根据以下用户的学习数据生成一份"${selectedTimeframe}学习总结报告"。
        
        用户数据:
        - 时间范围: ${history.timeframe}
        - 总学习时长: ${history.totalStudyTime}
        - 完成学习集: ${history.setsCompleted} 个
        - 平均正确率: ${history.averageScore}
        - 识别出的薄弱点: ${history.weakPoints.join(', ')}
        - 近期测试记录: ${JSON.stringify(history.recentTests)}

        请生成一份结构清晰的报告（使用简单的Markdown格式，不要使用代码块），包含以下部分：
        1. 📊 **整体表现概览**：用鼓励的语气总结用户的努力程度和进步。
        2. 🛑 **错题深度分析**：具体分析为什么用户在"${history.weakPoints.join('、')}"方面存在困难，分析可能的认知误区。
        3. 🚀 **定制化提升计划**：针对薄弱点，给出具体的、可执行的复习建议（例如：建议使用什么模式，每天复习多少个词等）。
        4. 💡 **AI 寄语**：一句简短的激励话语。

        语气要亲切、专业且具有建设性。
      `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            if (response.text) {
                setReportContent(response.text);
                setReportStatus('complete');
            }
        } catch (error) {
            console.error("Error generating report:", error);
            setReportContent("抱歉，生成报告时出现错误，请稍后重试。");
            setReportStatus('complete'); // Show error as text
        }
    };

    const handleCloseModal = () => {
        setShowReportModal(false);
        setReportStatus('idle');
        setReportContent('');
    };

    const scrollBy = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
        const node = ref.current;
        if (!node) return;
        const delta = direction === 'left' ? -node.clientWidth * 0.9 : node.clientWidth * 0.9;
        node.scrollBy({ left: delta, behavior: 'smooth' });
    };

    const renderCard = (set: StudySet) => {
        const termCount = set.termCount || set.terms?.length || 0;
        return (
            <div
                key={set.id}
                className="relative min-w-[280px] max-w-[320px] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-300 group flex flex-col gap-4"
                onClick={() => navigate(`/set/${set.id}`)}
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Layers className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors">{set.title}</h3>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
                                {termCount} 个词语
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                            {set.authorUsername?.[0] || 'U'}
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[80px]">{set.authorUsername || 'User'}</span>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    const renderCarousel = (
        title: string,
        sets: StudySet[],
        loading: boolean,
        error: string,
        ref: React.RefObject<HTMLDivElement>
    ) => (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {title}
                </h2>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="relative group">
                {/* Navigation Buttons - Overlay */}
                {!loading && sets.length > 0 && (
                    <>
                        <button
                            onClick={() => scrollBy(ref, 'left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-2 rounded-full bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                            aria-label="上一页"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scrollBy(ref, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-2 rounded-full bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
                            aria-label="下一页"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                <div
                    ref={ref}
                    className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar scroll-smooth"
                >
                    {loading ? (
                        <div className="flex items-center gap-2 text-gray-500 p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            <span className="text-sm">正在加载...</span>
                        </div>
                    ) : sets.length > 0 ? (
                        sets.map(renderCard)
                    ) : (
                        <div className="bg-white text-gray-500 rounded-xl border border-dashed border-gray-200 p-6 min-w-[260px] flex flex-col items-center justify-center gap-2">
                            <span className="text-sm">暂无数据</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );

    return (
        <main className="pt-24 px-4 md:px-10 md:ml-64 pb-24 md:pb-10 min-h-screen bg-bg-gray text-gray-900">

            {/* Hero Section - Progress & Continue */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                        继续学习
                    </h2>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">

                    {loadingSets ? (
                        <div className="flex items-center gap-3 text-gray-500 w-full justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            正在同步学习进度...
                        </div>
                    ) : heroSet ? (
                        <>
                            {/* Circular Progress */}
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="40"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="8"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 * (1 - ((heroSet.mastered_count || 0) / (heroSet.termCount || 1)))}
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-2xl font-bold text-gray-900">
                                        {Math.round(((heroSet.mastered_count || 0) / (heroSet.termCount || 1)) * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500 mb-3">
                                    <Calendar className="w-3 h-3" />
                                    上次学习: {heroSet.last_reviewed ? new Date(heroSet.last_reviewed).toLocaleString() : '从未学习'}
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{heroSet.title}</h3>
                                <p className="text-gray-500 text-sm flex items-center justify-center md:justify-start gap-2">
                                    <span>{heroSet.termCount || 0} 个词语</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="text-indigo-600 font-medium">
                                        剩余 {Math.max(0, (heroSet.termCount || 0) - (heroSet.mastered_count || 0))} 个待掌握
                                    </span>
                                </p>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => navigate(`/set/${heroSet.id}/test`)}
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                继续挑战
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full gap-4 py-4">
                            <p className="text-gray-500">暂无正在学习的内容</p>
                            <button
                                onClick={() => navigate('/create')}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                创建学习集
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Content Carousel */}
            {renderCarousel('近期访问', studySets, loadingSets, setsError, recentRef)}

            {/* Quick Actions Grid */}
            <section className="mb-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                        onClick={() => navigate('/word-cards')}
                        className="bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Layers className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">单词卡</span>
                    </div>

                    <div className="bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">成就奖章</span>
                    </div>

                    <div className="bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <BarChart2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">学习统计</span>
                    </div>

                    <div className="bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                            <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">班级社区</span>
                    </div>
                </div>
            </section>

            {/* AI Summary Button Section (Bottom) */}
            <section className="mb-8">
                <div
                    onClick={() => setShowReportModal(true)}
                    className="group relative overflow-hidden rounded-3xl cursor-pointer active:scale-[0.99] transition-all shadow-lg shadow-indigo-100"
                >
                    <div className="relative bg-white rounded-[23px] p-6 md:p-8 overflow-hidden border border-indigo-100">
                        {/* Background Decoration */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-[60px] group-hover:bg-indigo-100 transition-colors"></div>
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-50 rounded-full blur-[60px] group-hover:bg-purple-100 transition-colors"></div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">AI Neural Analysis</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">生成学习总结报告</h3>
                                <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
                                    连接至中央处理器。分析您的学习数据矩阵，识别薄弱节点，并生成最优化的神经强化路径。
                                </p>
                            </div>
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <BrainCircuit className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>

                    <div className="relative bg-white w-full md:max-w-2xl h-[90vh] md:h-[85vh] md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-none mb-1">AI 学习诊断</h2>
                                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">System Ready</span>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Timeframe Selection */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                            {timeframes.map(tf => (
                                <button
                                    key={tf}
                                    onClick={() => {
                                        setSelectedTimeframe(tf);
                                        setReportStatus('idle');
                                    }}
                                    disabled={reportStatus === 'generating'}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedTimeframe === tf
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {tf}概况
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
                            {reportStatus === 'idle' && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-100 blur-3xl rounded-full"></div>
                                        <div className="w-32 h-32 bg-white border border-gray-100 rounded-full flex items-center justify-center relative z-10 shadow-xl">
                                            <Calendar className="w-12 h-12 text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="max-w-sm">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">准备生成{selectedTimeframe}报告</h3>
                                        <p className="text-gray-500 mb-8 leading-relaxed">
                                            AI 核心将扫描您的答题矩阵、错误模式和时间流数据，为您计算最佳学习路径。
                                        </p>
                                        <button
                                            onClick={generateReport}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            启动分析程序
                                        </button>
                                    </div>
                                </div>
                            )}

                            {reportStatus === 'generating' && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-100 blur-3xl rounded-full animate-pulse"></div>
                                        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">正在处理数据流...</h3>
                                        <p className="text-gray-500 text-sm font-mono">Scanning neural pathways...</p>
                                    </div>
                                </div>
                            )}

                            {reportStatus === 'complete' && (
                                <div className="prose prose-indigo max-w-none animate-in fade-in duration-500">
                                    {/* Render simple formatted text since we don't have a markdown parser installed */}
                                    {reportContent.split('\n').map((line, idx) => {
                                        // Simple bold handling for headings or **text**
                                        if (line.trim().startsWith('##') || line.trim().startsWith('###') || /^\d+\./.test(line)) {
                                            return (
                                                <h3 key={idx} className="text-indigo-900 font-bold text-xl mt-6 mb-3 border-b border-indigo-100 pb-2">
                                                    {line.replace(/#/g, '')}
                                                </h3>
                                            );
                                        }
                                        if (line.trim() === '') return <br key={idx} />;
                                        return <p key={idx} className="text-gray-600 mb-3 leading-relaxed text-base">{line.replace(/\*\*/g, '')}</p>;
                                    })}

                                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Generated by Gemini AI Core</span>
                                        <button
                                            onClick={generateReport}
                                            className="text-indigo-600 text-sm font-bold hover:text-indigo-800 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                        >
                                            <TrendingUp className="w-4 h-4" /> 重新校准
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
};

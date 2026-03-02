import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Copy, PartyPopper, Sparkles, X, Calendar, TrendingUp, AlertCircle, BrainCircuit, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon, Zap, Activity, Folder, Trophy, BarChart2, Users, Layers, Clock, BookOpen, RefreshCw, Target, Flame, Compass, PlayCircle } from 'lucide-react';
import { StudySet } from '../types';
import { api } from '../utils/api';
import { Logo } from '../components/Logo';
import { normalizeStudySet } from '../utils/studySet';

interface DailyPlan {
    review_count: number;
    consolidate_count: number;
    new_count: number;
    suggested_new: number;
    total_items: number;
    estimated_minutes: number;
}

interface SmartRecommendation {
    study_set_id: number;
    title: string;
    description: string;
    term_count: number;
    mastery_percentage: number;
    reason: 'needs_work' | 'not_started' | 'popular';
}

interface SmartRecommendData {
    needs_work: SmartRecommendation[];
    not_started: SmartRecommendation[];
    popular: SmartRecommendation[];
}

interface WeakTerm {
    term_id: number;
    study_set_id: number;
    term: string;
    definition: string;
    study_set_title: string;
    error_rate: number;
    hours_since_review: number;
    weakness_score: number;
}

const DailyPlanCard: React.FC = () => {
    const navigate = useNavigate();
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const data = await api.get<DailyPlan>('/learning/daily-plan');
                setPlan(data);
            } catch (err: any) {
                setError(err.message || '加载学习计划失败');
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    if (loading) {
        return (
            <section className="mb-10">
                <div className="bg-white dark:bg-[#1a1b4b] rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className="text-sm">正在加载学习计划...</span>
                </div>
            </section>
        );
    }

    if (error || !plan) return null;

    const hasWork = plan.total_items > 0;

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    今日学习计划
                </h2>
                {hasWork && (
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        预计 {plan.estimated_minutes} 分钟
                    </span>
                )}
            </div>

            <div className="bg-white dark:bg-[#1a1b4b] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden relative">
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400"></div>

                {hasWork ? (
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Due Reviews */}
                            <div className="text-center p-4 rounded-xl bg-red-50/80 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                                    {plan.review_count}
                                </div>
                                <div className="text-xs font-medium text-red-500/80 dark:text-red-400/70 flex items-center justify-center gap-1">
                                    <RefreshCw className="w-3 h-3" />
                                    待复习
                                </div>
                                {plan.review_count > 0 && (
                                    <div className="text-[10px] text-red-400 dark:text-red-500 mt-1 font-medium">即将遗忘！</div>
                                )}
                            </div>

                            {/* Consolidate */}
                            <div className="text-center p-4 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                                    {plan.consolidate_count}
                                </div>
                                <div className="text-xs font-medium text-amber-500/80 dark:text-amber-400/70 flex items-center justify-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    需巩固
                                </div>
                            </div>

                            {/* New Terms */}
                            <div className="text-center p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                                    {plan.suggested_new}
                                </div>
                                <div className="text-xs font-medium text-emerald-500/80 dark:text-emerald-400/70 flex items-center justify-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    新学习
                                </div>
                                {plan.new_count > plan.suggested_new && (
                                    <div className="text-[10px] text-emerald-400 dark:text-emerald-500 mt-1 font-medium">共 {plan.new_count} 个可学</div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => navigate('/word-cards')}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5 fill-current" />
                            开始今日学习
                            <span className="text-white/60 text-sm font-normal ml-1">({plan.total_items} 个词)</span>
                        </button>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                            <Trophy className="w-7 h-7 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">今日任务已完成！</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">明天再来继续保持学习节奏 🎉</p>
                    </div>
                )}
            </div>
        </section>
    );
};

const WeakTermsCard: React.FC<{ terms: WeakTerm[] }> = ({ terms }) => {
    const navigate = useNavigate();

    if (!terms || terms.length === 0) return null;

    return (
        <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    高频遗忘项
                </h2>
                <span className="text-xs font-medium text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-500/20">
                    需重点关注
                </span>
            </div>

            <div className="bg-white dark:bg-[#1a1b4b] rounded-2xl border border-rose-100 dark:border-rose-500/20 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                    {terms.slice(0, 3).map((term) => (
                        <div key={term.term_id} className="p-4 flex items-center justify-between hover:bg-rose-50/30 dark:hover:bg-rose-500/5 transition-colors">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{term.term}</h4>
                                    <span className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                                        <Folder className="w-3 h-3" />
                                        {term.study_set_title}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{term.definition}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded">
                                    错误率 {term.error_rate}%
                                </span>
                                {term.hours_since_review > 24 && (
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                        {Math.floor(term.hours_since_review / 24)} 天前复习
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {terms.length > 3 && (
                    <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-50 dark:border-white/5 text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 cursor-default">
                            还有 {terms.length - 3} 个易忘词汇，建议尽快复习哦
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
};

const SmartRecommendSection: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<SmartRecommendData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRec = async () => {
            try {
                const res = await api.get<SmartRecommendData>('/learning/smart-recommend');
                setData(res);
            } catch (err) {
                console.error("Failed to load smart recommendations:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRec();
    }, []);

    if (loading || !data) return null;

    const sections = [
        {
            title: "突破瓶颈",
            icon: <Flame className="w-5 h-5 text-orange-500" />,
            items: data.needs_work,
            emptyText: "干得漂亮！你已经掌握了所有内容。"
        },
        {
            title: "新目标",
            icon: <Target className="w-5 h-5 text-indigo-500" />,
            items: data.not_started,
            emptyText: "你还没有待开始的学习集。"
        },
        {
            title: "探索发现",
            icon: <Compass className="w-5 h-5 text-purple-500" />,
            items: data.popular,
            emptyText: "暂无热门推荐。"
        }
    ];

    const hasRecommendations = sections.some(s => s.items.length > 0);
    if (!hasRecommendations) return null;

    return (
        <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                智能学习推荐
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((section, idx) => {
                    if (section.items.length === 0 && idx === 2) return null; // Hide empty popular

                    return (
                        <div key={idx} className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                {section.icon}
                                {section.title}
                            </h3>

                            {section.items.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {section.items.slice(0, 2).map((item) => (
                                        <div
                                            key={item.study_set_id}
                                            onClick={() => navigate(`/study-sets/${item.study_set_id}`)}
                                            className="group bg-white dark:bg-[#1a1b4b] p-4 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 cursor-pointer transition-all flex flex-col h-full relative overflow-hidden"
                                        >
                                            {item.reason === 'needs_work' && item.mastery_percentage < 30 && (
                                                <div className="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none">
                                                    <div className="bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider text-center py-1 absolute top-[12px] right-[-16px] w-[60px] rotate-45 shadow-sm">
                                                        Hard
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-2 pr-6">
                                                <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {item.title}
                                                </h4>
                                            </div>

                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                                                {item.description || '暂无描述'}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-md flex items-center gap-1">
                                                        <Layers className="w-3 h-3" />
                                                        {item.term_count} 词
                                                    </span>
                                                    {item.reason === 'popular' && item.view_count !== undefined && (
                                                        <span className="text-[10px] font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {item.view_count} 热度
                                                        </span>
                                                    )}
                                                </div>

                                                {item.reason === 'needs_work' && (
                                                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-md text-[10px] font-bold">
                                                        <span>掌握 {item.mastery_percentage}%</span>
                                                    </div>
                                                )}
                                                {(item.reason === 'not_started' || item.reason === 'popular') && (
                                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                                                        <PlayCircle className="w-3 h-3" />
                                                        开始
                                                    </span>
                                                )}
                                            </div>
                                            {/* Progress Bar */}
                                            {item.reason === 'needs_work' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-white/5">
                                                    <div className="h-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all duration-500" style={{ width: `${item.mastery_percentage}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full min-h-[120px] bg-gray-50/50 dark:bg-[#1a1b4b]/30 rounded-xl border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center p-4 text-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2">
                                        <Sparkles className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{section.emptyText}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportStatus, setReportStatus] = useState<'idle' | 'generating' | 'complete'>('idle');
    const [reportContent, setReportContent] = useState<string>('');
    const [reportData, setReportData] = useState<{ report_id?: number; suggestion_create_set?: boolean; mistakes?: any[] } | null>(null);
    const [creatingSet, setCreatingSet] = useState(false);
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('本周');
    const [studySets, setStudySets] = useState<StudySet[]>([]);
    const [loadingSets, setLoadingSets] = useState(true);
    const [setsError, setSetsError] = useState('');
    const [weakTerms, setWeakTerms] = useState<WeakTerm[]>([]);
    const recentRef = useRef<HTMLDivElement | null>(null);
    const recommendedRef = useRef<HTMLDivElement | null>(null);

    const heroSet = useMemo(() => {
        // Find the first set that is not fully mastered
        const notMastered = studySets.find(set => (set.mastered_count || 0) < (set.termCount || 0));
        // Fallback to the most recent set if all are mastered or none exist
        return notMastered || studySets[0];
    }, [studySets]);

    const timeframes = ['本周', '本月', '半年', '本年'];

    const normalizeSet = normalizeStudySet;

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

        const fetchWeakTerms = async () => {
            try {
                const res = await api.get<{ items: WeakTerm[] }>('/learning/weak-terms');
                if (res && res.items) setWeakTerms(res.items);
            } catch (err) {
                console.error("Failed to load weak terms:", err);
            }
        };

        fetchSets();
        fetchWeakTerms();
    }, []);

    const generateReport = async () => {
        setReportStatus('generating');
        setReportData(null);
        try {
            const res = await api.post<{
                content: string;
                report_id?: number;
                suggestion_create_set?: boolean;
                raw_stats?: { top_mistakes?: any[] }
            }>('/learning/report', { timeframe: selectedTimeframe });

            setReportContent(res?.content || '未获取到报告内容，请稍后重试。');
            setReportData({
                report_id: res?.report_id,
                suggestion_create_set: res?.suggestion_create_set,
                mistakes: res?.raw_stats?.top_mistakes || []
            });
            setReportStatus('complete');
        } catch (error) {
            console.error("Error generating report:", error);
            setReportContent("抱歉，生成报告时出现错误，请稍后重试。");
            setReportStatus('complete'); // Show error as text
        }
    };

    const handleCreateErrorSet = () => {
        if (!reportData?.mistakes || reportData.mistakes.length === 0) return;

        const initialTerms = reportData.mistakes.map((m: any, index: number) => ({
            id: `mistake-${index}`,
            term: m.term,
            definition: m.definition || '',
            status: 'not_started',
            order: index
        }));

        navigate('/create', {
            state: {
                initialTitle: `错题集 - ${new Date().toLocaleDateString()}`,
                initialDescription: '基于AI学习诊断生成的错题集',
                initialTerms: initialTerms
            }
        });
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
                className="relative min-w-[280px] max-w-[320px] bg-white dark:bg-[#1a1b4b] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 group flex flex-col gap-4"
                onClick={() => navigate(`/set/${set.id}`)}
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{set.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-200 dark:border-white/10">
                                {termCount} 个词语
                            </span>
                        </div>

                        {/* Mastery Progress */}
                        {(set.mastered_count || 0) > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${Math.min(100, Math.round(((set.mastered_count || 0) / (termCount || 1)) * 100))}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                                    {Math.round(((set.mastered_count || 0) / (termCount || 1)) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-white/10 mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 flex items-center justify-center text-xs font-bold">
                            {set.authorUsername?.[0] || 'U'}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{set.authorUsername || 'User'}</span>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
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
                            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-2 rounded-full bg-white dark:bg-[#1a1b4b] border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-lg opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                            aria-label="上一页"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scrollBy(ref, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-2 rounded-full bg-white dark:bg-[#1a1b4b] border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-lg opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
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
                        <div className="bg-white dark:bg-[#1a1b4b] text-gray-500 dark:text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-6 min-w-[260px] flex flex-col items-center justify-center gap-2">
                            <span className="text-sm">暂无数据</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );

    return (
        <main className="pt-24 px-4 md:px-10 md:ml-64 pb-24 md:pb-10 min-h-screen bg-bg-gray dark:bg-dark-blue text-gray-900 dark:text-white transition-colors duration-200">

            {/* Hero Section - Progress & Continue */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                        继续学习
                    </h2>
                </div>
                {/* Hero Section */}
                <section className="bg-white dark:bg-[#1a1b4b] rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden mb-10 transition-colors duration-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

                    {loadingSets ? (
                        <div className="flex items-center gap-3 text-gray-500 w-full justify-center py-8 z-10">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            正在同步学习进度...
                        </div>
                    ) : heroSet ? (
                        <>
                            <div className="relative z-10 flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold mb-4">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                    今日学习目标
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                    准备好开始今天的<br />
                                    <span className="text-primary dark:text-indigo-400">单词挑战</span>了吗？
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto md:mx-0">
                                    你上次学习到了 <span className="font-bold text-gray-700 dark:text-gray-200">{heroSet.title}</span>。
                                    坚持每天 15 分钟，轻松掌握新词汇！
                                </p>
                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                                    <button
                                        onClick={() => navigate(`/set/${heroSet.id}`)}
                                        className="w-full sm:w-auto px-8 py-3 bg-primary text-white dark:bg-white dark:text-primary rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-primary-dark dark:hover:bg-gray-100 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                    >
                                        继续挑战
                                    </button>
                                </div>
                            </div>

                            <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
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
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(((heroSet.mastered_count || 0) / (heroSet.termCount || 1)) * 100)}%
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium mt-1">已掌握</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="relative z-10 flex-1 text-center py-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">欢迎来到
                                <span className="text-gray-800 dark:text-gray-200">Monday</span>
                                <span className="text-[#4255ff]">Quizlet</span></h1>

                            <p className="text-gray-500 dark:text-gray-400 mb-8">创建你的第一个学习集，开始高效记忆！</p>
                            <button
                                onClick={() => navigate('/create')}
                                className="px-8 py-3 bg-primary text-white dark:bg-white dark:text-primary rounded-xl font-bold shadow-lg hover:bg-primary-dark dark:hover:bg-gray-100 transition-all"
                            >
                                创建学习集
                            </button>
                        </div>
                    )}
                </section>
            </section>

            {/* Daily Learning Plan - SRS */}
            <DailyPlanCard />

            {/* Weak Terms Alert */}
            <WeakTermsCard terms={weakTerms} />

            {/* Smart Recommendations */}
            <SmartRecommendSection />

            {/* Recent Content Carousel */}
            {renderCarousel('近期访问', studySets, loadingSets, setsError, recentRef)}

            {/* Quick Actions Grid */}
            <section className="mb-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                        onClick={() => navigate('/word-cards')}
                        className="bg-white dark:bg-[#1a1b4b] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                            <Layers className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">单词卡</span>
                    </div>

                    <div
                        onClick={() => navigate('/achievements')}
                        className="bg-white dark:bg-[#1a1b4b] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-100 dark:group-hover:bg-yellow-500/20 transition-colors">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">成就奖章</span>
                    </div>

                    <div className="bg-white dark:bg-[#1a1b4b] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                            <BarChart2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">学习统计</span>
                    </div>

                    <div className="bg-white dark:bg-[#1a1b4b] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors">
                            <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">班级社区</span>
                    </div>
                </div>
            </section>

            {/* AI Summary Button Section (Bottom) */}
            <section className="mb-8">
                <div
                    onClick={() => setShowReportModal(true)}
                    className="group relative overflow-hidden rounded-3xl cursor-pointer active:scale-[0.99] transition-all shadow-lg shadow-indigo-100"
                >
                    <div className="relative bg-white dark:bg-[#1a1b4b] rounded-[23px] p-6 md:p-8 overflow-hidden border border-indigo-100 dark:border-white/10">
                        {/* Background Decoration */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors"></div>
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-50 dark:bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors"></div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI Neural Analysis</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">生成学习总结报告</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg leading-relaxed">
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
            {
                showReportModal && (
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
                                            <div className="flex gap-2">
                                                {reportData?.suggestion_create_set && (
                                                    <button
                                                        onClick={handleCreateErrorSet}
                                                        disabled={creatingSet}
                                                        className="text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md shadow-indigo-200"
                                                    >
                                                        {creatingSet ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                                                        生成错题集
                                                    </button>
                                                )}
                                                <button
                                                    onClick={generateReport}
                                                    className="text-indigo-600 text-sm font-bold hover:text-indigo-800 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                                >
                                                    <TrendingUp className="w-4 h-4" /> 重新校准
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

        </main >
    );
};

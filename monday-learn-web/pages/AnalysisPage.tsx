import React, { useEffect, useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Activity, Clock, Target, BrainCircuit, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { analysisService, DailyActivity, ProgressDistribution, ForgettingCurvePoint } from '../services/analysis';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e']; // Indigo, Emerald, Amber, Rose

// --- Custom Tooltips ---
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#1a1b4b] p-4 rounded-xl border border-gray-100 dark:border-white/10 shadow-xl flex flex-col gap-2">
                <p className="text-gray-900 dark:text-white font-bold">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {entry.dataKey === 'time_spent_ms'
                                ? `${(entry.value / 60000).toFixed(1)} 分钟`
                                : `${entry.value} 题`}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#1a1b4b] p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-xl flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{payload[0].name}</span>
                <span className="text-base font-bold text-gray-900 dark:text-white ml-2">{payload[0].value} 项</span>
            </div>
        );
    }
    return null;
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#1a1b4b] p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-xl flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">间隔: {label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">记忆保持率</span>
                    <span className="text-base font-bold text-orange-500">{payload[0].value}%</span>
                </div>
            </div>
        );
    }
    return null;
};

export const AnalysisPage: React.FC = () => {
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [distribution, setDistribution] = useState<ProgressDistribution[]>([]);
    const [forgettingCurve, setForgettingCurve] = useState<ForgettingCurvePoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [activity, dist, curve] = await Promise.all([
                    analysisService.getDailyActivity(7),
                    analysisService.getProgressDistribution(),
                    analysisService.getForgettingCurve()
                ]);
                setDailyActivity(activity);
                setDistribution(dist);
                setForgettingCurve(curve);
            } catch (error) {
                console.error('Failed to fetch analysis data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Extract Summary Data
    const summaryData = useMemo(() => {
        if (!dailyActivity.length || !distribution.length) return null;

        let totalQuestions = 0;
        let totalTimeMs = 0;
        dailyActivity.forEach(day => {
            totalQuestions += day.question_count;
            totalTimeMs += day.time_spent_ms;
        });

        const totalTerms = distribution.reduce((acc, curr) => acc + curr.value, 0);
        const masteredItem = distribution.find(d => d.name === 'Mastered') || { value: 0 };
        const masteryRate = totalTerms > 0 ? Math.round((masteredItem.value / totalTerms) * 100) : 0;

        return {
            totalQuestions,
            totalMinutes: Math.round(totalTimeMs / 60000),
            masteryRate,
            totalTerms
        };
    }, [dailyActivity, distribution]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[caL(100vh-64px)] w-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <div className="text-sm font-medium text-gray-500 animate-pulse">正在全息解析学习数据...</div>
                </div>
            </div>
        );
    }

    // Prepare chart data format
    const formattedActivity = dailyActivity.map(day => ({
        ...day,
        dateLabel: new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }));

    // Map distribution to custom colors specifically
    const distributionColorMap: Record<string, string> = {
        'Mastered': '#10b981',     // Emerald
        'Familiar': '#f59e0b',     // Amber
        'Not Started': '#94a3b8'   // Slate
    };

    // Check if empty state
    const isActivityEmpty = dailyActivity.every(d => d.question_count === 0 && d.time_spent_ms === 0);
    const isDistEmpty = distribution.every(d => d.value === 0);

    return (
        <main className="pt-24 px-4 md:px-10 md:ml-64 pb-24 md:pb-10 min-h-screen bg-bg-gray dark:bg-dark-blue transition-colors duration-200">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 leading-none dark:bg-white/10 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        学习分析报告
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 ml-[52px]">
                        掌握学习节奏，发现提升空间。以下是您的近期学习数据矩阵。
                    </p>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white dark:bg-[#1a1b4b] px-4 py-2 border border-gray-100 dark:border-white/10 rounded-full shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">实时数据已同步</span>
                </div>
            </div>

            {/* Summary Cards */}
            {summaryData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Card 1 */}
                    <div className="bg-white dark:bg-[#1a1b4b] rounded-2xl p-5 border border-indigo-50 dark:border-indigo-500/10 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between relative z-10 mb-4">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider">7日复习题量</h3>
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="relative z-10 font-bold text-3xl text-gray-900 dark:text-white flex items-end gap-2">
                            {summaryData.totalQuestions}
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">题</span>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white dark:bg-[#1a1b4b] rounded-2xl p-5 border border-emerald-50 dark:border-emerald-500/10 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between relative z-10 mb-4">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider">7日专注时长</h3>
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="relative z-10 font-bold text-3xl text-gray-900 dark:text-white flex items-end gap-2">
                            {summaryData.totalMinutes}
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">分钟</span>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white dark:bg-[#1a1b4b] rounded-2xl p-5 border border-amber-50 dark:border-amber-500/10 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between relative z-10 mb-4">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider">整体掌握率</h3>
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Target className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="relative z-10 font-bold text-3xl text-gray-900 dark:text-white flex items-end gap-1">
                            {summaryData.masteryRate}
                            <span className="text-2xl">%</span>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white dark:bg-[#1a1b4b] rounded-2xl p-5 border border-purple-50 dark:border-purple-500/10 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 dark:bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between relative z-10 mb-4">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider">学习总项数</h3>
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <BrainCircuit className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="relative z-10 font-bold text-3xl text-gray-900 dark:text-white flex items-end gap-2">
                            {summaryData.totalTerms}
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">项</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Active Chart: 7 Days */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1a1b4b] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            过去7天活动趋势
                        </h2>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-3 py-1 rounded-full">
                            近期活跃度
                        </span>
                    </div>
                    {isActivityEmpty ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                            <AlertCircle className="w-8 h-8 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">过去7天暂无学习记录</p>
                            <p className="text-xs text-gray-400 mt-1">开始复习以积攒数据</p>
                        </div>
                    ) : (
                        <div className="h-72 w-full mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formattedActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700/50" />
                                    <XAxis
                                        dataKey="dateLabel"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        dx={-10}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        dx={10}
                                        hide // Hide the right axis to keep UI cleaner, data still represented by bars
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                    <Bar yAxisId="left" dataKey="question_count" name="解答题目" fill="url(#colorQuestions)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar yAxisId="right" dataKey="time_spent_ms" name="耗时" fill="url(#colorTime)" radius={[4, 4, 0, 0]} maxBarSize={40} />

                                    <defs>
                                        <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.5} />
                                        </linearGradient>
                                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.5} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Progress Distribution Chart */}
                <div className="bg-white dark:bg-[#1a1b4b] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col relative overflow-hidden">
                    <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-emerald-50 dark:bg-emerald-500/5 rounded-full blur-3xl"></div>

                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" />
                            全局进度分布
                        </h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">您目前在所有卡集中的掌握情况</p>

                    {isDistEmpty ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                            <Sparkles className="w-8 h-8 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">尚未开始任何学习记录</p>
                        </div>
                    ) : (
                        <div className="h-64 w-full relative z-10 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        animationBegin={200}
                                        animationDuration={1000}
                                    >
                                        {distribution.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={distributionColorMap[entry.name] || COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text for Pie */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                                        {summaryData?.totalTerms || 0}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
                                        Total
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Retention Rate (Forgetting Curve) */}
            <div className="bg-white dark:bg-[#1a1b4b] p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 relative overflow-hidden mb-8 group">
                {/* Decorative background for the premium feel */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-50/80 to-transparent dark:from-orange-500/5 -mr-40 -mt-40 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                            <BrainCircuit className="w-6 h-6 text-orange-500" />
                            记忆保持率验证曲线
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                            此曲线模拟了您在不同时间间隔后的记忆留存率 (Retention Rate)。当虚线下降时，正是最佳的复习巩固时机。这可以帮助您建立关于复习频率的最佳长期肌肉记忆。
                        </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center gap-4 bg-gray-50 dark:bg-white/5 rounded-full px-4 py-2 border border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-1 rounded-full bg-orange-500"></div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">实际保持率</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-4 px-2 tracking-widest text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 font-bold rounded">AI 测算</div>
                        </div>
                    </div>
                </div>

                <div className="h-80 lg:h-96 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forgettingCurve} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700/50" />
                            <XAxis
                                dataKey="interval"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }}
                                dy={15}
                            />
                            <YAxis
                                unit="%"
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                dx={-10}
                                ticks={[0, 25, 50, 75, 100]}
                            />
                            <Tooltip content={<CustomLineTooltip />} cursor={{ stroke: 'rgba(249, 115, 22, 0.2)', strokeWidth: 2, strokeDasharray: '5 5' }} />

                            {/* Line representing the curve */}
                            <Area
                                type="monotone"
                                dataKey="retention"
                                stroke="#f97316"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRetention)"
                                animationDuration={1500}
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#f97316', className: 'shadow-[0_0_15px_rgba(249,115,22,0.6)]' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </main>
    );
};

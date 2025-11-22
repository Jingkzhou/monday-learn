import React from 'react';
import { ChevronLeft, ChevronRight, Flame, Shield, Hexagon, Star, Zap, Clock, Award, BookOpen, Target, PenTool } from 'lucide-react';

export const Achievements: React.FC = () => {
    // Mock data for calendar
    const calendarDays = Array.from({ length: 35 }, (_, i) => {
        const day = i - 2; // Start from previous month end
        return {
            day: day > 0 && day <= 30 ? day : day <= 0 ? 31 + day : day - 30,
            isCurrentMonth: day > 0 && day <= 30,
            hasStreak: day > 0 && day <= 22, // Mock streak until 22nd
            isToday: day === 22
        };
    });

    const weekDays = ['周', '周', '周', '周', '周', '周', '周'];

    const learningBadges = [
        { id: 1, name: '单词卡奇才', date: '2025年9月17日', icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-900/30', border: 'border-cyan-500/50' },
        { id: 2, name: '积极学员', date: '2025年9月17日', icon: Target, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-500/50' },
        { id: 3, name: '坚定学员', date: '', icon: Zap, color: 'text-gray-400', bg: 'bg-gray-800/30', border: 'border-gray-600/30', locked: true },
        { id: 4, name: '配对奇才', date: '2025年9月17日', icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-500/50' },
        { id: 5, name: '夜猫子', date: '2025年9月17日', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/50' },
        { id: 6, name: '早起的鸟儿', date: '2025年9月17日', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/50' },
        { id: 7, name: '测试达人', date: '2025年9月17日', icon: Award, color: 'text-pink-400', bg: 'bg-pink-900/30', border: 'border-pink-500/50' },
        { id: 8, name: '学习集创建工具', date: '2025年9月17日', icon: PenTool, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-500/50' },
        { id: 9, name: '配对能手', date: '2025年9月17日', icon: Star, color: 'text-sky-400', bg: 'bg-sky-900/30', border: 'border-sky-500/50' },
        { id: 10, name: '考试准备就绪', date: '', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-800/30', border: 'border-gray-600/30', locked: true },
    ];

    const setBadges = [1, 3, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300];
    const currentSetCount = 75;

    return (
        <div className="min-h-screen bg-[#0a092d] text-white p-6 md:p-10 md:ml-64 pt-24">
            <h1 className="text-3xl font-bold mb-8">成就</h1>

            {/* Recent Activity Section */}
            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4 text-gray-200">近期活动</h2>
                <div className="bg-[#15143c] rounded-2xl p-8 border border-white/5 relative overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">

                        {/* Recent Earned Badge */}
                        <div className="flex flex-col items-center justify-center text-center">
                            <h3 className="text-gray-300 font-bold mb-1">近期赢得</h3>
                            <p className="text-gray-500 text-sm mb-6">已学75个学习集</p>
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                {/* Shield Shape CSS */}
                                <div className="absolute inset-0 bg-purple-500 clip-path-shield transform scale-110 opacity-50 blur-sm"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-400 to-purple-600 clip-path-shield flex items-center justify-center shadow-lg">
                                    <div className="w-24 h-24 bg-white/10 backdrop-blur-sm clip-path-shield flex items-center justify-center border-2 border-white/30">
                                        <span className="text-3xl font-bold text-white drop-shadow-md">75</span>
                                    </div>
                                </div>
                                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
                                <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-yellow-300 animate-pulse delay-75" />
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-between w-full mb-4 px-4">
                                <span className="font-bold text-lg">2025年11月</span>
                                <div className="flex gap-2">
                                    <button className="p-1 rounded hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></button>
                                    <button className="p-1 rounded hover:bg-white/10"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-3 text-center">
                                {weekDays.map((d, i) => (
                                    <span key={i} className="text-xs text-gray-500 font-medium">{d}</span>
                                ))}
                                {calendarDays.map((day, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center w-8 h-10 relative">
                                        {day.hasStreak ? (
                                            <div className="relative w-8 h-8 flex items-center justify-center">
                                                <Flame className="w-8 h-8 text-orange-500 fill-orange-500 drop-shadow-orange" />
                                                <span className="absolute text-[10px] font-bold text-white z-10">{day.day}</span>
                                            </div>
                                        ) : (
                                            <span className={`text-sm ${day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}`}>{day.day}</span>
                                        )}
                                        {day.isToday && <div className="w-1 h-1 bg-white rounded-full mt-1"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Current Streak */}
                        <div className="flex flex-col items-center justify-center">
                            <h3 className="text-gray-300 font-bold mb-4">当前时段</h3>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-4xl font-bold text-white mb-2">6天</span>
                                <div className="flex flex-col-reverse gap-1 h-32 justify-end">
                                    {[...Array(6)].map((_, i) => (
                                        <Flame key={i} className={`w-6 h-6 text-orange-500 fill-orange-500 opacity-${100 - i * 10}`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Learning Badges Section */}
            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4 text-gray-200">学习</h2>
                <div className="bg-[#15143c] rounded-2xl p-8 border border-white/5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {learningBadges.map((badge) => (
                            <div key={badge.id} className="flex flex-col items-center text-center gap-3">
                                <div className={`relative w-24 h-24 flex items-center justify-center`}>
                                    {/* Hexagon Background */}
                                    <div className={`absolute inset-0 ${badge.bg} ${badge.border} border-2 clip-path-hexagon`}></div>
                                    {/* Icon */}
                                    <badge.icon className={`w-10 h-10 ${badge.color} relative z-10`} />
                                    {!badge.locked && (
                                        <>
                                            <Sparkles className="absolute top-1 right-2 w-3 h-3 text-yellow-200" />
                                            <Sparkles className="absolute bottom-2 left-2 w-2 h-2 text-white/50" />
                                        </>
                                    )}
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${badge.locked ? 'text-gray-500' : 'text-gray-200'}`}>{badge.name}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">{badge.date || '未解锁'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* All Achievements Section */}
            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4 text-gray-200">全部成绩</h2>
                <div className="bg-[#15143c] rounded-2xl p-8 border border-white/5">
                    <h3 className="text-gray-400 text-sm mb-6">已学的学习集</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {setBadges.map((count) => {
                            const isUnlocked = count <= currentSetCount;
                            return (
                                <div key={count} className="flex flex-col items-center text-center gap-3">
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <div className={`absolute inset-0 clip-path-shield ${isUnlocked ? 'bg-gradient-to-b from-purple-400 to-purple-600' : 'bg-gray-800'} flex items-center justify-center`}>
                                            <div className={`w-20 h-20 ${isUnlocked ? 'bg-white/10' : 'bg-gray-900'} backdrop-blur-sm clip-path-shield flex items-center justify-center border-2 ${isUnlocked ? 'border-white/30' : 'border-gray-700'}`}>
                                                <div className={`w-12 h-8 ${isUnlocked ? 'bg-white text-purple-600' : 'bg-gray-700 text-gray-500'} rounded-md flex items-center justify-center font-bold shadow-sm`}>
                                                    {count}
                                                </div>
                                            </div>
                                        </div>
                                        {isUnlocked && <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300" />}
                                    </div>
                                    <div>
                                        <div className={`font-bold text-xs ${isUnlocked ? 'text-gray-200' : 'text-gray-500'}`}>已学{count}个学习集</div>
                                        <div className="text-[10px] text-gray-500 mt-1">{isUnlocked ? '2025年9月17日' : ''}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-10 flex justify-center">
                        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-full text-sm font-bold transition-colors">
                            查看全部
                        </button>
                    </div>
                </div>
            </section>

            <style>{`
        .clip-path-shield {
          clip-path: polygon(50% 0, 100% 15%, 100% 85%, 50% 100%, 0 85%, 0 15%);
        }
        .clip-path-hexagon {
          clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
        }
        .drop-shadow-orange {
          filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.5));
        }
      `}</style>
        </div>
    );
};

// Helper component for sparkles
const Sparkles = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
);

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Term } from '../types';
import { X, Settings, Volume2, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface LearningTerm extends Term {
    learning_status: 'not_started' | 'familiar' | 'mastered';
    consecutive_correct: number;
}

interface LearningSession {
    new_count: number;
    familiar_count: number;
    mastered_count: number;
    terms: LearningTerm[];
}

export const LearnMode: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState<LearningSession | null>(null);
    const [queue, setQueue] = useState<LearningTerm[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [roundComplete, setRoundComplete] = useState(false);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        mc: true,
        written: true,
        flashcard: false
    });

    // Flashcard State
    const [isFlipped, setIsFlipped] = useState(false);

    // Interaction State
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // For MC
    const [typedAnswer, setTypedAnswer] = useState(""); // For Written
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Local counts state for real-time updates
    const [counts, setCounts] = useState({ new: 0, familiar: 0, mastered: 0 });

    const fetchSession = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await api.get<LearningSession>(`/learning/${id}/session`);
            setSession(data);
            setQueue(data.terms);
            setCounts({
                new: data.new_count,
                familiar: data.familiar_count,
                mastered: data.mastered_count
            });
            setCurrentIndex(0);
            setRoundComplete(false);
            setIsFlipped(false);
        } catch (err) {
            console.error("Failed to fetch session", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();
    }, [id]);

    useEffect(() => {
        if (queue.length > 0 && !roundComplete && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIndex, queue, roundComplete]);

    const currentTerm = queue[currentIndex];

    // Determine Question Type
    const questionType = useMemo(() => {
        if (!currentTerm) return 'mc';

        const isFamiliar = currentTerm.consecutive_correct >= 1;

        if (isFamiliar) {
            if (settings.written) return 'written';
            if (settings.mc) return 'mc';
            return 'flashcard';
        } else {
            if (settings.mc) return 'mc';
            return 'flashcard';
        }
    }, [currentTerm, settings]);

    // Generate options for Multiple Choice
    const options = useMemo(() => {
        if (!currentTerm || !session) return [];
        const correct = currentTerm.definition;
        const otherTerms = session.terms.filter(t => t.id !== currentTerm.id);
        const wrong = otherTerms.sort(() => 0.5 - Math.random()).slice(0, 3).map(t => t.definition);
        return [...wrong, correct].sort(() => 0.5 - Math.random());
    }, [currentTerm, session]);

    const handleAnswer = async (answer: string) => {
        if (showFeedback) return;

        const isRight = answer.trim().toLowerCase() === currentTerm.definition.toLowerCase();
        setIsCorrect(isRight);
        setSelectedAnswer(answer);
        setShowFeedback(true);

        try {
            await api.post(`/learning/${id}/update/${currentTerm.id}`, { is_correct: isRight });
        } catch (err) {
            console.error("Failed to update progress", err);
        }
    };

    const handleFlashcardGrade = async (correct: boolean) => {
        setIsCorrect(correct);
        setShowFeedback(true); // Trigger auto-advance logic

        try {
            await api.post(`/learning/${id}/update/${currentTerm.id}`, { is_correct: correct });
        } catch (err) {
            console.error("Failed to update progress", err);
        }
    };

    const handleContinue = () => {
        setShowFeedback(false);
        setSelectedAnswer(null);
        setTypedAnswer("");
        setIsCorrect(null);
        setIsFlipped(false);

        const updatedTerm = { ...currentTerm };
        let newCounts = { ...counts };

        console.log("handleContinue:", {
            term: currentTerm.term,
            status: currentTerm.learning_status,
            isCorrect,
            currentCounts: counts
        });

        // State Machine Logic
        // 1. Not Started (Gray) + Correct -> Familiar (Orange)
        // 2. Familiar (Orange) + Correct -> Mastered (Green)
        // 3. Any + Incorrect -> Not Started (Gray)

        const currentStatus = currentTerm.learning_status;

        if (isCorrect) {
            if (currentStatus === 'not_started') {
                // Transition: Not Started -> Familiar
                updatedTerm.learning_status = 'familiar';
                updatedTerm.consecutive_correct = 1;

                newCounts.new = Math.max(0, newCounts.new - 1);
                newCounts.familiar += 1;

                // Move to end of queue
                const newQueue = [...queue];
                newQueue.splice(currentIndex, 1);
                newQueue.push(updatedTerm);
                setQueue(newQueue);
                if (currentIndex >= newQueue.length) setCurrentIndex(0);

            } else if (currentStatus === 'familiar') {
                // Transition: Familiar -> Mastered
                updatedTerm.learning_status = 'mastered';
                updatedTerm.consecutive_correct = 2;

                newCounts.familiar = Math.max(0, newCounts.familiar - 1);
                newCounts.mastered += 1;

                // Remove from queue
                const newQueue = [...queue];
                newQueue.splice(currentIndex, 1);
                setQueue(newQueue);

                if (newQueue.length === 0) {
                    setRoundComplete(true);
                } else if (currentIndex >= newQueue.length) {
                    setCurrentIndex(0);
                }
            } else {
                // Already Mastered (shouldn't happen in queue usually)
                const newQueue = [...queue];
                newQueue.splice(currentIndex, 1);
                setQueue(newQueue);
                if (newQueue.length === 0) setRoundComplete(true);
                else if (currentIndex >= newQueue.length) setCurrentIndex(0);
            }
        } else {
            // Incorrect: Reset consecutive correct, but keep status if already familiar
            updatedTerm.consecutive_correct = 0;

            if (currentStatus === 'familiar') {
                // Stay Familiar
                updatedTerm.learning_status = 'familiar';
                // Counts do NOT change (still familiar)
            } else {
                // Stay Not Started
                updatedTerm.learning_status = 'not_started';
            }

            // Move to end of queue
            const newQueue = [...queue];
            newQueue.splice(currentIndex, 1);
            newQueue.push(updatedTerm);
            setQueue(newQueue);
            if (currentIndex >= newQueue.length) setCurrentIndex(0);
        }

        console.log("New Counts:", newCounts);
        setCounts(newCounts);
    };

    // Auto-advance
    useEffect(() => {
        if (showFeedback) {
            const delay = isCorrect ? 1500 : 2000; // 2s for incorrect, 1.5s for correct
            const timer = setTimeout(() => {
                handleContinue();
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [showFeedback, isCorrect]);


    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (roundComplete) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">这一轮完成了！</h2>
                <p className="text-gray-600 mb-8">您已经掌握了这批词条。准备好继续了吗？</p>
                <button
                    onClick={fetchSession}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                    继续学习 <ArrowRight className="w-5 h-5" />
                </button>
                <button
                    onClick={() => navigate(`/set/${id}`)}
                    className="mt-4 text-gray-500 font-bold hover:text-gray-900"
                >
                    返回学习集
                </button>
            </div>
        );
    }

    if (!session || queue.length === 0) {
        // If session is null (error) or empty (no terms), show appropriate message
        if (!session) {
            return (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">无法加载学习内容</h2>
                    <p className="text-gray-600 mb-8">请检查网络连接或稍后再试。</p>
                    <button
                        onClick={fetchSession}
                        className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        重试
                    </button>
                    <button
                        onClick={() => navigate(`/set/${id}`)}
                        className="mt-4 text-gray-500 font-bold hover:text-gray-900 block"
                    >
                        返回学习集
                    </button>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">太棒了！</h2>
                <p className="text-gray-600 mb-8">您已经掌握了所有词条！</p>
                <button
                    onClick={() => navigate(`/set/${id}`)}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
                >
                    完成
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 relative">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center text-primary font-bold gap-2 cursor-pointer" onClick={() => navigate(-1)}>
                        <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
                            <span className="text-sm">←</span>
                        </div>
                        <span>学习</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                        {counts.mastered} 已掌握 · {counts.familiar} 熟悉 · {counts.new} 未学习
                    </div>
                    <div className="w-full max-w-md h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(counts.mastered) / (counts.new + counts.familiar + counts.mastered || 1) * 100}%` }}></div>
                        <div className="bg-amber-400 h-full" style={{ width: `${(counts.familiar) / (counts.new + counts.familiar + counts.mastered || 1) * 100}%` }}></div>
                    </div>
                </div>

                <div className="flex-1 flex justify-end gap-4">
                    <div className="relative">
                        <button
                            className={`p-2 rounded-full ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="设置"
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <Settings className="w-6 h-6" />
                        </button>

                        {/* Settings Popover */}
                        {showSettings && (
                            <div className="absolute right-0 top-12 w-72 bg-slate-800 text-white rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
                                <div className="text-sm font-bold mb-4 text-gray-300">问题类型</div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                                                <span className="text-lg">☰</span>
                                            </div>
                                            <span className="font-medium">多项选择</span>
                                        </div>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, mc: !s.mc }))}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.mc ? 'bg-primary' : 'bg-slate-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.mc ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                                                <span className="text-lg">✎</span>
                                            </div>
                                            <span className="font-medium">书面问题</span>
                                        </div>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, written: !s.written }))}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.written ? 'bg-primary' : 'bg-slate-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.written ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                                                <span className="text-lg">🗂</span>
                                            </div>
                                            <span className="font-medium">单词卡</span>
                                        </div>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, flashcard: !s.flashcard }))}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.flashcard ? 'bg-primary' : 'bg-slate-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.flashcard ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                                    <button className="text-primary text-sm font-bold hover:text-primary-light">查看所有选项</button>
                                    <button
                                        onClick={async () => {
                                            if (confirm('确定要重置学习进度吗？这将清除所有术语的学习状态。')) {
                                                try {
                                                    await api.post(`/learning/${id}/reset`, {});
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error("Failed to reset progress", err);
                                                }
                                            }
                                        }}
                                        className="block w-full mt-3 text-red-400 text-sm font-bold hover:text-red-300"
                                    >
                                        重置学习进度
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => navigate(`/set/${id}`)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="关闭">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-gray" onClick={() => setShowSettings(false)}>

                {/* Question Card */}
                <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-12 mb-8 relative min-h-[200px] flex flex-col justify-center">
                    <div className="absolute top-6 left-6 text-gray-500 text-sm font-medium flex items-center gap-2">
                        术语 <Volume2 className="w-4 h-4 cursor-pointer hover:text-primary" />
                    </div>
                    <h2 className="text-4xl text-center font-serif text-gray-800">
                        {questionType === 'flashcard' && isFlipped ? currentTerm.definition : currentTerm.term}
                    </h2>
                    {questionType === 'flashcard' && (
                        <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-50/50 transition-colors rounded-xl"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFlipped(!isFlipped);
                            }}
                        >
                            {!isFlipped && <div className="text-gray-400 text-sm mt-32">点击翻转</div>}
                        </div>
                    )}
                </div>

                {/* Answer Section */}
                <div className="w-full max-w-3xl">
                    {questionType === 'written' && (
                        // Written Question
                        <div className="space-y-4">
                            <div className="text-gray-500 font-medium mb-2">输入定义</div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAnswer(typedAnswer);
                                }}
                                className="relative"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={typedAnswer}
                                    onChange={(e) => setTypedAnswer(e.target.value)}
                                    disabled={showFeedback}
                                    className={`w-full p-4 text-lg border-2 rounded-xl focus:outline-none transition-colors ${showFeedback
                                        ? isCorrect
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                            : "border-red-500 bg-red-50 text-red-900"
                                        : "border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        }`}
                                    placeholder="输入答案..."
                                />
                                {!showFeedback && (
                                    <button
                                        type="submit"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200"
                                    >
                                        回答
                                    </button>
                                )}
                            </form>

                            {showFeedback && !isCorrect && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <X className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">正确答案</div>
                                            <div className="text-lg font-medium text-gray-900">{currentTerm.definition}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">您说</div>
                                            <div className="text-lg font-medium text-gray-500 line-through">{typedAnswer}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleContinue}
                                        className="w-full mt-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark"
                                    >
                                        继续
                                    </button>
                                </div>
                            )}
                            {showFeedback && isCorrect && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={handleContinue}
                                        className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                                    >
                                        继续
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {questionType === 'mc' && (
                        // Multiple Choice
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {options.map((opt, idx) => {
                                let btnClass = "bg-white border border-gray-200 hover:border-primary hover:bg-gray-50 text-gray-700";

                                if (showFeedback) {
                                    if (opt === currentTerm.definition) {
                                        btnClass = "bg-emerald-50 border-emerald-500 text-emerald-700";
                                    } else if (opt === selectedAnswer && !isCorrect) {
                                        btnClass = "bg-red-50 border-red-500 text-red-700";
                                    } else {
                                        btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(opt)}
                                        disabled={showFeedback}
                                        className={`p-6 rounded-xl text-left transition-all duration-200 text-lg font-medium flex items-center justify-between group ${btnClass} shadow-sm`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${showFeedback && opt === currentTerm.definition ? 'border-emerald-500 bg-emerald-100' : 'border-gray-200 bg-gray-50 group-hover:bg-white'
                                                }`}>
                                                {idx + 1}
                                            </span>
                                            {opt}
                                        </div>

                                        {showFeedback && opt === currentTerm.definition && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                                        {showFeedback && opt === selectedAnswer && !isCorrect && <AlertCircle className="w-6 h-6 text-red-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {questionType === 'flashcard' && isFlipped && !showFeedback && (
                        // Flashcard Self-Grading
                        <div className="flex gap-4 justify-center mt-8 animate-in fade-in slide-in-from-bottom-4">
                            <button
                                onClick={() => handleFlashcardGrade(false)}
                                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all w-40"
                            >
                                仍需学习
                            </button>
                            <button
                                onClick={() => handleFlashcardGrade(true)}
                                className="px-8 py-4 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition-all w-40"
                            >
                                我知道了
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-between w-full max-w-3xl">
                    <button className="text-gray-400 hover:text-gray-600 font-medium text-sm">
                        选项
                    </button>
                    <button
                        onClick={() => handleAnswer("unknown")}
                        className="text-primary font-bold text-sm hover:underline"
                    >
                        不知道？
                    </button>
                </div>

            </div>
        </div>
    );
};
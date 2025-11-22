import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    X,
    Settings,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Shuffle,
    Maximize2,
    RotateCcw,
    Volume2,
    Star,
    Sparkles,
    Loader2,
    Lightbulb
} from 'lucide-react';
import { api } from '../utils/api';
import { StudySet, Term } from '../types';
import { GoogleGenAI } from "@google/genai";

export const FlashcardMode: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [studySet, setStudySet] = useState<StudySet | null>(null);
    const [terms, setTerms] = useState<Term[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [originalTerms, setOriginalTerms] = useState<Term[]>([]);

    // Mnemonic state
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);

    const autoPlayTimeout = useRef<number | null>(null);

    useEffect(() => {
        const fetchSet = async () => {
            try {
                const data = await api.get<any>(`/study-sets/${id}`);
                const preparedTerms: Term[] = (data.terms || []).map((term: any, index: number) => ({
                    id: term.id,
                    term: term.term,
                    definition: term.definition,
                    imageUrl: term.image_url,
                    status: term.status || 'not_started',
                    order: term.order ?? index,
                    starred: term.starred,
                }));

                setStudySet(data);
                setTerms(preparedTerms);
                setOriginalTerms(preparedTerms);
            } catch (err) {
                console.error('Failed to load study set', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSet();
    }, [id]);

    // Reset state on card change
    useEffect(() => {
        setIsFlipped(false);
        setMnemonic(null);
        setIsGeneratingMnemonic(false);

        if (isAutoPlaying) {
            speakCurrentCard();
        }
    }, [currentIndex]);

    const currentTerm = terms[currentIndex];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % terms.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + terms.length) % terms.length);
    };

    const toggleShuffle = () => {
        if (isShuffled) {
            setTerms([...originalTerms]);
        } else {
            setTerms([...terms].sort(() => Math.random() - 0.5));
        }
        setIsShuffled(!isShuffled);
        setCurrentIndex(0);
    };

    const toggleAutoPlay = () => {
        setIsAutoPlaying(!isAutoPlaying);
    };

    const speakCurrentCard = () => {
        if (!currentTerm || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const termUtterance = new SpeechSynthesisUtterance(currentTerm.term);

        termUtterance.onend = () => {
            setTimeout(() => {
                const defUtterance = new SpeechSynthesisUtterance(currentTerm.definition);
                defUtterance.onend = () => {
                    if (isAutoPlaying) {
                        setTimeout(handleNext, 2000);
                    }
                };
                window.speechSynthesis.speak(defUtterance);
            }, 1000);
        };

        window.speechSynthesis.speak(termUtterance);
    };

    // Stop autoplay when component unmounts or autoplay is toggled off
    useEffect(() => {
        if (!isAutoPlaying) {
            window.speechSynthesis.cancel();
        }
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [isAutoPlaying]);

    const handlePlayAudio = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const generateMnemonic = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (mnemonic || isGeneratingMnemonic || !currentTerm) return;

        setIsGeneratingMnemonic(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `你是Monday的好朋友。请为一年级生字“${currentTerm.term}”（读音/释义：${currentTerm.definition}）想一个超级有趣的联想记忆法或者顺口溜。要简短（20字以内），好玩，容易记。`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setMnemonic(response.text?.trim() || "暂无助记");
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingMnemonic(false);
        }
    };

    const handleToggleStar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentTerm) return;

        // Optimistic update
        const updatedTerms = [...terms];
        updatedTerms[currentIndex] = { ...currentTerm, starred: !currentTerm.starred };
        setTerms(updatedTerms);

        try {
            await api.patch(`/study-sets/terms/${currentTerm.id}/star`);
        } catch (err) {
            // Revert
            updatedTerms[currentIndex] = { ...currentTerm, starred: currentTerm.starred };
            setTerms(updatedTerms);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                setIsFlipped(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [terms]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-gray dark:bg-[#0a092d]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
        );
    }

    if (!currentTerm) return null;

    return (
        <div className="min-h-screen bg-bg-gray dark:bg-[#0a092d] flex flex-col">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-[#15143c] border-b border-gray-200 dark:border-white/10 px-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-700 dark:text-indigo-300 font-bold text-sm cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
                        单词卡
                    </div>
                </div>

                <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{currentIndex + 1} / {terms.length}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{studySet?.title}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => navigate(`/set/${id}`)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <div
                    className="w-full max-w-4xl aspect-[4/3] md:aspect-[16/9] perspective-1000 relative cursor-pointer group"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={`w-full h-full transition-transform duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>

                        {/* Front Face */}
                        <div className="absolute inset-0 bg-white dark:bg-[#15143c] rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 backface-hidden flex flex-col items-center justify-center p-8 md:p-16 hover:shadow-2xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all">
                            <div className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider">
                                <Lightbulb className="w-4 h-4" />
                                显示提示
                            </div>

                            <div className="absolute top-6 right-6 flex gap-3">
                                <button
                                    onClick={(e) => handlePlayAudio(e, currentTerm.term)}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleToggleStar}
                                    className={`p-2 rounded-full transition-colors ${currentTerm.starred ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                                >
                                    <Star className={`w-5 h-5 ${currentTerm.starred ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            <div className="text-center space-y-6">
                                <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white font-serif">
                                    {currentTerm.term}
                                </h2>

                                {/* Mnemonic Button/Display */}
                                <div onClick={e => e.stopPropagation()}>
                                    {!mnemonic && !isGeneratingMnemonic && (
                                        <button
                                            onClick={generateMnemonic}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            AI 助记
                                        </button>
                                    )}
                                    {isGeneratingMnemonic && (
                                        <div className="flex items-center gap-2 text-indigo-500 text-sm font-medium">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            正在生成...
                                        </div>
                                    )}
                                    {mnemonic && (
                                        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-800 dark:text-indigo-200 text-lg font-medium max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
                                            ✨ {mnemonic}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-indigo-600 text-white flex items-center justify-center text-sm font-bold rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                                单击翻转卡片
                            </div>
                        </div>

                        {/* Back Face */}
                        <div className="absolute inset-0 bg-white dark:bg-[#15143c] rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 md:p-16 hover:shadow-2xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all">
                            <div className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider">
                                定义
                            </div>

                            <div className="absolute top-6 right-6 flex gap-3">
                                <button
                                    onClick={(e) => handlePlayAudio(e, currentTerm.definition)}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleToggleStar}
                                    className={`p-2 rounded-full transition-colors ${currentTerm.starred ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                                >
                                    <Star className={`w-5 h-5 ${currentTerm.starred ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            <div className="text-center">
                                <h2 className="text-3xl md:text-5xl font-medium text-gray-800 dark:text-gray-100">
                                    {currentTerm.definition}
                                </h2>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-indigo-600 text-white flex items-center justify-center text-sm font-bold rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                                单击翻转卡片
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Controls */}
            <footer className="h-20 bg-white dark:bg-[#15143c] border-t border-gray-200 dark:border-white/10 px-4 md:px-8 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleAutoPlay}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-colors ${isAutoPlaying ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'}`}
                    >
                        {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        <span className="hidden md:inline">{isAutoPlaying ? '暂停' : '播放'}</span>
                    </button>

                    <button
                        onClick={toggleShuffle}
                        className={`p-2 rounded-full transition-colors ${isShuffled ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}
                        title="随机播放"
                    >
                        <Shuffle className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={handlePrev}
                        className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-200 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

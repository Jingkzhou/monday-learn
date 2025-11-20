import React, { useState, useEffect } from 'react';
import { Term } from '../types';
import { Volume2, Star, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface FlashcardProps {
  term: Term;
  total: number;
  current: number;
  onNext: () => void;
  onPrev: () => void;
  onToggleStar: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ term, total, current, onNext, onPrev, onToggleStar }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset flip state and mnemonic when the term changes
  useEffect(() => {
    setIsFlipped(false);
    setMnemonic(null);
    setIsGenerating(false);
  }, [term.id]);

  // Handle keyboard interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent interference with input fields if they exist on the page
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case ' ':
        case 'Spacebar': // For older browsers
          e.preventDefault(); // Prevent page scrolling
          setIsFlipped(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, onPrev]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      // Optional: You could set lang here if available in Term, e.g. utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateMnemonic = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (mnemonic || isGenerating) return;

    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Contextual prompt for a child named Monday
        const prompt = `你是Monday的好朋友。请为一年级生字“${term.term}”（读音/释义：${term.definition}）想一个超级有趣的联想记忆法或者顺口溜。要简短（20字以内），好玩，容易记。`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        setMnemonic(response.text?.trim() || "暂无助记");
    } catch (err) {
        console.error(err);
    } finally {
        setIsGenerating(false);
    }
  };

  const renderMnemonicSection = () => (
      <div className="mt-6 min-h-[3rem] flex items-center justify-center w-full px-6 z-20" onClick={(e) => e.stopPropagation()}>
        {!mnemonic && !isGenerating && (
            <button 
                onClick={generateMnemonic}
                className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-600 text-xs font-bold hover:from-indigo-100 hover:to-purple-100 transition-all shadow-sm hover:shadow-md"
            >
                <Sparkles className="w-3 h-3 group-hover:animate-pulse" /> 
                AI 魔法助记
            </button>
        )}
        {isGenerating && (
             <span className="text-xs text-indigo-400 flex items-center gap-2 font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-indigo-50">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> 
                正在施展魔法...
             </span>
        )}
        {mnemonic && (
            <div className="text-sm text-indigo-700 font-medium text-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-3 rounded-xl border border-indigo-100 shadow-sm animate-in zoom-in-95 duration-300 relative max-w-[90%]">
                <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1.5 -left-1.5 bg-white rounded-full shadow-sm" />
                {mnemonic}
            </div>
        )}
    </div>
  );

  const progressPercentage = (current / total) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Visual Progress Indicator */}
      <div className="mb-6 flex items-center justify-between px-1 gap-4">
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
          </div>
          <span className="text-xs font-bold text-gray-400 min-w-[3rem] text-right">
            {current} / {total}
          </span>
      </div>

      <div className="perspective-1000 h-[400px] relative group cursor-pointer" onClick={handleCardClick}>
        <div 
            className={`w-full h-full transition-transform duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}
        >
            {/* Front Face */}
            <div className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-md border-b-4 border-gray-200 hover:border-primary transition-colors duration-200 backface-hidden flex flex-col">
                <div className="absolute top-4 left-4 text-gray-400 text-sm font-medium">
                    术语
                </div>
                
                <div className="absolute top-4 right-4 flex gap-3 z-10">
                    <button 
                    className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${term.starred ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600'}`} 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar();
                    }}
                    title={term.starred ? "取消星标" : "标记星号"}
                    >
                        <Star className={`w-5 h-5 ${term.starred ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors rounded-full" 
                    onClick={(e) => handlePlayAudio(e, term.term)}
                    title="播放音频"
                    >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-8 gap-2">
                    <span className="text-4xl md:text-5xl text-gray-800 font-serif text-center select-none">
                        {term.term}
                    </span>
                    {renderMnemonicSection()}
                </div>

                <div className="absolute bottom-4 w-full text-center text-gray-400 text-sm">
                    点击翻转
                </div>
            </div>

            {/* Back Face */}
            <div className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-md border-b-4 border-gray-200 hover:border-primary transition-colors duration-200 backface-hidden rotate-y-180 flex flex-col">
                 <div className="absolute top-4 left-4 text-gray-400 text-sm font-medium">
                    定义
                </div>
                
                <div className="absolute top-4 right-4 flex gap-3 z-10">
                    <button 
                    className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${term.starred ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600'}`} 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar();
                    }}
                    title={term.starred ? "取消星标" : "标记星号"}
                    >
                        <Star className={`w-5 h-5 ${term.starred ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors rounded-full" 
                    onClick={(e) => handlePlayAudio(e, term.definition)}
                    title="播放音频"
                    >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-8 gap-2">
                    <span className="text-4xl md:text-5xl text-gray-800 font-serif text-center select-none">
                        {term.definition}
                    </span>
                    {renderMnemonicSection()}
                </div>

                <div className="absolute bottom-4 w-full text-center text-gray-400 text-sm">
                    点击翻转
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
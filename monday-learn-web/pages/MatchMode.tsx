
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SET } from '../constants';
import { Term } from '../types';
import { X, Trophy, RotateCcw, Settings, Volume2, VolumeX, Timer, Hourglass, Clock } from 'lucide-react';

interface MatchCard {
  id: string;
  termId: string;
  content: string;
  type: 'term' | 'definition';
  state: 'default' | 'selected' | 'matched' | 'mismatch';
}

type TimerMode = 'stopwatch' | 'countdown';

export const MatchMode: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [gameStatus, setGameStatus] = useState<'intro' | 'playing' | 'finished' | 'timeout'>('intro');
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Timer Settings
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [countdownDuration, setCountdownDuration] = useState<number>(60); // Seconds
  const [showSettings, setShowSettings] = useState(false);

  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Initialize Audio Context
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Close settings on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const playSound = (type: 'select' | 'match' | 'mismatch' | 'start' | 'finish' | 'timeout') => {
    if (isMuted) return;

    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'select':
          // Short blip
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, now);
          oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
        case 'match':
          // Pleasant chime
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          
          // Second harmony note
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
          gain2.gain.setValueAtTime(0.05, now + 0.1);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc2.start(now + 0.1);
          osc2.stop(now + 0.4);
          break;
        case 'mismatch':
          // Low buzz
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(150, now);
          oscillator.frequency.linearRampToValueAtTime(100, now + 0.2);
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
        case 'start':
          // Rising sweep
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(220, now);
          oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.5);
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;
        case 'finish':
          // Victory arpeggio
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.05, now + (i * 0.1));
            g.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.1) + 1.0);
            o.start(now + (i * 0.1));
            o.stop(now + (i * 0.1) + 1.0);
          });
          break;
        case 'timeout':
           // Descending failure sound
           oscillator.type = 'sawtooth';
           oscillator.frequency.setValueAtTime(400, now);
           oscillator.frequency.linearRampToValueAtTime(100, now + 0.5);
           gainNode.gain.setValueAtTime(0.1, now);
           gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
           oscillator.start(now);
           oscillator.stop(now + 0.5);
           break;
      }
    } catch (e) {
      console.error("Audio play error", e);
    }
  };

  const initializeGame = () => {
    playSound('start');
    const termsToUse = [...MOCK_SET.terms]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

    const newCards: MatchCard[] = [];
    termsToUse.forEach(term => {
      newCards.push({
        id: `${term.id}-term`,
        termId: term.id,
        content: term.term,
        type: 'term',
        state: 'default'
      });
      newCards.push({
        id: `${term.id}-def`,
        termId: term.id,
        content: term.definition,
        type: 'definition',
        state: 'default'
      });
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setGameStatus('playing');
    setStartTime(Date.now());
    
    if (timerMode === 'stopwatch') {
        setCurrentTime(0);
    } else {
        setCurrentTime(countdownDuration * 1000);
    }

    setSelectedCardIds([]);
    setIsProcessing(false);
  };

  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        
        if (timerMode === 'stopwatch') {
            setCurrentTime(now - startTime);
        } else {
            const elapsed = now - startTime;
            const remaining = (countdownDuration * 1000) - elapsed;
            
            if (remaining <= 0) {
                setCurrentTime(0);
                setGameStatus('timeout');
                playSound('timeout');
            } else {
                setCurrentTime(remaining);
            }
        }
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, startTime, timerMode, countdownDuration]);

  useEffect(() => {
    if (gameStatus === 'playing' && cards.length > 0) {
      const allMatched = cards.every(c => c.state === 'matched');
      if (allMatched) {
        setGameStatus('finished');
        playSound('finish');
      }
    }
  }, [cards, gameStatus]);

  const handleCardClick = (clickedCard: MatchCard) => {
    if (
      gameStatus !== 'playing' || 
      isProcessing || 
      clickedCard.state === 'matched' || 
      clickedCard.state === 'selected'
    ) {
      return;
    }

    playSound('select');

    const newSelectedIds = [...selectedCardIds, clickedCard.id];
    setSelectedCardIds(newSelectedIds);
    
    setCards(prev => prev.map(c => 
      c.id === clickedCard.id ? { ...c, state: 'selected' } : c
    ));

    if (newSelectedIds.length === 2) {
      setIsProcessing(true);
      const firstCardId = newSelectedIds[0];
      const secondCardId = newSelectedIds[1];
      
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = clickedCard;

      if (firstCard && secondCard) {
        if (firstCard.termId === secondCard.termId) {
          setTimeout(() => {
            playSound('match');
            setCards(prev => prev.map(c => 
              newSelectedIds.includes(c.id) ? { ...c, state: 'matched' } : c
            ));
            setSelectedCardIds([]);
            setIsProcessing(false);
          }, 200);
        } else {
          setTimeout(() => {
            playSound('mismatch');
            setCards(prev => prev.map(c => 
              newSelectedIds.includes(c.id) ? { ...c, state: 'mismatch' } : c
            ));

            setTimeout(() => {
              setCards(prev => prev.map(c => 
                newSelectedIds.includes(c.id) ? { ...c, state: 'default' } : c
              ));
              setSelectedCardIds([]);
              setIsProcessing(false);
            }, 800);
          }, 200);
        }
      }
    }
  };

  const formatTime = (ms: number) => (Math.max(0, ms) / 1000).toFixed(1);

  return (
    <div className="h-screen w-screen bg-bg-gray flex flex-col overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="flex-none bg-white px-4 py-3 flex items-center justify-between shadow-sm z-20 h-16 border-b border-gray-200">
        <div className="flex-1">
             <button 
                onClick={() => navigate(`/set/${id}`)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="flex-1 flex justify-center">
             <div className={`text-2xl font-bold flex items-center gap-1 font-mono ${timerMode === 'countdown' && currentTime < 10000 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                {gameStatus === 'intro' 
                    ? (timerMode === 'stopwatch' ? '0.0' : `${countdownDuration}.0`) 
                    : formatTime(currentTime)
                } 
                <span className="text-sm font-bold text-gray-400 mt-1">秒</span>
             </div>
        </div>

        <div className="flex-1 flex justify-end gap-2">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                title={isMuted ? "开启声音" : "静音"}
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            {/* Settings Toggle */}
            <div className="relative" ref={settingsRef}>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-indigo-50 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <Settings className="w-5 h-5" />
                </button>
                
                {showSettings && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> 游戏设置
                        </h3>
                        
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">计时模式</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => { setTimerMode('stopwatch'); setGameStatus('intro'); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${timerMode === 'stopwatch' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Timer className="w-4 h-4" /> 正计时
                                </button>
                                <button 
                                    onClick={() => { setTimerMode('countdown'); setGameStatus('intro'); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${timerMode === 'countdown' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Hourglass className="w-4 h-4" /> 倒计时
                                </button>
                            </div>
                        </div>

                        {timerMode === 'countdown' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">时间限制 (秒)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[30, 60, 90].map(sec => (
                                        <button
                                            key={sec}
                                            onClick={() => { setCountdownDuration(sec); setGameStatus('intro'); }}
                                            className={`py-2 text-sm font-bold rounded-md border transition-all ${countdownDuration === sec ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {sec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Game Area - Fills remaining space */}
      <div className="flex-1 relative p-2 md:p-4 flex items-center justify-center w-full h-full">
        
        {gameStatus === 'intro' && (
            <div className="text-center animate-in fade-in zoom-in duration-300">
                <h1 className="text-4xl font-black text-gray-800 mb-6">准备好了吗？</h1>
                <div className="mb-8 inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600">
                    {timerMode === 'stopwatch' ? <Timer className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                    模式: {timerMode === 'stopwatch' ? '正计时挑战' : `限时 ${countdownDuration} 秒`}
                </div>
                <br />
                <button 
                    onClick={initializeGame}
                    className="bg-primary text-white text-xl font-bold py-4 px-12 rounded-xl hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    开始游戏
                </button>
                <p className="mt-4 text-gray-500 font-medium">匹配所有术语和定义</p>
            </div>
        )}

        {/* Playing Grid - Responsive 4x3 (Desktop) or 3x4 (Mobile) */}
        {gameStatus === 'playing' && (
             <div className="w-full max-w-6xl h-full flex flex-col">
                 <div className="grid grid-cols-3 grid-rows-4 md:grid-cols-4 md:grid-rows-3 gap-2 md:gap-4 h-full w-full">
                    {cards.map((card) => {
                        let baseStyles = "w-full h-full rounded-xl p-2 md:p-4 flex items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-sm border-2 select-none font-medium break-words";
                        let stateStyles = "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-700";
                        let textClass = "text-sm sm:text-base md:text-xl"; // Responsive text size

                        // Quizlet Visual Styles
                        if (card.state === 'selected') {
                            stateStyles = "bg-blue-50 border-blue-500 text-blue-800 shadow-md";
                        } else if (card.state === 'matched') {
                            stateStyles = "bg-green-50 border-green-500 text-green-800 opacity-0 pointer-events-none transform scale-90";
                        } else if (card.state === 'mismatch') {
                            stateStyles = "bg-red-50 border-red-500 text-red-800 animate-shake";
                        }

                        return (
                            <div 
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                className={`${baseStyles} ${stateStyles} ${textClass}`}
                            >
                                {card.content}
                            </div>
                        );
                    })}
                 </div>
             </div>
        )}

        {(gameStatus === 'finished' || gameStatus === 'timeout') && (
            <div className="text-center max-w-md animate-in fade-in zoom-in duration-500 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${gameStatus === 'finished' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                    {gameStatus === 'finished' ? <Trophy className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
                </div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {gameStatus === 'finished' ? '干得好！' : '时间到！'}
                </div>
                <h1 className={`text-5xl font-black mb-2 ${gameStatus === 'finished' ? 'text-primary' : 'text-gray-800'}`}>
                    {gameStatus === 'finished' ? formatTime(currentTime) : '0.0'} 
                    <span className="text-2xl font-bold text-gray-500"> 秒</span>
                </h1>
                <p className="text-gray-500 mb-8">
                    {gameStatus === 'finished' ? '你完成了所有配对！' : '别灰心，再试一次吧！'}
                </p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={initializeGame}
                        className="bg-primary text-white text-lg font-bold py-3 px-8 rounded-xl hover:bg-primary-dark shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" /> 再玩一次
                    </button>
                    <button 
                        onClick={() => navigate(`/set/${id}`)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-lg font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        返回学习集
                    </button>
                </div>
            </div>
        )}

      </div>
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

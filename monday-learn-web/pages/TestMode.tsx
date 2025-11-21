
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SET } from '../constants';
import { Term } from '../types';
import { X, Settings, CheckCircle, XCircle, FileText, ListChecks, ToggleLeft, RotateCcw, AlertCircle, Filter, ChevronDown, Check, Pencil, Keyboard, Eraser, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { api } from '../utils/api';

type QuestionType = 'written' | 'multiple-choice' | 'true-false';

interface Question {
  id: string;
  type: QuestionType;
  term: Term;
  prompt: string; // The text shown to user (Term or Definition)
  correctAnswer: string;
  options?: string[]; // For MC
  tfstatement?: string; // For TF
}

// --- Helper Component: Handwriting Canvas ---
interface HandwritingCanvasProps {
  onRecognize: (text: string) => void;
  isRecognizing: boolean;
}

const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({ onRecognize, isRecognizing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match visual size for high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2e3db2'; // primary-dark
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent scrolling on touch devices when drawing
    if ('touches' in e) e.preventDefault();
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e) e.preventDefault();

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasStrokes(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Use internal width/height
        setHasStrokes(false);
    }
  };

  const handleRecognize = async () => {
      if (!canvasRef.current || !hasStrokes) return;
      
      // Get Base64
      const base64Data = canvasRef.current.toDataURL('image/png').split(',')[1];
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: base64Data
                    }
                },
                {
                    text: "Identify the handwritten number, math answer, or Chinese character in this image. Return ONLY the result text/number. If it's a math equation, solve it and return the answer."
                }
            ]
          });
          
          if (response.text) {
              onRecognize(response.text.trim());
          }
      } catch (error) {
          console.error("Recognition failed", error);
          alert("识别失败，请重试");
      }
  };

  return (
    <div className="flex flex-col gap-2">
        <div className="relative w-full h-48 bg-white border-2 border-dashed border-indigo-200 rounded-xl overflow-hidden shadow-inner cursor-crosshair touch-none">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            {!hasStrokes && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-indigo-200 select-none">
                    <span className="text-lg font-medium">在此手写答案...</span>
                </div>
            )}
        </div>
        <div className="flex justify-between items-center">
            <button 
                onClick={clearCanvas}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
                <Eraser className="w-4 h-4" /> 清除
            </button>
            <button 
                onClick={handleRecognize}
                disabled={!hasStrokes || isRecognizing}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm flex items-center gap-2 font-bold transition-all ${!hasStrokes || isRecognizing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}
            >
                {isRecognizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isRecognizing ? '识别中...' : '确认手写'}
            </button>
        </div>
    </div>
  );
};

// --- Main Component ---

export const TestMode: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Handwriting Mode State
  const [inputModes, setInputModes] = useState<Record<string, 'keyboard' | 'handwriting'>>({});
  const [recognizingIds, setRecognizingIds] = useState<string[]>([]);

  // New state for question type selection
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['written', 'multiple-choice', 'true-false']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Reset state when generating new test
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setInputModes({});

    // Generate questions based on selected types
    const allTerms = [...MOCK_SET.terms];
    allTerms.sort(() => Math.random() - 0.5);
    
    const q: Question[] = [];
    
    if (allTerms.length > 0 && selectedTypes.length > 0) {
        let currentIndex = 0;
        const totalTerms = allTerms.length;
        const typesCount = selectedTypes.length;
        const baseCount = Math.floor(totalTerms / typesCount);
        const remainder = totalTerms % typesCount;

        selectedTypes.forEach((type, typeIndex) => {
             // Distribute remainder to first few types to ensure all terms are used
             const count = baseCount + (typeIndex < remainder ? 1 : 0);
             const termsForType = allTerms.slice(currentIndex, currentIndex + count);
             currentIndex += count;

             termsForType.forEach((term, idx) => {
                 if (type === 'written') {
                     q.push({
                         id: `written-${term.id}`,
                         type: 'written',
                         term: term,
                         prompt: term.definition, 
                         correctAnswer: term.term
                     });
                 } else if (type === 'multiple-choice') {
                    const distractions = MOCK_SET.terms
                        .filter(t => t.id !== term.id)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3)
                        .map(t => t.definition);
                    
                    const opts = [...distractions, term.definition].sort(() => Math.random() - 0.5);

                    q.push({
                       id: `mc-${term.id}`,
                       type: 'multiple-choice',
                       term: term,
                       prompt: term.term, 
                       correctAnswer: term.definition,
                       options: opts
                    });
                 } else if (type === 'true-false') {
                    const isCorrect = Math.random() > 0.5;
                    let statement = term.definition;
                    
                    if (!isCorrect) {
                         const randomOther = MOCK_SET.terms.find(t => t.id !== term.id);
                         if (randomOther) statement = randomOther.definition;
                    }

                    q.push({
                       id: `tf-${term.id}`,
                       type: 'true-false',
                       term: term,
                       prompt: term.term, 
                       correctAnswer: isCorrect ? 'true' : 'false',
                       tfstatement: statement
                    });
                 }
             });
        });
    }

    setQuestions(q);
  }, [id, selectedTypes]);

  const handleAnswer = (qId: string, val: string) => {
      if (isSubmitted) return;
      setAnswers(prev => ({...prev, [qId]: val}));
  }

  const toggleInputMode = (qId: string, mode: 'keyboard' | 'handwriting') => {
      setInputModes(prev => ({...prev, [qId]: mode}));
  };

  const handleHandwritingRecognized = (qId: string, text: string) => {
      handleAnswer(qId, text);
      setRecognizingIds(prev => prev.filter(id => id !== qId));
      // Optionally switch back to keyboard mode to show the result clearly
      // toggleInputMode(qId, 'keyboard'); 
  };

  const startRecognition = (qId: string) => {
      setRecognizingIds(prev => [...prev, qId]);
  };

  const logTestAttempts = async (finalScore: number) => {
      if (!id) return;

      await Promise.all(questions.map(async (q) => {
          const userAnsRaw = answers[q.id] ?? '';
          const userAns = userAnsRaw.trim();
          const correctAns = q.correctAnswer.trim();
          const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();

          const question_type = q.type === 'multiple-choice'
              ? 'multiple_choice'
              : q.type === 'true-false'
                  ? 'true_false'
                  : 'written';

          try {
              await api.post(`/learning/${id}/log`, {
                  term_id: Number(q.term.id),
                  mode: 'test',
                  question_type,
                  is_correct: isCorrect,
                  user_answer: userAns,
                  expected_answer: correctAns,
                  source: 'test_mode',
              });
          } catch (err) {
              console.error("Failed to record test log", err);
          }
      }));
  }

  const handleSubmit = async () => {
      let correctCount = 0;
      questions.forEach(q => {
          const userAns = answers[q.id]?.trim().toLowerCase();
          const correctAns = q.correctAnswer.trim().toLowerCase();
          if (userAns === correctAns) correctCount++;
      });
      
      const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      setScore(finalScore);
      setIsSubmitted(true);
      window.scrollTo(0,0);

      await logTestAttempts(finalScore);
  }

  const toggleType = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
        if (selectedTypes.length > 1) {
            setSelectedTypes(prev => prev.filter(t => t !== type));
        }
    } else {
        setSelectedTypes(prev => [...prev, type]);
    }
  };

  const getTypeLabel = (type: QuestionType) => {
      switch(type) {
          case 'written': return '书写题';
          case 'multiple-choice': return '选择题';
          case 'true-false': return '判断题';
      }
  };

  return (
     <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <div className="text-primary text-xs font-bold uppercase tracking-wider">测试</div>
                    <h1 className="font-bold text-gray-900 text-lg hidden sm:block">{MOCK_SET.title}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                 <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-md text-sm font-medium text-gray-700 transition-all shadow-sm"
                    >
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="hidden sm:inline">题型选择</span>
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                包含题型
                            </div>
                            {(['written', 'multiple-choice', 'true-false'] as QuestionType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <span>{getTypeLabel(type)}</span>
                                    {selectedTypes.includes(type) && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>

                 <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="设置">
                    <Settings className="w-6 h-6" />
                </button>
                <button onClick={() => navigate(`/set/${id}`)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="关闭">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Score Display - Visible after submission */}
        {isSubmitted && (
            <div className="max-w-3xl mx-auto mt-8 p-8 bg-white rounded-xl border border-gray-200 shadow-lg text-center mx-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">你的分数</div>
                <div className="text-6xl font-black text-primary mb-4">{score}%</div>
                <div className="text-gray-700 font-medium mb-8 text-lg">
                    {score === 100 ? "太棒了！满分！🎉" : 
                        score >= 80 ? "做得好！表现不错。🌟" :
                        "继续练习！你会成功的。💪"}
                </div>
                
                <button 
                    onClick={() => window.location.reload()} 
                    className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-primary-dark transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 mx-auto"
                >
                    <RotateCcw className="w-5 h-5" /> 开始新测试
                </button>
            </div>
        )}

        <div className="max-w-3xl mx-auto mt-8 px-4 space-y-8">
            
            {/* Written Section */}
            {questions.some(q => q.type === 'written') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" /> 书写题
                    </h2>
                    {questions.filter(q => q.type === 'written').map((q, i) => {
                        const isCorrect = answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                        const mode = inputModes[q.id] || 'keyboard';
                        const isRecognizing = recognizingIds.includes(q.id);
                        
                        return (
                        <div key={q.id} className={`bg-white p-6 rounded-lg border shadow-sm transition-colors ${isSubmitted ? (isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30') : 'border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-sm text-gray-400 font-bold mb-2">定义</div>
                                    <div className="text-lg text-gray-800">{q.prompt}</div>
                                </div>
                                
                                {/* Input Mode Toggle */}
                                {!isSubmitted && (
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button 
                                            onClick={() => toggleInputMode(q.id, 'keyboard')}
                                            className={`p-1.5 rounded-md transition-colors ${mode === 'keyboard' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="键盘输入"
                                        >
                                            <Keyboard className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => toggleInputMode(q.id, 'handwriting')}
                                            className={`p-1.5 rounded-md transition-colors ${mode === 'handwriting' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="手写输入"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="relative">
                                {mode === 'keyboard' || isSubmitted ? (
                                    <>
                                        <input 
                                            type="text" 
                                            placeholder="输入答案..."
                                            className={`w-full p-3 border-b-2 outline-none bg-gray-50 focus:bg-white transition-colors rounded-t-md ${
                                                isSubmitted 
                                                    ? isCorrect 
                                                        ? "border-emerald-500 text-emerald-700 font-bold bg-white" 
                                                        : "border-red-500 text-red-700 bg-white"
                                                    : "border-gray-300 focus:border-primary"
                                            }`}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                                            disabled={isSubmitted}
                                        />
                                        {isSubmitted && (
                                            <div className="absolute right-2 top-3">
                                                {isCorrect ? <CheckCircle className="text-emerald-500 w-6 h-6" /> : <XCircle className="text-red-500 w-6 h-6" />}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                        <HandwritingCanvas 
                                            onRecognize={(text) => {
                                                startRecognition(q.id);
                                                handleHandwritingRecognized(q.id, text);
                                            }} 
                                            isRecognizing={isRecognizing}
                                        />
                                        {answers[q.id] && (
                                            <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 flex items-center justify-between">
                                                <span className="text-sm font-medium">识别结果: <span className="font-bold text-lg ml-2">{answers[q.id]}</span></span>
                                                <button 
                                                    onClick={() => toggleInputMode(q.id, 'keyboard')} 
                                                    className="text-xs bg-white px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100"
                                                >
                                                    修改
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isSubmitted && !isCorrect && (
                                <div className="mt-3 flex items-start gap-2 text-sm">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="text-gray-600">
                                        正确答案： <span className="font-bold text-emerald-600">{q.correctAnswer}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            )}

            {/* Multiple Choice Section */}
            {questions.some(q => q.type === 'multiple-choice') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-gray-400" /> 选择题
                    </h2>
                     {questions.filter(q => q.type === 'multiple-choice').map((q, i) => {
                         const userAns = answers[q.id];
                         const isCorrect = userAns === q.correctAnswer;

                         return (
                         <div key={q.id} className={`bg-white p-6 rounded-lg border shadow-sm ${isSubmitted ? (isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30') : 'border-gray-200'}`}>
                            <div className="text-sm text-gray-400 font-bold mb-2">术语</div>
                            <div className="text-lg text-gray-800 mb-4 font-serif">{q.prompt}</div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {q.options?.map((opt, oIdx) => {
                                    let style = "border-gray-200 hover:border-primary hover:bg-gray-50 text-gray-600";
                                    let icon = null;

                                    if (isSubmitted) {
                                        if (opt === q.correctAnswer) {
                                            style = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-sm";
                                            icon = <CheckCircle className="w-5 h-5 text-emerald-600" />;
                                        } else if (userAns === opt) {
                                            style = "border-red-500 bg-red-50 text-red-800";
                                            icon = <XCircle className="w-5 h-5 text-red-500" />;
                                        } else {
                                            style = "border-gray-100 opacity-40";
                                        }
                                    } else if (userAns === opt) {
                                        style = "border-primary bg-indigo-50 text-primary font-semibold shadow-sm ring-1 ring-primary";
                                    }

                                    return (
                                        <button
                                            key={oIdx}
                                            onClick={() => handleAnswer(q.id, opt)}
                                            disabled={isSubmitted}
                                            className={`p-4 border rounded-lg text-left transition-all relative flex items-center justify-between ${style}`}
                                        >
                                            <span className="text-sm">{opt}</span>
                                            {icon}
                                        </button>
                                    );
                                })}
                            </div>
                            {isSubmitted && !isCorrect && !userAns && (
                                <div className="mt-2 text-sm text-red-500 flex items-center gap-2 font-medium">
                                    <AlertCircle className="w-4 h-4"/> 未作答
                                </div>
                            )}
                         </div>
                     )})}
                </div>
            )}

             {/* True/False Section */}
            {questions.some(q => q.type === 'true-false') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ToggleLeft className="w-5 h-5 text-gray-400" /> 判断题
                    </h2>
                     {questions.filter(q => q.type === 'true-false').map((q, i) => {
                         const userAns = answers[q.id]; // 'true' or 'false'
                         const isQuestionCorrect = userAns === q.correctAnswer;
                         
                         return (
                         <div key={q.id} className={`bg-white p-6 rounded-lg border shadow-sm ${isSubmitted ? (isQuestionCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30') : 'border-gray-200'}`}>
                            <div className="flex flex-col md:flex-row md:gap-8 gap-4">
                                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 pr-0 md:pr-4">
                                     <div className="text-sm text-gray-400 font-bold mb-1">术语</div>
                                     <div className="text-lg text-gray-800 font-serif">{q.prompt}</div>
                                </div>
                                <div className="flex-1">
                                     <div className="text-sm text-gray-400 font-bold mb-1">定义</div>
                                     <div className="text-lg text-gray-800">{q.tfstatement}</div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mt-6">
                                 {['true', 'false'].map((opt) => {
                                     const label = opt === 'true' ? '正确' : '错误';
                                     let style = "border-gray-200 hover:border-gray-400 text-gray-600";
                                     let icon = null;
                                     
                                     if (isSubmitted) {
                                        if (opt === q.correctAnswer) {
                                            style = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm";
                                            icon = <CheckCircle className="w-5 h-5 text-emerald-600 ml-2" />;
                                        }
                                        else if (userAns === opt) {
                                            style = "border-red-500 bg-red-50 text-red-700";
                                            icon = <XCircle className="w-5 h-5 text-red-500 ml-2" />;
                                        }
                                        else {
                                            style = "border-gray-100 opacity-40";
                                        }
                                     } else if (userAns === opt) {
                                         style = "border-primary bg-primary text-white font-bold shadow-md transform scale-[1.02]";
                                     }

                                     return (
                                         <button
                                            key={opt}
                                            onClick={() => handleAnswer(q.id, opt)}
                                            disabled={isSubmitted}
                                            className={`flex-1 py-3 rounded-md border-2 transition-all flex items-center justify-center ${style}`}
                                        >
                                            {label}
                                            {icon}
                                         </button>
                                     )
                                 })}
                            </div>
                         </div>
                     )})}
                </div>
            )}

            {!isSubmitted && questions.length > 0 && (
                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSubmit}
                        className="bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all active:scale-95 w-full md:w-auto text-lg"
                    >
                        提交试卷
                    </button>
                </div>
            )}

            {!isSubmitted && questions.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    没有选择任何题目类型。请在上方选择至少一种题型。
                </div>
            )}
        </div>
     </div>
  );
};

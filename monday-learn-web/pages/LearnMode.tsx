import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SET } from '../constants';
import { Term } from '../types';
import { X, Settings, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';

export const LearnMode: React.FC = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  // In a real app, fetch based on setId. Using mock.
  const terms = MOCK_SET.terms;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentTerm = terms[currentIndex];

  // Generate random options including the correct one
  const options = useMemo(() => {
    const correct = currentTerm.definition;
    const otherTerms = terms.filter(t => t.id !== currentTerm.id);
    // Shuffle and pick 3
    const wrong = otherTerms.sort(() => 0.5 - Math.random()).slice(0, 3).map(t => t.definition);
    return [...wrong, correct].sort(() => 0.5 - Math.random());
  }, [currentTerm, terms]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent multiple clicks

    setSelectedAnswer(answer);
    const correct = answer === currentTerm.definition;
    setIsCorrect(correct);

    setTimeout(() => {
        if (currentIndex < terms.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsCorrect(null);
        } else {
            // End of set logic would go here
            alert("Set completed!");
            navigate(`/set/${setId}`);
        }
    }, 1500);
  };

  const progress = ((currentIndex) / terms.length) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center text-primary font-bold gap-2 cursor-pointer" onClick={() => navigate(-1)}>
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-sm">←</span>
                </div>
                <span>学习</span>
            </div>
        </div>

        <div className="flex-1 flex justify-center">
           {/* Progress segments */}
           <div className="w-full max-w-md h-2 bg-gray-100 rounded-full overflow-hidden flex gap-1">
              <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
           </div>
           <div className="ml-4 font-bold text-gray-600 bg-gray-100 rounded-full px-3 py-1 text-xs">
             {currentIndex} / {terms.length}
           </div>
        </div>

        <div className="flex-1 flex justify-end gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="设置">
                <Settings className="w-6 h-6" />
            </button>
            <button onClick={() => navigate(`/set/${setId}`)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="关闭">
                <X className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-gray">
        
        {/* Question Card */}
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-gray-200 p-12 mb-8 relative min-h-[250px] flex flex-col justify-center">
            <div className="absolute top-6 left-6 text-gray-500 text-sm font-medium flex items-center gap-2">
                术语 <Volume2 className="w-4 h-4 cursor-pointer hover:text-primary" />
            </div>
            <h2 className="text-4xl text-center font-serif text-gray-800">
                {currentTerm.term}
            </h2>
        </div>

        {/* Instruction */}
        <div className="w-full max-w-3xl mb-4 text-gray-500 font-medium">
            选择匹配的定义
        </div>

        {/* Options Grid */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, idx) => {
                let btnClass = "bg-white border border-gray-200 hover:border-primary hover:bg-gray-50 text-gray-700";
                
                if (selectedAnswer) {
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
                        disabled={!!selectedAnswer}
                        className={`p-6 rounded-xl text-left transition-all duration-200 text-lg font-medium flex items-center justify-between group ${btnClass} shadow-sm`}
                    >
                        <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                                selectedAnswer && opt === currentTerm.definition ? 'border-emerald-500 bg-emerald-100' : 'border-gray-200 bg-gray-50 group-hover:bg-white'
                            }`}>
                                {idx + 1}
                            </span>
                            {opt}
                        </div>
                        
                        {selectedAnswer && opt === currentTerm.definition && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                        {selectedAnswer === opt && !isCorrect && <AlertCircle className="w-6 h-6 text-red-500" />}

                    </button>
                );
            })}
        </div>

        <div className="mt-8 flex justify-between w-full max-w-3xl">
             <button className="text-gray-400 hover:text-gray-600 font-medium text-sm">
                选项
             </button>
             <button 
                onClick={() => handleAnswer("unknown")} // Would normally handle "unknown" logic specifically
                className="text-primary font-bold text-sm hover:underline"
             >
                不知道？
             </button>
        </div>

      </div>
    </div>
  );
};
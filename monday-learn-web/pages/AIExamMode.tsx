import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SET } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { Printer, ArrowLeft, Sparkles, RefreshCw, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Define the expected structure of the AI response
interface ExamQuestion {
  id: string;
  text: string;
  options?: string[]; // For multiple choice
  type: 'multiple_choice' | 'true_false' | 'written';
  correctAnswer?: string; // Added for answer key
}

interface ExamSection {
  title: string;
  description: string;
  questions: ExamQuestion[];
}

interface ExamData {
  title: string;
  gradeLevel: string;
  subject: string;
  sections: ExamSection[];
}

export const AIExamMode: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  // Helper to clean markdown code blocks from JSON response
  const cleanJson = (text: string) => {
    // Remove markdown code blocks if present (e.g. ```json ... ``` or just ``` ... ```)
    let cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    return cleaned;
  };

  // Initialize Gemini
  const generateExam = async () => {
    setStatus('generating');
    setExamData(null);
    setShowAnswers(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Prepare context from the current set
      const termsContext = MOCK_SET.terms.map(t => `${t.term} (${t.definition})`).join(', ');

      const prompt = `
        Analyze the following study set and act as an expert teacher to create a professional exam paper.
        
        Study Set Info:
        - Title: "${MOCK_SET.title}"
        - Description: "${MOCK_SET.description || ''}"
        - Content Preview: ${termsContext.substring(0, 1500)}...

        Requirements:
        1. **Analyze Context**: Determine the appropriate Subject and Grade Level based on the terms.
        2. **Structure**: Create exactly 3 sections:
           - Section 1: Multiple Choice (Concept understanding, 4 options).
           - Section 2: True/False (Logic or fact checking).
           - Section 3: Application/Written (Fill in the blanks, use word in sentence, or short answer).
        3. **Question Quality**: 
           - DO NOT just ask "What is the definition of X?". 
           - Create "Deformed Questions" that test mastery (e.g., "Which word describes...", "Fill in the blank...").
           - Ensure options for Multiple Choice are plausible distractors.
        4. **Quantity**: Generate 3-5 high-quality questions per section.
        5. **Language**: The exam language must match the language of the Terms (e.g., if terms are Chinese, use Chinese).
        
        Output strictly in JSON format matching the requested schema.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A creative title for the exam paper" },
              gradeLevel: { type: Type.STRING, description: "Target audience, e.g., 'Grade 1' or 'Advanced'" },
              subject: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    questions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING, description: "The question prompt" },
                          type: { type: Type.STRING, enum: ["multiple_choice", "true_false", "written"] },
                          options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Array of 4 options for multiple choice, empty otherwise"
                          },
                          correctAnswer: {
                            type: Type.STRING,
                            description: "The correct answer and a brief explanation"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (response.text) {
        const cleanedText = cleanJson(response.text);
        try {
          const data = JSON.parse(cleanedText) as ExamData;
          setExamData(data);
          setStatus('complete');
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          console.log("Raw text:", response.text);
          setStatus('error');
        }
      } else {
        throw new Error("No data returned from AI");
      }

    } catch (error) {
      console.error("Error generating exam:", error);
      setStatus('error');
    }
  };

  useEffect(() => {
    generateExam();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-blue print:bg-white font-serif md:font-sans transition-colors duration-200">
      {/* Navigation Header - Hidden when printing */}
      <div className="bg-white dark:bg-[#15143c] border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/set/${id}`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 智能试卷生成
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {status === 'complete' && (
            <>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${showAnswers ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {showAnswers ? '隐藏答案' : '显示答案'}
              </button>
              <button
                onClick={generateExam}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                打印
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[210mm] mx-auto my-8 print:my-0 print:w-full print:max-w-none">

        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center h-[60vh] bg-white dark:bg-[#15143c] rounded-xl shadow-sm p-8 animate-in fade-in duration-500">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">正在为您生成试卷...</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">AI 正在分析学习集内容、判断难度等级，并设计变形题目，请稍候。</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-[60vh] bg-white dark:bg-[#15143c] rounded-xl shadow-sm p-8">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">生成失败</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">AI 服务暂时无法响应，请检查网络连接或重试。</p>
            <button
              onClick={generateExam}
              className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {status === 'complete' && examData && (
          <div className="bg-white dark:bg-[#15143c] shadow-lg print:shadow-none p-[15mm] md:p-[20mm] min-h-[297mm] relative animate-in fade-in slide-in-from-bottom-4 duration-500 print:bg-white">
            {/* Exam Header */}
            <div className="text-center border-b-2 border-gray-800 dark:border-white/20 print:border-gray-800 pb-6 mb-8">
              <h1 className="text-3xl font-serif font-bold mb-3 text-black dark:text-white print:text-black tracking-tight">{examData.title}</h1>
              <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-gray-300 print:text-gray-600 mb-6 font-medium">
                <span className="bg-gray-100 dark:bg-white/10 print:bg-transparent print:border print:border-gray-300 px-3 py-1 rounded-full text-sm text-gray-800 dark:text-gray-200 print:text-gray-800">{examData.subject}</span>
                <span>•</span>
                <span>{examData.gradeLevel}</span>
              </div>

              <div className="flex justify-between text-sm font-medium mt-8 px-4 md:px-12">
                <div className="flex gap-2 items-end">
                  <span className="text-gray-500 dark:text-gray-400 print:text-gray-500">班级:</span>
                  <div className="border-b border-black dark:border-white print:border-black w-24 md:w-32"></div>
                </div>
                <div className="flex gap-2 items-end">
                  <span className="text-gray-500 dark:text-gray-400 print:text-gray-500">姓名:</span>
                  <div className="border-b border-black dark:border-white print:border-black w-24 md:w-32"></div>
                </div>
                <div className="flex gap-2 items-end">
                  <span className="text-gray-500 dark:text-gray-400 print:text-gray-500">得分:</span>
                  <div className="border-b border-black dark:border-white print:border-black w-16 md:w-24"></div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {examData.sections.map((section, index) => (
                <div key={index} className="mb-8 break-inside-avoid">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-black dark:text-white print:text-black mb-1 flex items-center gap-2">
                      <span className="bg-black dark:bg-white text-white dark:text-black w-6 h-6 flex items-center justify-center rounded text-sm print:text-black print:bg-transparent print:border print:border-black">{["I", "II", "III", "IV", "V"][index]}</span>
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-500 italic ml-8">{section.description}</p>
                  </div>

                  <div className="space-y-6 pl-2">
                    {section.questions.map((q, qIndex) => (
                      <div key={q.id} className="break-inside-avoid relative pl-6">
                        <span className="absolute left-0 top-0 font-serif font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">{qIndex + 1}.</span>
                        <div className="font-medium text-gray-900 dark:text-white print:text-gray-900 leading-relaxed mb-2">
                          {q.text}
                          {q.type === 'true_false' && (
                            <span className="float-right print:block text-gray-400 dark:text-gray-500 font-normal tracking-widest">( &nbsp;&nbsp;T / F&nbsp;&nbsp; )</span>
                          )}
                        </div>

                        {q.type === 'multiple_choice' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 ml-1">
                            {q.options.map((opt, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">
                                <span className="font-bold text-gray-500 dark:text-gray-400">{String.fromCharCode(65 + i)}.</span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'written' && (
                          <div className="h-8 border-b border-gray-300 border-dashed w-full mt-1"></div>
                        )}

                        {/* Answer Key Inline (Only on screen if toggled) */}
                        {showAnswers && q.correctAnswer && (
                          <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded text-sm text-emerald-800 dark:text-emerald-400 print:hidden">
                            <span className="font-bold">Answer:</span> {q.correctAnswer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-16 text-center text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 print:text-gray-300 border-t border-gray-100 dark:border-white/10 print:border-gray-100 pt-6 print:hidden">
              Generated by Quizlet AI • {new Date().toLocaleDateString()}
            </div>

            {/* Print-only Answer Key Page */}
            <div className="hidden print:block break-before-page mt-16">
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-8">
                <h2 className="text-2xl font-serif font-bold">参考答案</h2>
                <p className="text-gray-500">{examData.title}</p>
              </div>

              <div className="space-y-6">
                {examData.sections.map((section, sIdx) => (
                  <div key={sIdx}>
                    <h3 className="font-bold text-lg mb-2">{["I", "II", "III", "IV", "V"][sIdx]}. {section.title}</h3>
                    <ul className="space-y-1 ml-4">
                      {section.questions.map((q, qIdx) => (
                        <li key={q.id} className="text-sm">
                          <span className="font-bold mr-2">{qIdx + 1}.</span>
                          {q.correctAnswer || "No answer key provided"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page {
            margin: 15mm;
            size: A4;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .break-before-page {
            page-break-before: always;
          }
          /* Hide scrollbars when printing */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

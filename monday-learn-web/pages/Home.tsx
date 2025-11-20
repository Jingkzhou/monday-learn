import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Copy, PartyPopper, Sparkles, X, Calendar, TrendingUp, AlertCircle, BrainCircuit, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { StudySet } from '../types';
import { api } from '../utils/api';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'generating' | 'complete'>('idle');
  const [reportContent, setReportContent] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('本周');
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [setsError, setSetsError] = useState('');
  const [recommendedSets, setRecommendedSets] = useState<StudySet[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [recommendedError, setRecommendedError] = useState('');
  const recentRef = useRef<HTMLDivElement | null>(null);
  const recommendedRef = useRef<HTMLDivElement | null>(null);

  const timeframes = ['本周', '本月', '半年', '本年'];

  const normalizeSet = (item: any): StudySet => ({
    ...item,
    termCount: item.termCount ?? item.term_count ?? item.terms?.length ?? 0,
    viewCount: item.viewCount ?? item.view_count ?? 0,
    isPublic: item.isPublic ?? item.is_public ?? true,
    isOwner: item.isOwner ?? item.is_owner ?? false,
  });

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

    fetchSets();
  }, []);

  useEffect(() => {
    const fetchRecommended = async () => {
      setLoadingRecommended(true);
      setRecommendedError('');
      try {
        const data = await api.get<StudySet[]>('/study-sets/public/top?limit=5');
        const normalized = (data || []).map(normalizeSet);
        setRecommendedSets(normalized);
      } catch (err: any) {
        setRecommendedError(err.message || '加载推荐内容失败');
      } finally {
        setLoadingRecommended(false);
      }
    };

    fetchRecommended();
  }, []);

  const heroSet = useMemo(() => studySets[0], [studySets]);

  const setTitleForReport = heroSet?.title || '示例学习集';

  // Mock history data generator to simulate user activity for the AI
  const getMockHistory = (timeframe: string) => {
    return {
      timeframe,
      totalStudyTime: timeframe === '本周' ? '4.5小时' : '120小时',
      setsCompleted: timeframe === '本周' ? 3 : 15,
      averageScore: '78%',
      weakPoints: ['多音字辨析', '生僻字书写', '形近字混淆'],
      recentTests: [
        { name: setTitleForReport, score: '85%', date: '2024-11-15' },
        { name: 'Fast Phonics Peak 2', score: '60%', date: '2024-11-12' },
        { name: '古诗词填空', score: '92%', date: '2024-11-10' }
      ]
    };
  };

  const generateReport = async () => {
    setReportStatus('generating');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const history = getMockHistory(selectedTimeframe);
      
      const prompt = `
        作为一名专业的个性化学习顾问，请根据以下用户的学习数据生成一份"${selectedTimeframe}学习总结报告"。
        
        用户数据:
        - 时间范围: ${history.timeframe}
        - 总学习时长: ${history.totalStudyTime}
        - 完成学习集: ${history.setsCompleted} 个
        - 平均正确率: ${history.averageScore}
        - 识别出的薄弱点: ${history.weakPoints.join(', ')}
        - 近期测试记录: ${JSON.stringify(history.recentTests)}

        请生成一份结构清晰的报告（使用简单的Markdown格式，不要使用代码块），包含以下部分：
        1. 📊 **整体表现概览**：用鼓励的语气总结用户的努力程度和进步。
        2. 🛑 **错题深度分析**：具体分析为什么用户在"${history.weakPoints.join('、')}"方面存在困难，分析可能的认知误区。
        3. 🚀 **定制化提升计划**：针对薄弱点，给出具体的、可执行的复习建议（例如：建议使用什么模式，每天复习多少个词等）。
        4. 💡 **AI 寄语**：一句简短的激励话语。

        语气要亲切、专业且具有建设性。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        setReportContent(response.text);
        setReportStatus('complete');
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setReportContent("抱歉，生成报告时出现错误，请稍后重试。");
      setReportStatus('complete'); // Show error as text
    }
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
        className="relative min-w-[260px] max-w-[320px] sm:min-w-[300px] sm:max-w-[360px] md:min-w-[320px] md:max-w-[400px] bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate(`/set/${set.id}`)}
      >
        <div className="relative p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-indigo-700 text-xs font-bold flex items-center gap-1">
              <Copy className="w-4 h-4" />
              {termCount} 个词语
            </span>
            {set.isPublic && (
              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center gap-1 border border-indigo-100">
                <ImageIcon className="w-3 h-3" />
                公开
              </span>
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 leading-snug line-clamp-2">{set.title}</div>
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-sm font-bold uppercase">
              {set.authorUsername?.[0] || 'U'}
            </div>
            <span className="text-sm font-semibold truncate">{set.authorUsername || '其他学员'}</span>
            {set.viewCount !== undefined && (
              <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {set.viewCount || 0} 次打开
              </span>
            )}
          </div>
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollBy(ref, 'left')}
            className="p-2 rounded-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="上一页"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollBy(ref, 'right')}
            className="p-2 rounded-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="下一页"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-3 no-scrollbar"
      >
        {loading ? (
          <div className="flex items-center gap-2 text-slate-200">
            <Loader2 className="w-4 h-4 animate-spin" />
            正在加载...
          </div>
        ) : sets.length > 0 ? (
          sets.map(renderCard)
        ) : (
          <div className="bg-white text-gray-500 rounded-xl border border-dashed border-gray-200 p-6 min-w-[260px]">
            暂无内容
          </div>
        )}
      </div>
    </section>
  );

  return (
    <main className="pt-20 px-4 md:px-8 md:ml-64 pb-24 md:pb-10 min-h-screen bg-bg-gray">
      
      {/* Mobile Search Bar */}
      <div className="mb-6 md:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border-none rounded-full leading-5 bg-white shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm text-base"
            placeholder="搜索"
          />
        </div>
      </div>

      {/* Continue Learning Section (Hero Card) */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-3">继续上次的学习</h2>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
            {loadingSets ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                正在为你加载学习集...
              </div>
            ) : heroSet ? (
              <>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900 text-lg pr-8">{heroSet.title}</h3>
                    <button className="text-gray-400">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                    <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm font-bold text-gray-600">
                      {heroSet.termCount || heroSet.terms?.length || 0} 张卡片 • 由你创建
                    </span>
                    <PartyPopper className="w-4 h-4 text-yellow-500" />
                </div>

                <button 
                    onClick={() => navigate(`/set/${heroSet.id}/test`)}
                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-indigo-200"
                >
                    开始测试
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 text-gray-600">
                <div className="font-bold">还没有学习集</div>
                <p className="text-sm text-gray-500">去创建你的第一套卡片，开始学习之旅。</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/create')}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors"
                  >
                    创建学习集
                  </button>
                  <button 
                    onClick={() => navigate('/folders')}
                    className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    查看文件夹
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>

      {/* Recent Content Carousel */}
      {renderCarousel('近期内容', studySets, loadingSets, setsError, recentRef)}

      {/* Recommended Section Carousel */}
      {renderCarousel('其他学员喜爱的内容', recommendedSets, loadingRecommended, recommendedError, recommendedRef)}

      {/* AI Summary Button Section */}
      <section className="mb-8">
         <div 
            onClick={() => setShowReportModal(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-lg shadow-indigo-200 cursor-pointer active:scale-[0.98] transition-all"
         >
             {/* Background Decoration */}
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
             <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
             
             <div className="relative z-10 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">AI 智能助手</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">生成学习总结报告</h3>
                    <p className="text-indigo-100 text-sm max-w-[80%]">
                        基于本周、本月或全年的学习数据，为您分析薄弱环节并定制计划。
                    </p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0 border border-white/30 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-6 h-6 text-white" />
                </div>
             </div>
         </div>
      </section>

      {/* AI Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
            
            <div className="relative bg-white w-full md:max-w-2xl h-[90vh] md:h-[85vh] md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-primary">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">AI 学习诊断报告</h2>
                    </div>
                    <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Timeframe Selection */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                    {timeframes.map(tf => (
                        <button
                            key={tf}
                            onClick={() => {
                                setSelectedTimeframe(tf);
                                setReportStatus('idle');
                            }}
                            disabled={reportStatus === 'generating'}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                selectedTimeframe === tf 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {tf}概况
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {reportStatus === 'idle' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                                <Calendar className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">准备生成{selectedTimeframe}报告</h3>
                                <p className="text-gray-500 max-w-xs mx-auto mb-6">
                                    AI 将分析您的答题历史、错题类型和学习频率，为您提供专业的改进建议。
                                </p>
                                <button 
                                    onClick={generateReport}
                                    className="bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-indigo-200 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    开始生成分析
                                </button>
                            </div>
                        </div>
                    )}

                    {reportStatus === 'generating' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">AI 正在分析数据...</h3>
                                <p className="text-gray-500 text-sm">正在回顾您的错题本和测试记录</p>
                            </div>
                        </div>
                    )}

                    {reportStatus === 'complete' && (
                        <div className="prose prose-indigo max-w-none animate-in fade-in duration-500">
                            {/* Render simple formatted text since we don't have a markdown parser installed */}
                            {reportContent.split('\n').map((line, idx) => {
                                // Simple bold handling for headings or **text**
                                if (line.trim().startsWith('##') || line.trim().startsWith('###') || /^\d+\./.test(line)) {
                                    return <h3 key={idx} className="text-gray-900 font-bold text-lg mt-4 mb-2">{line.replace(/#/g, '')}</h3>;
                                }
                                if (line.trim() === '') return <br key={idx} />;
                                return <p key={idx} className="text-gray-600 mb-2 leading-relaxed">{line.replace(/\*\*/g, '')}</p>;
                            })}
                            
                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-medium">由 Google Gemini AI 生成</span>
                                <button 
                                    onClick={generateReport}
                                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                                >
                                    <TrendingUp className="w-4 h-4" /> 重新分析
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </main>
  );
};

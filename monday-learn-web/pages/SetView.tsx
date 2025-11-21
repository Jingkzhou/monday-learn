import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudySet, Term } from '../types';
import { Flashcard } from '../components/Flashcard';
import {
  MoreHorizontal,
  Share2,
  PenSquare,
  Copy,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Settings2,
  Keyboard,
  Sparkles,
  ScrollText,
  Gamepad2,
  Star,
  Volume2,
  PenLine,
  FileText,
  Rocket,
  FolderPlus,
  Loader2,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { api } from '../utils/api';

export const SetView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editInProgress, setEditInProgress] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimeout = useRef<number | null>(null);
  const pauseTimeout = useRef<number | null>(null);
  const isAutoPlayingRef = useRef(isAutoPlaying);

  useEffect(() => {
    const fetchStudySet = async () => {
      setLoading(true);
      setError('');
      setActionError('');
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

        setStudySet({
          id: data.id,
          title: data.title,
          description: data.description,
          author: data.author_username,
          authorUsername: data.author_username,
          authorId: data.author_id,
          isOwner: data.is_owner ?? false,
          termCount: preparedTerms.length,
          terms: preparedTerms,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
        setTerms(preparedTerms);
        setCurrentCardIndex(0);
      } catch (err: any) {
        setError(err.message || '加载学习集失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStudySet();
  }, [id]);

  const authorName = studySet?.authorUsername || '你';
  const hasTerms = terms.length > 0;

  const nextCard = () => {
    if (!hasTerms) return;
    setCurrentCardIndex((prev) => (prev + 1) % terms.length);
  };

  const prevCard = () => {
    if (!hasTerms) return;
    setCurrentCardIndex((prev) => (prev - 1 + terms.length) % terms.length);
  };

  const handleToggleStar = async (termId: string | number) => {
    // Optimistic update
    setTerms(prevTerms =>
      prevTerms.map(term =>
        term.id === termId ? { ...term, starred: !term.starred } : term
      )
    );

    try {
      await api.patch(`/study-sets/terms/${termId}/star`);
    } catch (err) {
      // Revert on error
      setTerms(prevTerms =>
        prevTerms.map(term =>
          term.id === termId ? { ...term, starred: !term.starred } : term
        )
      );
      console.error('Failed to toggle star', err);
    }
  };

  const clearAutoPlay = (cancelSpeech = false) => {
    if (autoPlayTimeout.current) {
      clearTimeout(autoPlayTimeout.current);
      autoPlayTimeout.current = null;
    }
    if (pauseTimeout.current) {
      clearTimeout(pauseTimeout.current);
      pauseTimeout.current = null;
    }
    if (cancelSpeech && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  const scheduleNextCard = () => {
    if (!isAutoPlayingRef.current) return;
    clearAutoPlay();

    autoPlayTimeout.current = window.setTimeout(() => {
      setCurrentCardIndex((prev) => {
        if (prev >= terms.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);
  };

  const speakCurrentCard = () => {
    if (!isAutoPlayingRef.current) return;
    const currentTerm = terms[currentCardIndex];
    if (!currentTerm) {
      setIsAutoPlaying(false);
      return;
    }

    clearAutoPlay(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;

      const speakDefinition = () => {
        if (!isAutoPlayingRef.current) return;
        const definitionUtterance = new SpeechSynthesisUtterance(currentTerm.definition);
        definitionUtterance.onend = scheduleNextCard;
        definitionUtterance.onerror = scheduleNextCard;
        synth.speak(definitionUtterance);
      };

      const termUtterance = new SpeechSynthesisUtterance(currentTerm.term);
      termUtterance.onend = () => {
        pauseTimeout.current = window.setTimeout(() => {
          speakDefinition();
        }, 2000);
      };
      termUtterance.onerror = scheduleNextCard;
      synth.speak(termUtterance);
    } else {
      scheduleNextCard();
    }
  };

  useEffect(() => {
    if (isAutoPlaying) {
      speakCurrentCard();
    } else {
      clearAutoPlay(true);
    }
  }, [isAutoPlaying]);

  useEffect(() => {
    if (isAutoPlaying) {
      speakCurrentCard();
    }
  }, [currentCardIndex]);

  useEffect(() => {
    return () => {
      clearAutoPlay(true);
    };
  }, []);

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  const handleEditClick = async () => {
    if (!studySet) return;
    setActionError('');

    if (studySet.isOwner) {
      navigate(`/set/${studySet.id}/edit`);
      return;
    }

    setEditInProgress(true);
    try {
      const cloned = await api.post<StudySet>(`/study-sets/${studySet.id}/clone`, {
        title: `${studySet.title}（我的版本）`,
        is_public: false,
      });
      navigate(`/set/${cloned.id}/edit`);
    } catch (err: any) {
      setActionError(err.message || '保存副本失败，请稍后重试');
    } finally {
      setEditInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        正在加载学习集...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 text-gray-700">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="font-bold text-lg mb-2">无法加载学习集</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/create')}
          className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
        >
          创建新的学习集
        </button>
      </div>
    );
  }

  if (!studySet) {
    return null;
  }

  return (
    <div className="pt-20 pb-10 px-4 md:px-8 max-w-7xl mx-auto ml-0 md:ml-64">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{studySet.title}</h1>
        {studySet.description && <p className="text-gray-500 mb-4">{studySet.description}</p>}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-primary font-bold flex items-center justify-center">
              {authorName?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-semibold text-gray-700 hover:underline cursor-pointer">
              {authorName}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-md">教师</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/folders')}
              className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
              title="添加到文件夹"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
            <button className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition-colors" title="分享">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleEditClick}
              disabled={editInProgress}
              className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title={studySet.isOwner ? "编辑" : "保存副本并编辑"}
            >
              {editInProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenSquare className="w-5 h-5" />}
            </button>
            <button className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition-colors" title="更多">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
        {actionError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {actionError}
          </div>
        )}
      </div>

      {/* Study Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <button
          onClick={() => navigate(`/set/${id}/flashcards`)}
          className="flex items-center justify-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Copy className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-700 text-lg group-hover:text-gray-900">单词卡</span>
        </button>

        <button
          onClick={() => navigate(`/set/${id}/learn`)}
          className="flex items-center justify-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-700 text-lg group-hover:text-gray-900">学习</span>
        </button>

        <button
          onClick={() => navigate(`/set/${id}/test`)}
          className="flex items-center justify-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <ScrollText className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-700 text-lg group-hover:text-gray-900">测试</span>
        </button>

        <button
          onClick={() => navigate(`/set/${id}/match`)}
          className="flex items-center justify-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-700 text-lg group-hover:text-gray-900">配对</span>
        </button>

        <button
          onClick={() => navigate(`/set/${id}/blast`)}
          className="flex items-center justify-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-pink-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Rocket className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-700 text-lg group-hover:text-gray-900">Blast</span>
        </button>

        <button
          onClick={() => navigate(`/set/${id}/ai-exam`)}
          className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform z-10">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col z-10">
            <span className="font-bold text-gray-800 text-lg group-hover:text-gray-900 flex items-center gap-2">
              AI 试卷
              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">New</span>
            </span>
          </div>
        </button>
      </div>

      {/* Flashcard Preview Area */}
      <div className="mb-12">
        {hasTerms ? (
          <>
            <Flashcard
              term={terms[currentCardIndex]}
              total={terms.length}
              current={currentCardIndex + 1}
              onNext={nextCard}
              onPrev={prevCard}
              onToggleStar={() => handleToggleStar(terms[currentCardIndex].id)}
            />

            {/* Flashcard Controls */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between mt-6 max-w-3xl mx-auto px-4 gap-4 md:gap-0">
              <div className="flex gap-4 w-full md:w-auto justify-center md:justify-start">
                <button
                  onClick={toggleAutoPlay}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  title={isAutoPlaying ? "暂停自动播放" : "自动朗读"}
                >
                  <div className="border-2 border-gray-400 rounded-full w-8 h-8 flex items-center justify-center">
                    {isAutoPlaying ? (
                      <Pause className="w-4 h-4 text-gray-700" />
                    ) : (
                      <Play className="w-4 h-4 text-gray-700" />
                    )}
                  </div>
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="乱序">
                  <Settings2 className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <button onClick={prevCard} className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-primary disabled:opacity-50">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="font-bold text-gray-600 min-w-[60px] text-center">
                  {currentCardIndex + 1} / {terms.length}
                </span>
                <button onClick={nextCard} className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-primary">
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-4 w-full md:w-auto justify-center md:justify-end hidden md:flex">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="快捷键">
                  <Keyboard className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="全屏">
                  <Maximize2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500">
            暂无卡片，请在编辑页添加一些术语。
          </div>
        )}
      </div>

      {/* Terms List Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <img src="https://picsum.photos/seed/user/30/30" className="w-8 h-8 rounded-full" alt="Current User" />
          <span className="font-bold text-gray-900">本学习集中的术语 ({terms.length})</span>
        </div>
        <div className="flex gap-4 text-sm md:text-base">
          <span className="text-gray-500 font-semibold cursor-pointer hover:text-gray-900 border-b-2 border-primary pb-1">默认顺序</span>
          <span className="text-gray-400 font-semibold cursor-pointer hover:text-gray-900">字母顺序</span>
        </div>
      </div>

      {/* Terms Status Banner */}
      <div className="bg-indigo-50 rounded-lg p-4 mb-6 flex items-center gap-3">
        <div className="text-primary font-bold whitespace-nowrap">术语总数 {terms.length}</div>
        <div className="text-gray-500 text-sm line-clamp-1">加油！坚持练习能带来最大的收获。</div>
      </div>

      {/* Term List */}
      <div className="space-y-3">
        {terms.map((term) => (
          <div key={term.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-gray-300 transition-colors gap-4 md:gap-0">
            <div className="flex-1 w-full md:w-auto md:pr-4 md:border-r border-gray-100 border-b md:border-b-0 pb-2 md:pb-0">
              <div className="text-lg text-gray-800">{term.term}</div>
            </div>
            <div className="flex-1 w-full md:w-auto md:pl-4 flex items-center justify-between">
              <div className="text-lg text-gray-800">{term.definition}</div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleStar(term.id)}
                  className={`p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${term.starred ? 'text-yellow-400 opacity-100' : 'text-gray-400 hover:text-primary hover:bg-gray-50'}`}
                  title={term.starred ? "取消星标" : "标记星号"}
                >
                  <Star className={`w-5 h-5 ${term.starred ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="播放音频">
                  <Volume2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="编辑">
                  <PenLine className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-dark shadow-lg shadow-indigo-200 transition-all">
          添加或移除术语
        </button>
      </div>

    </div>
  );
};

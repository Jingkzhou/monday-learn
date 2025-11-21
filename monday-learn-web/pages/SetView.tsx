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
  Pause,
  RotateCcw,
  Merge
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
  const [filterStarred, setFilterStarred] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
  const starredCount = terms.filter(t => t.starred).length;

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

  const handleResetProgress = async () => {
    if (!studySet) return;
    if (!window.confirm('确定要重置此学习集的学习进度吗？这将清除所有的学习记录。')) {
      return;
    }

    try {
      await api.post(`/study-sets/${studySet.id}/reset-progress`, {});
      // Refresh the page or data to reflect changes
      // For now, just reload the page to be safe and simple, or re-fetch data
      window.location.reload();
    } catch (err: any) {
      setActionError(err.message || '重置进度失败');
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

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
              title="更多"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMoreMenu(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      navigate('/folders');
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-gray-500" />
                    添加到文件夹
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <Share2 className="w-4 h-4 text-gray-500" />
                    分享
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      handleEditClick();
                      setShowMoreMenu(false);
                    }}
                    disabled={editInProgress}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                  >
                    {editInProgress ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <PenSquare className="w-4 h-4 text-gray-500" />}
                    {studySet.isOwner ? "编辑学习集" : "保存副本并编辑"}
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      handleResetProgress();
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-red-500" />
                    重置学习进度
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      navigate(`/set/${id}/merge`);
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Merge className="w-4 h-4 text-gray-500" />
                    合并学习集
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
        <div className="flex gap-4 text-sm md:text-base items-center">
          <button
            onClick={() => setFilterStarred(!filterStarred)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${filterStarred
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Star className={`w-4 h-4 ${filterStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            <span>只看星标 ({starredCount})</span>
          </button>
          <div className="w-px h-4 bg-gray-300 mx-2"></div>
          <button
            onClick={() => navigate(`/set/${id}/learn?starredOnly=true`)}
            disabled={starredCount === 0}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${starredCount === 0
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-indigo-50 text-primary border-indigo-100 hover:bg-indigo-100'
              }`}
            title="仅练习星标术语，不影响整体进度"
          >
            <Sparkles className="w-4 h-4" />
            <span>只学习星标内容</span>
          </button>
        </div>
      </div>

      {/* Terms Status Banner */}
      <div className="bg-indigo-50 rounded-lg p-4 mb-6 flex items-center gap-3">
        <div className="text-primary font-bold whitespace-nowrap">术语总数 {terms.length}</div>
        <div className="text-gray-500 text-sm line-clamp-1">加油！坚持练习能带来最大的收获。</div>
      </div>

      {/* Term List */}
      <div className="space-y-3">
        {(filterStarred ? terms.filter(t => t.starred) : terms).map((term) => (
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

        {filterStarred && terms.filter(t => t.starred).length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">没有找到星标术语</h3>
            <p className="text-gray-500 mt-1">点击术语旁边的星星图标来收藏重点内容</p>
            <button
              onClick={() => setFilterStarred(false)}
              className="mt-4 text-primary font-bold hover:underline"
            >
              显示所有术语
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

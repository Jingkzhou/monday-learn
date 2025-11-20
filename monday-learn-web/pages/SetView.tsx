
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SET } from '../constants';
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
    BookOpen,
    ScrollText,
    Gamepad2,
    Star,
    Volume2,
    PenLine,
    FileText,
    Rocket,
    FolderPlus
} from 'lucide-react';

export const SetView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [terms, setTerms] = useState(MOCK_SET.terms);

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % terms.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + terms.length) % terms.length);
  };

  const handleToggleStar = (termId: string) => {
    setTerms(prevTerms => 
      prevTerms.map(term => 
        term.id === termId ? { ...term, starred: !term.starred } : term
      )
    );
  };

  return (
    <div className="pt-20 pb-10 px-4 md:px-8 max-w-7xl mx-auto ml-0 md:ml-64">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{MOCK_SET.title}</h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={MOCK_SET.authorAvatar} 
              alt={MOCK_SET.author} 
              className="w-8 h-8 rounded-full bg-gray-200"
            />
            <span className="text-sm font-semibold text-gray-700 hover:underline cursor-pointer">{MOCK_SET.author}</span>
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
            <button onClick={() => navigate(`/set/${id}/edit`)} className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition-colors" title="编辑">
                <PenSquare className="w-5 h-5" />
            </button>
            <button className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition-colors" title="更多">
                <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Study Modes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <button className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left group">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100">
                <Copy className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700">单词卡</span>
        </button>
        <button 
            onClick={() => navigate(`/set/${id}/learn`)}
            className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left group"
        >
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100">
                <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700">学习</span>
        </button>
        <button 
            onClick={() => navigate(`/set/${id}/test`)}
            className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left group"
        >
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100">
                <ScrollText className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700">测试</span>
        </button>
        <button 
            onClick={() => navigate(`/set/${id}/match`)}
            className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left group"
        >
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100">
                <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700">配对</span>
        </button>
        <button 
            onClick={() => navigate(`/set/${id}/blast`)}
            className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left group"
        >
            <div className="w-8 h-8 rounded-md bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-100">
                <Rocket className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700">Blast</span>
        </button>
        <button 
            onClick={() => navigate(`/set/${id}/ai-exam`)}
            className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left group ring-1 ring-indigo-100 bg-indigo-50/30"
        >
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center group-hover:shadow-lg transition-all">
                <FileText className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700 flex items-center gap-1">
                AI 试卷 <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded font-bold">NEW</span>
            </span>
        </button>
      </div>

      {/* Flashcard Preview Area */}
      <div className="mb-12">
        <Flashcard 
            term={terms[currentCardIndex]}
            total={terms.length}
            current={currentCardIndex + 1}
            onNext={nextCard}
            onPrev={prevCard}
            onToggleStar={() => handleToggleStar(terms[currentCardIndex].id)}
        />
        
        {/* Flashcard Controls */}
        <div className="flex items-center justify-between mt-6 max-w-3xl mx-auto px-4">
            <div className="flex gap-4">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="播放">
                    <div className="border-2 border-gray-400 rounded-full w-6 h-6 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-gray-500 border-b-[4px] border-b-transparent ml-0.5"></div>
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

             <div className="flex gap-4">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="快捷键">
                    <Keyboard className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="全屏">
                    <Maximize2 className="w-6 h-6" />
                </button>
            </div>
        </div>
      </div>

      {/* Terms List Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
             <img src="https://picsum.photos/seed/user/30/30" className="w-8 h-8 rounded-full" alt="Current User"/>
             <span className="font-bold text-gray-900">本学习集中的术语 ({terms.length})</span>
        </div>
        <div className="flex gap-4">
            <span className="text-gray-500 font-semibold cursor-pointer hover:text-gray-900 border-b-2 border-primary pb-1">默认顺序</span>
            <span className="text-gray-400 font-semibold cursor-pointer hover:text-gray-900">字母顺序</span>
        </div>
      </div>

      {/* Terms Status Banner */}
      <div className="bg-indigo-50 rounded-lg p-4 mb-6 flex items-center gap-3">
        <div className="text-primary font-bold">正在学习 (1)</div>
        <div className="text-gray-500 text-sm">继续加油！你已经开始学习这些术语了。</div>
      </div>

      {/* Term List */}
      <div className="space-y-3">
        {terms.map((term) => (
            <div key={term.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between group hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4 border-r border-gray-100">
                    <div className="text-lg text-gray-800">{term.term}</div>
                </div>
                <div className="flex-1 pl-4 flex items-center justify-between">
                    <div className="text-lg text-gray-800">{term.definition}</div>
                    <div className="flex gap-2">
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
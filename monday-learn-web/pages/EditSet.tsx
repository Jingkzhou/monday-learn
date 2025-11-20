import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SET } from '../constants';
import { Term } from '../types';
import { ArrowLeft, Settings, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';

export const EditSet: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState(MOCK_SET.title);
  const [description, setDescription] = useState(MOCK_SET.description || '');
  const [terms, setTerms] = useState<Term[]>(MOCK_SET.terms);

  const handleTermChange = (id: string, field: 'term' | 'definition', value: string) => {
    setTerms(terms.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleDeleteTerm = (id: string) => {
    setTerms(terms.filter(t => t.id !== id));
  };

  const handleAddCard = () => {
    const newTerm: Term = {
        id: Date.now().toString(),
        term: '',
        definition: '',
        status: 'not_started'
    };
    setTerms([...terms, newTerm]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Editor Header */}
      <header className="sticky top-0 bg-white z-40 px-4 md:px-8 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"
            >
                 <ArrowLeft className="w-4 h-4" />
                 返回学习集
             </button>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate(`/set/${id}`)}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
            >
                完成
            </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Title Info */}
        <div className="mb-8 space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">标题</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-lg pb-2 border-b-2 border-gray-300 focus:border-yellow-400 outline-none transition-colors font-medium"
                    placeholder='输入标题，例如“生物 - 第22章：进化”'
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">描述</label>
                <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-base pb-2 border-b-2 border-gray-300 focus:border-yellow-400 outline-none transition-colors"
                    placeholder='添加描述...'
                />
            </div>
        </div>

        {/* Options Bar */}
        <div className="flex items-center justify-between mb-8 sticky top-20 bg-white py-4 z-30">
            <button 
                onClick={handleAddCard}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 font-bold text-gray-700 text-sm"
            >
                + 添加卡片
            </button>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-700 text-sm font-bold">
                    <span>所有人可见</span>
                    <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                </div>
                 <div className="flex items-center gap-2 text-gray-700 text-sm font-bold">
                    <span>仅我可编辑</span>
                </div>
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Cards List */}
        <div className="space-y-6">
            {terms.map((term, index) => (
                <div key={term.id} className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 transition-all">
                    <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                        <span className="font-bold text-gray-400 pl-2">{index + 1}</span>
                        <div className="flex items-center gap-2">
                             <button className="p-2 text-gray-400 hover:text-gray-600 cursor-move">
                                <GripVertical className="w-5 h-5" />
                             </button>
                             <button onClick={() => handleDeleteTerm(term.id)} className="p-2 text-gray-400 hover:text-red-500">
                                <Trash2 className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                    
                    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-1">
                            <input 
                                type="text" 
                                value={term.term}
                                onChange={(e) => handleTermChange(term.id, 'term', e.target.value)}
                                className="w-full pb-2 border-b-2 border-gray-300 focus:border-yellow-400 outline-none transition-colors text-gray-800 bg-transparent"
                                placeholder='输入术语'
                            />
                            <span className="text-xs text-gray-400 font-bold uppercase">术语</span>
                        </div>
                        
                        <div className="flex-1 space-y-1">
                            <div className="flex gap-4">
                                <input 
                                    type="text" 
                                    value={term.definition}
                                    onChange={(e) => handleTermChange(term.id, 'definition', e.target.value)}
                                    className="w-full pb-2 border-b-2 border-gray-300 focus:border-yellow-400 outline-none transition-colors text-gray-800 bg-transparent"
                                    placeholder='输入定义'
                                />
                                <button className="p-2 border border-gray-300 border-dashed rounded-md text-gray-400 hover:text-gray-600 hover:border-gray-400 flex flex-col items-center justify-center min-w-[60px]">
                                    <ImageIcon className="w-5 h-5" />
                                    <span className="text-[10px] uppercase font-bold">图片</span>
                                </button>
                            </div>
                            <span className="text-xs text-gray-400 font-bold uppercase">定义</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
         
         <div className="mt-10 text-center pb-20">
             <button 
                onClick={handleAddCard}
                className="px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-400 font-bold text-gray-700 rounded-lg transition-colors uppercase tracking-wide w-full"
             >
                + 添加卡片
             </button>
         </div>
      </div>
    </div>
  );
};
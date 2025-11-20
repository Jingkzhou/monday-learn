import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Term } from '../types';
import { ArrowLeft, Settings, Trash2, Image as ImageIcon, GripVertical, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

const createEmptyTerm = (index: number): Term => ({
  id: `new-${Date.now()}-${index}`,
  term: '',
  definition: '',
  status: 'not_started',
  order: index,
});

export const EditSet: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = useMemo(() => Boolean(id), [id]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState<Term[]>([createEmptyTerm(0)]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchStudySet();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStudySet = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<any>(`/study-sets/${id}`);
      setTitle(data.title || '');
      setDescription(data.description || '');
      const fetchedTerms: Term[] = (data.terms || []).map((term: any, index: number) => ({
        id: term.id,
        term: term.term,
        definition: term.definition,
        imageUrl: term.image_url,
        status: 'not_started',
        order: term.order ?? index,
      }));
      setTerms(fetchedTerms.length ? fetchedTerms : [createEmptyTerm(0)]);
    } catch (err: any) {
      setError(err.message || '加载学习集失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = (id: string | number, field: 'term' | 'definition', value: string) => {
    setTerms(terms.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleDeleteTerm = (id: string | number) => {
    setTerms(terms.filter(t => t.id !== id));
  };

  const handleAddCard = () => {
    const newTerm = createEmptyTerm(terms.length);
    setTerms([...terms, newTerm]);
  };

  const buildPayloadTerms = () => {
    return terms
      .filter(t => t.term.trim() || t.definition.trim())
      .map((t, index) => ({
        term: t.term.trim(),
        definition: t.definition.trim(),
        image_url: t.imageUrl || null,
        order: t.order ?? index,
      }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }

    const preparedTerms = buildPayloadTerms();
    if (preparedTerms.length === 0) {
      setError('至少需要填写一张卡片');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        terms: preparedTerms,
      };

      const data = isEditing
        ? await api.put<any>(`/study-sets/${id}`, payload)
        : await api.post<any>('/study-sets', payload);

      setSuccessMessage('保存成功');
      navigate(`/set/${data.id}`);
    } catch (err: any) {
      setError(err.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
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
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                完成
            </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg mb-4 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </div>
        )}

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

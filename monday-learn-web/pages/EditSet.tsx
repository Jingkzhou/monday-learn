import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Term } from '../types';
import { ArrowLeft, Settings, Trash2, Image as ImageIcon, GripVertical, Loader2, CheckCircle2, AlertCircle, Upload, X, ChevronDown, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

const createEmptyTerm = (index: number): Term => ({
  id: `new-${Date.now()}-${index}`,
  term: '',
  definition: '',
  status: 'not_started',
  order: index,
});

type DelimiterType = 'tab' | 'comma' | 'newline' | 'semicolon' | 'custom';

export const EditSet: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = useMemo(() => Boolean(id), [id]);

  // Get initial state from navigation (for merge feature)
  const initialState = location.state as {
    initialTitle?: string;
    initialDescription?: string;
    initialTerms?: Term[]
  } | null;

  const [title, setTitle] = useState(initialState?.initialTitle || '');
  const [description, setDescription] = useState(initialState?.initialDescription || '');
  const [terms, setTerms] = useState<Term[]>(initialState?.initialTerms || [createEmptyTerm(0)]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [termDelimiter, setTermDelimiter] = useState<DelimiterType>('tab');
  const [cardDelimiter, setCardDelimiter] = useState<DelimiterType>('newline');
  const [customTermDelimiter, setCustomTermDelimiter] = useState('');
  const [customCardDelimiter, setCustomCardDelimiter] = useState('');
  const [previewTerms, setPreviewTerms] = useState<{ term: string, definition: string }[]>([]);

  // Settings Dropdown State
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchStudySet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Parse import text whenever text or delimiters change
  useEffect(() => {
    if (!showImportModal) return;

    const getDelimiterChar = (type: DelimiterType, custom: string) => {
      switch (type) {
        case 'tab': return '\t';
        case 'comma': return ',';
        case 'newline': return '\n';
        case 'semicolon': return ';';
        case 'custom': return custom;
        default: return '\t';
      }
    };

    const tDelim = getDelimiterChar(termDelimiter, customTermDelimiter);
    const cDelim = getDelimiterChar(cardDelimiter, customCardDelimiter);

    if (!importText.trim()) {
      setPreviewTerms([]);
      return;
    }

    // If card delimiter is newline, we split by lines first
    // If card delimiter is something else (e.g. semicolon), we split by that
    // Note: If card delimiter is newline, we should handle mixed line endings if possible, but simple split is usually enough for web

    let cards: string[] = [];
    if (cardDelimiter === 'newline') {
      cards = importText.split(/\r?\n/);
    } else {
      cards = importText.split(cDelim);
    }

    const parsed = cards
      .filter(card => card.trim().length > 0)
      .map(card => {
        const parts = card.split(tDelim);
        // If we split by term delimiter, the first part is term, the rest is definition (joined back if needed, or just take second part)
        // Usually it's just 2 parts. If more, maybe just join the rest.
        const term = parts[0]?.trim() || '';
        const def = parts.slice(1).join(tDelim).trim() || '';
        return { term, definition: def };
      })
      .filter(item => item.term || item.definition);

    setPreviewTerms(parsed);

  }, [importText, termDelimiter, cardDelimiter, customTermDelimiter, customCardDelimiter, showImportModal]);

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

  const handleImport = () => {
    if (previewTerms.length === 0) {
      setShowImportModal(false);
      return;
    }

    const newTerms = previewTerms.map((pt, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      term: pt.term,
      definition: pt.definition,
      status: 'not_started' as const,
      order: terms.length + idx,
    }));

    // Filter out the initial empty card if it's the only one and untouched
    let currentTerms = [...terms];
    if (currentTerms.length === 1 && !currentTerms[0].term && !currentTerms[0].definition) {
      currentTerms = [];
    }

    setTerms([...currentTerms, ...newTerms]);
    setShowImportModal(false);
    setImportText('');
    setPreviewTerms([]);
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
      navigate('/');
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

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettingsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSettingsMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1">
                    <button
                      onClick={() => {
                        setShowImportModal(true);
                        setShowSettingsMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      导入
                    </button>
                    {/* Add more settings options here if needed */}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Create a new study set</h1>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
          >
            <Sparkles size={16} />
            AI Auto-Generate
          </button>
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

      {/* Import Modal - Light Theme Full Screen */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-white text-gray-900 flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
            <h2 className="text-lg font-bold">导入你的数据。</h2>
            <button
              onClick={() => setShowImportModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:px-12 md:py-8">
            <p className="text-sm text-gray-600 mb-4 font-medium">在此复制并粘贴你的数据（从Word、Excel、Google文档等复制）</p>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-64 bg-white border-2 border-gray-300 rounded-lg p-4 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              placeholder={`单词1\t定义1\n单词2\t定义2\n单词3\t定义3`}
            />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Term Delimiter Options */}
              <div>
                <h3 className="font-bold mb-4 text-sm text-gray-700">词语和定义之间</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${termDelimiter === 'tab' ? 'border-indigo-600' : 'border-gray-400 group-hover:border-gray-600'}`}>
                      {termDelimiter === 'tab' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <input type="radio" name="termDelimiter" className="hidden" checked={termDelimiter === 'tab'} onChange={() => setTermDelimiter('tab')} />
                    <span className={termDelimiter === 'tab' ? 'font-bold text-gray-900' : 'text-gray-600'}>Tab</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${termDelimiter === 'comma' ? 'border-indigo-600' : 'border-gray-400 group-hover:border-gray-600'}`}>
                      {termDelimiter === 'comma' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <input type="radio" name="termDelimiter" className="hidden" checked={termDelimiter === 'comma'} onChange={() => setTermDelimiter('comma')} />
                    <span className={termDelimiter === 'comma' ? 'font-bold text-gray-900' : 'text-gray-600'}>逗号</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${termDelimiter === 'custom' ? 'border-indigo-600' : 'border-gray-400 group-hover:border-gray-600'}`}>
                        {termDelimiter === 'custom' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                      </div>
                      <input type="radio" name="termDelimiter" className="hidden" checked={termDelimiter === 'custom'} onChange={() => setTermDelimiter('custom')} />
                    </label>
                    <input
                      type="text"
                      value={customTermDelimiter}
                      onChange={(e) => {
                        setCustomTermDelimiter(e.target.value);
                        setTermDelimiter('custom');
                      }}
                      placeholder="自定义"
                      className={`bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none transition-colors w-32 ${termDelimiter === 'custom' ? 'text-gray-900' : 'text-gray-500'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Card Delimiter Options */}
              <div>
                <h3 className="font-bold mb-4 text-sm text-gray-700">单词卡之间</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cardDelimiter === 'newline' ? 'border-indigo-600' : 'border-gray-400 group-hover:border-gray-600'}`}>
                      {cardDelimiter === 'newline' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <input type="radio" name="cardDelimiter" className="hidden" checked={cardDelimiter === 'newline'} onChange={() => setCardDelimiter('newline')} />
                    <span className={cardDelimiter === 'newline' ? 'font-bold text-gray-900' : 'text-gray-600'}>新一行</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cardDelimiter === 'semicolon' ? 'border-indigo-600' : 'border-gray-400 group-hover:border-gray-600'}`}>
                      {cardDelimiter === 'semicolon' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <input type="radio" name="cardDelimiter" className="hidden" checked={cardDelimiter === 'semicolon'} onChange={() => setCardDelimiter('semicolon')} />
                    <span className={cardDelimiter === 'semicolon' ? 'font-bold text-gray-900' : 'text-gray-600'}>分号</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cardDelimiter === 'custom' ? 'border-indigo-600' : 'border-gray-400 group-hover:border-gray-600'}`}>
                        {cardDelimiter === 'custom' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                      </div>
                      <input type="radio" name="cardDelimiter" className="hidden" checked={cardDelimiter === 'custom'} onChange={() => setCardDelimiter('custom')} />
                    </label>
                    <input
                      type="text"
                      value={customCardDelimiter}
                      onChange={(e) => {
                        setCustomCardDelimiter(e.target.value);
                        setCardDelimiter('custom');
                      }}
                      placeholder="自定义"
                      className={`bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none transition-colors w-32 ${cardDelimiter === 'custom' ? 'text-gray-900' : 'text-gray-500'}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="mt-10">
              <h3 className="font-bold mb-4 text-sm text-gray-700">预览 {previewTerms.length} 张单词卡</h3>
              {previewTerms.length === 0 ? (
                <p className="text-gray-500 text-sm">尚无内容可预览。</p>
              ) : (
                <div className="space-y-2">
                  {previewTerms.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex-1 font-medium text-gray-900">{pt.term}</div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="flex-1 text-gray-600">{pt.definition}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-4 bg-white">
            <button
              onClick={() => setShowImportModal(false)}
              className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消导入
            </button>
            <button
              onClick={handleImport}
              disabled={previewTerms.length === 0}
              className="px-6 py-2.5 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导入
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

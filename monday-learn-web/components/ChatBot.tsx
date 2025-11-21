import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Send, Sparkles, X } from 'lucide-react';
import { getChatSession } from '../services/geminiService';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        chatRef.current = getChatSession();
      }

      const response = await chatRef.current.sendMessage({ message: userText });
      const replyText = response.text?.trim() || 'I could not generate a reply. Please try again.';
      setMessages((prev) => [...prev, { role: 'model', text: replyText }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Network interference detected. Please retry transmission.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-500 transform hover:scale-110 ${
          isOpen
            ? 'bg-white text-indigo-600 rotate-90 ring-2 ring-indigo-100'
            : 'bg-gradient-to-tr from-[#4255ff] to-indigo-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50'
        }`}
        aria-label="Toggle AI Assistant"
      >
        {!isOpen && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping duration-1000"></span>
        )}

        <div className="relative z-10">
          {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
        </div>
      </button>

      {isOpen && (
        <div className="fixed bottom-32 sm:bottom-28 left-4 right-4 sm:left-auto sm:right-8 z-50 w-full max-w-[480px] sm:w-[380px] sm:max-w-[380px] h-[70vh] max-h-[75vh] sm:h-[600px] sm:max-h-[80vh] mx-auto sm:mx-0 flex flex-col overflow-hidden rounded-3xl font-sans shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 border border-white/60 backdrop-blur-xl bg-white/85 ring-1 ring-black/5">
          <div className="relative bg-white/60 p-4 flex items-center gap-3 border-b border-indigo-50/50 backdrop-blur-md z-10">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4255ff] to-indigo-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Cpu size={20} className="text-indigo-600" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-800">Neural Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                <p className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold">Online</p>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-6 opacity-0 animate-in fade-in duration-1000 fill-mode-forwards delay-150">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative w-full h-full bg-white rounded-full border border-indigo-50 shadow-lg flex items-center justify-center text-indigo-500">
                    <Sparkles size={32} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-800 font-semibold text-lg">How can I help you study?</p>
                  <p className="text-gray-500 text-xs max-w-[220px] mx-auto leading-relaxed">
                    I can explain complex terms, translate content, or quiz you on your current deck.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] p-4 text-sm leading-relaxed relative group ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#4255ff] to-indigo-600 text-white rounded-2xl rounded-br-sm shadow-lg shadow-indigo-500/20'
                      : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm flex gap-2 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white/80 border-t border-indigo-50 backdrop-blur-sm">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200 transition-all duration-300 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:bg-white">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 font-medium"
                disabled={isLoading}
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-all duration-300 p-1.5 rounded-full hover:bg-indigo-50 active:scale-90"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-gray-400 font-medium">Powered by Gemini 3.0 Pro</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;


import React, { useState, useRef, useEffect } from 'react';
import { generateAIChatResponse } from '../services/geminiService';
import { Student, ViolationRecord } from '../types';

interface ChatBotProps {
  students: Student[];
  violations: ViolationRecord[];
}

const ChatBot: React.FC<ChatBotProps> = ({ students, violations }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Chào thầy cô! Tôi là trợ lý AI SmartSchool. Tôi đã cập nhật bộ quy tắc nề nếp 2025-2026. Thầy cô cần hỗ trợ phân tích dữ liệu hay giải đáp thắc mắc gì không ạ?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Quy tắc trừ điểm đồng phục?",
    "Lớp nào đang dẫn đầu thi đua?",
    "Học sinh vi phạm nhiều nhất tuần?",
    "Cách xử lý học sinh trốn tiết?"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customMsg?: string) => {
    const userMsg = customMsg || input;
    if (!userMsg.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await generateAIChatResponse(userMsg, messages, { students, violations });
    
    setMessages(prev => [...prev, { role: 'model', text: response || 'Lỗi kết nối máy chủ AI.' }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 h-[550px] rounded-2xl shadow-2xl flex flex-col border border-blue-100 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-blue-600 p-5 flex justify-between items-center text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <i className="fas fa-robot text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Trợ lý Gemini Pro</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">Hỗ trợ giáo dục</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-blue-200 transition-theme p-2">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 px-4 py-3 rounded-2xl shadow-sm border border-slate-100 rounded-tl-none text-xs font-semibold italic flex items-center gap-2">
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>Gemini đang phân tích dữ liệu...</span>
                </div>
              </div>
            )}
          </div>

          {!isLoading && messages.length === 1 && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gợi ý câu hỏi</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-theme font-medium"
              placeholder="Nhập câu hỏi tại đây..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-theme shadow-md disabled:opacity-50"
              disabled={isLoading}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white w-16 h-16 rounded-full shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-110 transition-theme flex items-center justify-center text-2xl group border-4 border-white"
        >
          <i className="fas fa-robot group-hover:rotate-12 transition-theme"></i>
        </button>
      )}
    </div>
  );
};

export default ChatBot;

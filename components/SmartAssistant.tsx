import React, { useState } from 'react';
import { DocumentFile, ChatMessage } from '../types';
import { summarizeDocument, chatWithDocument } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Sparkles, Send, Bot, User, RefreshCw, X, Loader2 } from 'lucide-react';

interface SmartAssistantProps {
  document: DocumentFile | null;
  onClose: () => void;
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ document, onClose }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');

  const handleSummarize = async () => {
    if (!document) return;
    setIsSummarizing(true);
    try {
      const base64 = await fileToBase64(document.file);
      const mimeType = document.type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const result = await summarizeDocument(base64, mimeType);
      setSummary(result);
    } catch (error) {
      setSummary("Không thể tạo tóm tắt. Vui lòng thử lại.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !document) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const base64 = await fileToBase64(document.file);
      const mimeType = document.type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      // Convert internal history format for Gemini if needed, but for simplicity we send just the context + new question for now or simple history
      // Ideally we maintain context in the service.
      const responseText = await chatWithDocument(base64, mimeType, userMsg.text);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu này.",
        timestamp: new Date(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  if (!document) {
    return <div className="p-4 text-center text-slate-500">Vui lòng chọn tài liệu để sử dụng AI.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl w-80 md:w-96 absolute right-0 top-0 bottom-0 z-20">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">Trợ lý AI</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Tóm tắt
        </button>
        <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Hỏi đáp
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {activeTab === 'summary' && (
            <div className="space-y-4">
                {!summary && !isSummarizing && (
                    <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                        <p className="text-slate-600 mb-4">Tạo bản tóm tắt nhanh cho tài liệu này.</p>
                        <button
                            onClick={handleSummarize}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 mx-auto"
                        >
                            <Sparkles className="w-4 h-4" />
                            Tạo tóm tắt
                        </button>
                    </div>
                )}

                {isSummarizing && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                        <p className="text-sm text-slate-500">Đang phân tích tài liệu...</p>
                    </div>
                )}

                {summary && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-slate-800">Tóm tắt nội dung</h4>
                            <button onClick={handleSummarize} className="text-slate-400 hover:text-indigo-600" title="Tạo lại">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="prose prose-sm prose-indigo text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {summary}
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 mb-4">
                    {chatHistory.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                             <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>Hãy đặt câu hỏi về nội dung tài liệu này.</p>
                        </div>
                    )}
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                    <span>{msg.role === 'user' ? 'Bạn' : 'Trợ lý AI'}</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isChatting && (
                         <div className="flex justify-start">
                             <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                 <div className="flex gap-1">
                                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                 </div>
                             </div>
                         </div>
                    )}
                </div>
            </div>
        )}
      </div>
      
      {activeTab === 'chat' && (
          <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleChat} className="relative">
                  <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Hỏi gì đó về tài liệu..."
                      className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                      disabled={isChatting}
                  />
                  <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                  >
                      <Send className="w-4 h-4" />
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};
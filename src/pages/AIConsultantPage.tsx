import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  ChevronLeft, 
  BarChart3,
  Zap,
  FileText,
  Activity
} from 'lucide-react';
import { Card, Button, Badge } from '../components/DesignSystem';
import { useAIConsultationStore } from '../store/aiConsultationStore';
import { usePetStore } from '../store/petStore';
import { QUICK_QUESTIONS } from '../types/ai-consultation';

interface AIConsultantPageProps {
  onNavigate: (page: string) => void;
}

export const AIConsultantPage: React.FC<AIConsultantPageProps> = ({ onNavigate }) => {
  const { 
    consultations, currentConsultationId, isTyping, sendAIMessage, createConsultation, getCurrentMessages } = useAIConsultationStore();
  const { currentPetId, getCurrentPet } = usePetStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentPet = getCurrentPet();
  const messages = getCurrentMessages();

  useEffect(() => {
    if (!currentConsultationId && currentPetId) {
      createConsultation(currentPetId, 'chat', '健康咨询');
    }
  }, [currentConsultationId, currentPetId, createConsultation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentConsultationId) return;
    
    const text = inputText;
    setInputText('');
    await sendAIMessage(currentConsultationId, text, currentPet?.type);
  };

  const handleQuickQuestion = async (question: string) => {
    if (!currentConsultationId) return;
    setInputText('');
    await sendAIMessage(currentConsultationId, question, currentPet?.type);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-800">AI健康顾问</h1>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                在线
              </p>
            </div>
          </div>
          <div className="flex-1" />
          <button 
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            onClick={() => onNavigate('health-analytics')}
          >
            <BarChart3 className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-neutral-100 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 text-sm font-medium whitespace-nowrap hover:from-primary-200 hover:to-primary-300 transition-all"
            >
              <Zap className="w-4 h-4" />
              快速咨询
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-sm font-medium whitespace-nowrap hover:from-blue-200 hover:to-blue-300 transition-all"
            >
              <FileText className="w-4 h-4" />
              健康报告
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-100 to-green-200 text-green-700 text-sm font-medium whitespace-nowrap hover:from-green-200 hover:to-green-300 transition-all"
            >
              <Activity className="w-4 h-4" />
              症状自查
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="font-semibold text-neutral-800 mb-2">你好！我是AI健康顾问</h2>
              <p className="text-sm text-neutral-500 mb-6">我可以帮你解答关于宠物健康的问题，提供专业建议</p>
              
              <div className="space-y-2">
                {QUICK_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-left hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div 
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : 'order-last'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-md'
                    : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neutral-200 to-neutral-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">我</span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 bg-white border border-neutral-200 rounded-2xl rounded-tl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-neutral-200 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-end gap-2">
            <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
              <Paperclip className="w-5 h-5 text-neutral-500" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="描述宠物的情况..."
                className="w-full px-4 py-3 bg-neutral-100 rounded-2xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className={`p-2 rounded-full transition-all ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
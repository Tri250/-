import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  ChevronLeft, 
  BarChart3,
  Zap,
  FileText,
  Activity,
  Mic,
  MicOff,
  Image,
  X,
  History,
  Trash2,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge } from '../components/DesignSystem';
import { useAIConsultationStore } from '../store/aiConsultationStore';
import { usePetStore } from '../store/petStore';
import { QUICK_QUESTIONS, MessageAttachment, AIMessage } from '../types/ai-consultation';

interface AIConsultantPageProps {
  onNavigate: (page: string) => void;
}

export const AIConsultantPage: React.FC<AIConsultantPageProps> = ({ onNavigate }) => {
  const { 
    consultations, 
    currentConsultationId, 
    isTyping, 
    sendAIMessage, 
    createConsultation, 
    getCurrentMessages,
    loadConversationHistory,
    deleteConversation,
    conversationHistories,
    setCurrentConsultation
  } = useAIConsultationStore();
  const { currentPetId, getCurrentPet } = usePetStore();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(44);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    if (currentPetId) {
      loadConversationHistory(currentPetId);
    }
  }, [currentPetId, loadConversationHistory]);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText, adjustTextareaHeight]);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && attachments.length === 0) || !currentConsultationId) return;
    
    const text = inputText;
    const currentAttachments = [...attachments];
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setTextareaHeight(44);
    }
    await sendAIMessage(currentConsultationId, text, currentAttachments);
  };

  const handleQuickQuestion = async (question: string) => {
    if (!currentConsultationId) return;
    setInputText('');
    await sendAIMessage(currentConsultationId, question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newAttachment: MessageAttachment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: 'image',
            url: event.target?.result as string,
            name: file.name,
            size: file.size,
          };
          setAttachments(prev => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const renderMessageContent = (message: AIMessage) => {
    const content = message.content;
    
    const formattedContent = content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('⚠️') || line.startsWith('📋') || line.startsWith('❓') || line.startsWith('ℹ️')) {
          return <p key={index} className="font-medium mb-1">{line}</p>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={index} className="font-semibold mb-1">{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <p key={index} className="ml-2 mb-0.5">{line}</p>;
        }
        if (line.match(/^\d+\.\s/)) {
          return <p key={index} className="ml-2 mb-0.5">{line}</p>;
        }
        if (line.startsWith('🐱') || line.startsWith('📝') || line.startsWith('💡')) {
          return <p key={index} className="font-medium mt-2 mb-1">{line}</p>;
        }
        return <p key={index} className="mb-1">{line}</p>;
      });

    return <div className="text-sm leading-relaxed">{formattedContent}</div>;
  };

  const renderAttachments = (messageAttachments?: MessageAttachment[]) => {
    if (!messageAttachments || messageAttachments.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {messageAttachments.map(attachment => (
          <div key={attachment.id} className="relative">
            <img 
              src={attachment.url} 
              alt={attachment.name || '上传图片'} 
              className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-neutral-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-success-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-error-500" />;
      default:
        return null;
    }
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
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-5 h-5 text-neutral-600" />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            onClick={() => onNavigate('health-analytics')}
          >
            <BarChart3 className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </header>

      {showHistory && (
        <div className="bg-white border-b border-neutral-200 px-4 py-3 animate-in slide-in-from-top">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-neutral-800">对话历史</h3>
              <button 
                className="text-xs text-neutral-500 hover:text-error-500 transition-colors"
                onClick={() => setShowHistory(false)}
              >
                关闭
              </button>
            </div>
            {conversationHistories.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">暂无历史对话</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {conversationHistories.map(history => (
                  <div 
                    key={history.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      history.id === currentConsultationId 
                        ? 'border-primary-300 bg-primary-50' 
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                    onClick={() => {
                      setCurrentConsultation(history.id);
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-neutral-800 truncate">{history.title}</p>
                        <p className="text-xs text-neutral-500 truncate">{history.lastMessage}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-neutral-400">{formatTime(history.updatedAt)}</span>
                        <button 
                          className="p-1 rounded hover:bg-error-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(history.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-error-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" size="sm">{history.messageCount}条消息</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${message.role === 'system' ? 'justify-center' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : 'order-last'} ${message.role === 'system' ? 'max-w-full' : ''}`}>
                {message.role === 'system' ? (
                  <div className="px-4 py-2 bg-neutral-100 rounded-lg text-center">
                    <p className="text-xs text-neutral-500">{message.content}</p>
                  </div>
                ) : (
                  <div>
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-md'
                        : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-md'
                    }`}>
                      {renderAttachments(message.attachments)}
                      {message.content && renderMessageContent(message)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-xs text-neutral-400">{formatTime(message.createdAt)}</span>
                      {message.role === 'user' && getMessageStatusIcon(message.status)}
                    </div>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neutral-200 to-neutral-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-neutral-600">我</span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-in fade-in">
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

      {attachments.length > 0 && (
        <div className="bg-white border-t border-neutral-100 px-4 py-2">
          <div className="max-w-md mx-auto">
            <div className="flex flex-wrap gap-2">
              {attachments.map(attachment => (
                <div key={attachment.id} className="relative group">
                  <img 
                    src={attachment.url} 
                    alt={attachment.name || '预览图片'} 
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <button
                    className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-t border-neutral-200 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <button 
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="w-5 h-5 text-neutral-500" />
            </button>
            <button 
              className={`p-2 rounded-full transition-all ${
                isRecording 
                  ? 'bg-error-100 text-error-500 animate-pulse' 
                  : 'hover:bg-neutral-100 text-neutral-500'
              }`}
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述宠物的情况... (Shift+Enter换行)"
                rows={1}
                className="w-full px-4 py-2.5 bg-neutral-100 rounded-2xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all resize-none overflow-hidden"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              {isRecording && (
                <div className="absolute inset-0 bg-error-50 rounded-2xl flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-error-500 animate-pulse" />
                    <span className="text-sm text-error-500">正在录音...</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() && attachments.length === 0}
              className={`p-2 rounded-full transition-all ${
                inputText.trim() || attachments.length > 0
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-2 text-center">
            提示：按 Enter 发送，Shift+Enter 换行
          </p>
        </div>
      </div>
    </div>
  );
};
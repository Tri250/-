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

interface AIConsultantPageProps {
  onNavigate: (page: string) => void;
}

const QUICK_QUESTIONS = [
  '我的猫最近食欲不振，怎么办？',
  '狗狗呕吐了需要去医院吗？',
  '如何判断宠物是否发烧？',
  '宠物驱虫多久一次？',
  '猫咪应激反应有哪些表现？',
  '狗狗换牙期需要注意什么？',
];

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
  const [attachments, setAttachments] = useState<Array<{id: string; type: string; url: string; name: string}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentPet = getCurrentPet();
  const messages = getCurrentMessages();

  useEffect(() => {
    const initializeConsultation = () => {
      try {
        if (!currentConsultationId) {
          const petId = currentPetId || 'default-pet';
          const newId = createConsultation(petId, 'chat', '健康咨询');
          if (newId) {
            setIsInitialized(true);
            if (pendingMessage) {
              sendAIMessage(newId, pendingMessage);
              setPendingMessage(null);
            }
          }
        } else if (currentConsultationId) {
          setIsInitialized(true);
          if (pendingMessage) {
            sendAIMessage(currentConsultationId, pendingMessage);
            setPendingMessage(null);
          }
        }
        
        if (currentPetId) {
          loadConversationHistory(currentPetId);
        }
      } catch (err) {
        console.error('初始化失败:', err);
        setError('页面初始化失败，请刷新重试');
      }
    };
    
    initializeConsultation();
  }, [currentConsultationId, currentPetId, createConsultation, loadConversationHistory, pendingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    try {
      const text = inputText.trim();
      
      if (!text && attachments.length === 0) return;
      
      let consultationId = currentConsultationId;
      
      if (!consultationId) {
        const petId = currentPetId || 'default-pet';
        consultationId = createConsultation(petId, 'chat', '健康咨询');
        if (!consultationId) {
          setError('无法创建会话，请刷新页面');
          return;
        }
      }
      
      setInputText('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = '44px';
      }
      
      await sendAIMessage(consultationId, text, attachments as any);
      setError(null);
    } catch (err) {
      console.error('发送消息失败:', err);
      setError('消息发送失败，请重试');
    }
  };

  const handleQuickQuestion = async (question: string) => {
    try {
      let consultationId = currentConsultationId;
      
      if (!consultationId) {
        const petId = currentPetId || 'default-pet';
        consultationId = createConsultation(petId, 'chat', '健康咨询');
        if (!consultationId) {
          setError('无法创建会话，请刷新页面');
          return;
        }
        setPendingMessage(question);
        return;
      }
      
      setInputText('');
      await sendAIMessage(consultationId, question);
      setError(null);
    } catch (err) {
      console.error('发送快速问题失败:', err);
      setError('操作失败，请重试');
    }
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
          const newAttachment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: 'image',
            url: event.target?.result as string,
            name: file.name,
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

  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  
  const startVoiceRecording = () => {
    setIsRecording(true);
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setError('请允许使用麦克风权限');
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
      setRecognitionInstance(recognition);
    } else {
      setError('您的浏览器不支持语音识别功能');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
  };

  const formatTime = (dateString: string) => {
    try {
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
    } catch {
      return '';
    }
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    
    return content.split('\n').map((line, index) => {
      if (line.startsWith('⚠️') || line.startsWith('📋') || line.startsWith('❓') || line.startsWith('ℹ️')) {
        return <p key={index} className="font-medium mb-1">{line}</p>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <p key={index} className="ml-2 mb-0.5 text-sm">{line}</p>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <p key={index} className="ml-2 mb-0.5 text-sm">{line}</p>;
      }
      if (line.startsWith('🐱') || line.startsWith('📝') || line.startsWith('💡')) {
        return <p key={index} className="font-medium mt-2 mb-1">{line}</p>;
      }
      return <p key={index} className="mb-1 text-sm leading-relaxed">{line}</p>;
    });
  };

  if (error && !isInitialized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">加载失败</h2>
          <p className="text-sm text-neutral-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-500 text-white rounded-xl font-medium"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-600" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
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
          
          <div className="flex items-center gap-1">
            <button 
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
              onClick={() => setShowHistory(!showHistory)}
              title="历史记录"
            >
              <History className="w-5 h-5 text-neutral-600" />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
              onClick={() => onNavigate('advanced-health')}
              title="健康分析"
            >
              <BarChart3 className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white border-b border-neutral-200 px-4 py-3 animate-in slide-in-from-top">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-neutral-800">对话历史</h3>
              <button 
                className="text-xs text-primary-500 hover:text-primary-600 transition-colors"
                onClick={() => setShowHistory(false)}
              >
                关闭
              </button>
            </div>
            
            {conversationHistories.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">暂无历史对话</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {conversationHistories.map(history => (
                  <div 
                    key={history.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
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
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-neutral-800 truncate">{history.title}</p>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{history.lastMessage}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-neutral-400">{formatTime(history.updatedAt)}</span>
                        <button 
                          className="p-1 rounded hover:bg-error-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(history.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-error-400" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <Badge variant="default" size="sm">{history.messageCount}条消息</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Action Tabs */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 text-sm font-medium whitespace-nowrap hover:from-primary-200 hover:to-primary-300 transition-all active:scale-95"
              onClick={() => {
                const randomQuestion = QUICK_QUESTIONS[Math.floor(Math.random() * QUICK_QUESTIONS.length)];
                handleQuickQuestion(randomQuestion);
              }}
            >
              <Zap className="w-4 h-4" />
              快速咨询
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-sm font-medium whitespace-nowrap hover:from-blue-200 hover:to-blue-300 transition-all active:scale-95"
              onClick={() => onNavigate('health-report')}
            >
              <FileText className="w-4 h-4" />
              健康报告
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-100 to-green-200 text-green-700 text-sm font-medium whitespace-nowrap hover:from-green-200 hover:to-green-300 transition-all active:scale-95"
              onClick={() => handleQuickQuestion('请帮我进行症状自查，我的宠物最近有什么异常表现？')}
            >
              <Activity className="w-4 h-4" />
              症状自查
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary-600" />
              </div>
              
              <h2 className="font-semibold text-neutral-800 mb-2 text-lg">你好！我是AI健康顾问</h2>
              <p className="text-sm text-neutral-500 mb-2">我可以帮你解答关于宠物健康的问题</p>
              <p className="text-xs text-neutral-400 mb-6">支持自定义输入病情描述、症状分析等</p>
              
              <div className="space-y-2 max-w-sm mx-auto">
                {QUICK_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-left hover:border-primary-300 hover:bg-primary-50/50 transition-all active:scale-[0.98]"
                  >
                    <span className="text-neutral-700">{question}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">💡 使用提示</p>
                <p className="text-xs text-blue-500">你可以直接在下方输入框描述宠物的症状、病情或任何健康问题，我会为你提供专业建议。</p>
              </div>
            </div>
          ) : (
            /* Message List */
            <>
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
                  
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    {message.role === 'system' ? (
                      <div className="px-4 py-2 bg-neutral-100 rounded-lg">
                        <p className="text-xs text-neutral-500">{message.content}</p>
                      </div>
                    ) : (
                      <div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-md'
                            : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-md shadow-sm'
                        }`}>
                          {renderMessageContent(message.content)}
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {message.attachments.map(attachment => (
                                <img 
                                  key={attachment.id}
                                  src={attachment.url} 
                                  alt={attachment.name || '图片'}
                                  className="max-w-[150px] max-h-[120px] rounded-lg object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-1 mt-1 px-1 ${message.role === 'user' ? 'justify-end' : ''}`}>
                          <span className="text-[10px] text-neutral-400">{formatTime(message.createdAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neutral-200 to-neutral-300 flex items-center justify-center flex-shrink-0 order-first">
                      <span className="text-sm font-medium text-neutral-600">我</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-neutral-200 rounded-2xl rounded-tl-md shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="bg-white border-t border-neutral-100 px-4 py-2">
          <div className="max-w-md mx-auto">
            <div className="flex flex-wrap gap-2">
              {attachments.map(attachment => (
                <div key={attachment.id} className="relative group">
                  <img 
                    src={attachment.url} 
                    alt={attachment.name || '预览图片'} 
                    className="w-16 h-16 rounded-lg object-cover border border-neutral-200"
                  />
                  <button
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border-t border-error-100 px-4 py-2">
          <div className="max-w-md mx-auto">
            <p className="text-xs text-error-600 text-center">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-neutral-200 px-4 py-3 safe-area-bottom">
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
              className="p-2.5 rounded-full hover:bg-neutral-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="上传图片"
            >
              <Image className="w-5 h-5 text-neutral-500" />
            </button>
            
            <button 
              className={`p-2.5 rounded-full transition-all ${
                isRecording 
                  ? 'bg-error-100 text-error-500 animate-pulse' 
                  : 'hover:bg-neutral-100 text-neutral-500'
              }`}
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              title={isRecording ? '停止录音' : '语音输入'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述宠物的情况或病情... (Enter发送)"
                rows={1}
                className="w-full px-4 py-2.5 bg-neutral-100 rounded-2xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white focus:shadow-sm transition-all resize-none overflow-hidden"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              
              {isRecording && (
                <div className="absolute inset-0 bg-error-50 rounded-2xl flex items-center justify-center z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-error-500 rounded-full animate-pulse" />
                    <span className="text-sm text-error-600 font-medium">正在录音...</span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() && attachments.length === 0}
              title="发送消息"
              className={`p-2.5 rounded-full transition-all ${
                inputText.trim() || attachments.length > 0
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30 active:scale-95'
                  : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-[10px] text-neutral-400 mt-2 text-center">
            按 Enter 发送 · Shift+Enter 换行 · 支持自定义输入病情描述
          </p>
        </div>
      </div>
    </div>
  );
};
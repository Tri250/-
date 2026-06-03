import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
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
  AlertCircle
} from 'lucide-react';
import { Badge } from '../components/DesignSystem';
import { useAIConsultationStore } from '../store/aiConsultationStore';
import { usePetStore } from '../store/petStore';
import { SymptomSelfCheck } from '../components/ai/SymptomSelfCheck';
import { SymptomAnalysisResult } from '../types/ai-consultation';

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
  const [showSymptomCheck, setShowSymptomCheck] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const _currentPet = getCurrentPet();
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

  // 初始化完成后聚焦输入框
  useEffect(() => {
    if (isInitialized && !isTyping) {
      textareaRef.current?.focus();
    }
  }, [isInitialized, isTyping]);

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
      
      await sendAIMessage(consultationId, text, attachments.map(a => ({
        ...a,
        type: a.type as 'image' | 'voice'
      })));
      setError(null);
      
      // 发送消息后重新聚焦输入框，确保连续对话
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
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
      
      // 发送快速问题后重新聚焦输入框
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  
  const startVoiceRecording = () => {
    setIsRecording(true);
    
    // 使用类型安全的方式访问语音识别API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + transcript);
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // 空行处理
      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }
      
      // 标题行处理
      if (line.startsWith('⚠️') || line.startsWith('📋') || line.startsWith('❓') || line.startsWith('ℹ️') || line.startsWith('🚨') || line.startsWith('🔴')) {
        return <p key={index} className="font-medium mb-1.5">{line}</p>;
      }
      
      // 加粗文本
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      
      // 列表项
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <p key={index} className="ml-2 mb-1 text-sm leading-relaxed">{line}</p>;
      }
      
      // 数字列表
      if (line.match(/^\d+\.\s/)) {
        return <p key={index} className="ml-2 mb-1 text-sm leading-relaxed">{line}</p>;
      }
      
      // 特殊标记行
      if (line.startsWith('🐱') || line.startsWith('📝') || line.startsWith('💡') || line.startsWith('🔍') || line.startsWith('🌐') || line.startsWith('💊') || line.startsWith('🏥')) {
        return <p key={index} className="font-medium mt-2 mb-1">{line}</p>;
      }
      
      // 普通文本行
      return <p key={index} className="mb-1 text-sm leading-relaxed">{line}</p>;
    });
  };

  const handleSymptomAnalysisComplete = (result: SymptomAnalysisResult) => {
    // 结果已在组件内部处理
    console.log('症状分析完成:', result);
  };

  const handleSymptomCheckCancel = () => {
    setShowSymptomCheck(false);
  };

  const handleSymptomCheckFinish = async (result: SymptomAnalysisResult) => {
    // 将症状自查结果发送到对话中
    const symptomNames = result.selectedSymptoms.map(s => s.name).join('、');
    const urgencyLabels = { observe: '观察', consult: '就医', emergency: '急诊' };
    
    const summaryMessage = `症状自查完成：\n` +
      `- 已选症状：${symptomNames}\n` +
      `- 严重程度：${result.severityScore.toFixed(1)}/10\n` +
      `- 建议措施：${urgencyLabels[result.urgencyLevel]}\n` +
      `- 可能原因：${result.preliminaryDiagnosis.slice(0, 3).join('、') || '待进一步检查'}`;

    let consultationId = currentConsultationId;
    if (!consultationId) {
      const petId = currentPetId || 'default-pet';
      consultationId = createConsultation(petId, 'symptom_check', '症状自查');
      if (!consultationId) {
        setError('无法创建会话，请刷新页面');
        return;
      }
    }

    await sendAIMessage(consultationId, summaryMessage);
    setShowSymptomCheck(false);
  };

  if (error && !isInitialized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">加载失败</h2>
          <p className="text-sm text-neutral-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            aria-label="刷新页面"
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
      <header className="bg-white border-b border-neutral-200 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            type="button"
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            aria-label="返回首页"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-600" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-800">AI健康顾问</h1>
              <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                </span>
                在线咨询中
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              type="button"
              className="p-2 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              onClick={() => setShowHistory(!showHistory)}
              title="历史记录"
              aria-label="查看历史记录"
              aria-expanded={showHistory}
            >
              <History className="w-5 h-5 text-neutral-600" />
            </button>
            <button 
              type="button"
              className="p-2 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              onClick={() => onNavigate('advanced-health')}
              title="健康分析"
              aria-label="查看健康分析"
            >
              <BarChart3 className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white border-b border-neutral-200 px-4 py-3 animate-in slide-in-from-top duration-200" role="dialog" aria-label="对话历史">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-neutral-800">对话历史</h3>
              <button 
                type="button"
                className="text-xs text-primary-500 hover:text-primary-600 active:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded px-2 py-1"
                onClick={() => setShowHistory(false)}
                aria-label="关闭历史记录"
              >
                关闭
              </button>
            </div>
            
            {conversationHistories.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">暂无历史对话</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto" role="listbox" aria-label="历史对话列表">
                {conversationHistories.map(history => (
                  <div 
                    key={history.id}
                    role="option"
                    aria-selected={history.id === currentConsultationId}
                    tabIndex={0}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      history.id === currentConsultationId 
                        ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-500/20' 
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 bg-white'
                    }`}
                    onClick={() => {
                      setCurrentConsultation(history.id);
                      setShowHistory(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setCurrentConsultation(history.id);
                        setShowHistory(false);
                      }
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
                          type="button"
                          className="p-1.5 rounded hover:bg-error-100 active:bg-error-200 transition-colors focus:outline-none focus:ring-2 focus:ring-error-500/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(history.id);
                          }}
                          aria-label={`删除对话：${history.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-error-400" />
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
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="快捷操作">
            <button 
              type="button"
              disabled={isTyping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 text-sm font-medium whitespace-nowrap hover:from-primary-200 hover:to-primary-300 active:from-primary-300 active:to-primary-400 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              onClick={() => {
                const randomQuestion = QUICK_QUESTIONS[Math.floor(Math.random() * QUICK_QUESTIONS.length)];
                handleQuickQuestion(randomQuestion);
              }}
              aria-label="快速咨询"
            >
              <Zap className="w-4 h-4" />
              快速咨询
            </button>
            <button 
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-sm font-medium whitespace-nowrap hover:from-blue-200 hover:to-blue-300 active:from-blue-300 active:to-blue-400 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              onClick={() => onNavigate('health-report')}
              aria-label="查看健康报告"
            >
              <FileText className="w-4 h-4" />
              健康报告
            </button>
            <button 
              type="button"
              disabled={isTyping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-100 to-green-200 text-green-700 text-sm font-medium whitespace-nowrap hover:from-green-200 hover:to-green-300 active:from-green-300 active:to-green-400 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              onClick={() => setShowSymptomCheck(true)}
              aria-label="开始症状自查"
            >
              <Activity className="w-4 h-4" />
              症状自查
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" role="log" aria-label="消息列表" aria-live="polite">
        <div className="max-w-md mx-auto space-y-4">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4 shadow-sm">
                <Bot className="w-8 h-8 text-primary-600" />
              </div>
              
              <h2 className="font-semibold text-neutral-800 mb-2 text-lg">你好！我是AI健康顾问</h2>
              <p className="text-sm text-neutral-500 mb-2">我可以帮你解答关于宠物健康的问题</p>
              <p className="text-xs text-neutral-400 mb-6">支持自定义输入病情描述、症状分析等</p>
              
              <div className="space-y-2 max-w-sm mx-auto" role="list" aria-label="快速问题列表">
                {QUICK_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={isTyping}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-left hover:border-primary-300 hover:bg-primary-50/50 active:border-primary-400 active:bg-primary-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`快速提问：${question}`}
                  >
                    <span className="text-neutral-700">{question}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100" role="note">
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
                  role="article"
                  aria-label={message.role === 'user' ? '用户消息' : message.role === 'assistant' ? 'AI回复' : '系统消息'}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${message.role === 'system' ? 'justify-center' : ''} animate-in fade-in-0 slide-in-from-bottom-4 duration-300`}
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm" aria-hidden="true">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${message.role === 'user' ? '' : ''}`}>
                    {message.role === 'system' ? (
                      <div className="px-4 py-2 bg-neutral-100 rounded-lg">
                        <p className="text-xs text-neutral-500">{message.content || '系统消息'}</p>
                      </div>
                    ) : (
                      <div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-md shadow-sm'
                            : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-md shadow-sm'
                        }`}>
                          {message.content ? renderMessageContent(message.content) : <span className="text-neutral-400 text-sm">空消息</span>}
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {message.attachments.map(attachment => (
                                <img 
                                  key={attachment.id}
                                  src={attachment.url} 
                                  alt={attachment.name || '附件图片'}
                                  className="max-w-[150px] max-h-[120px] rounded-lg object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-1 mt-1 px-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <Clock className="w-3 h-3 text-neutral-300" aria-hidden="true" />
                          <time className="text-[10px] text-neutral-400" dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center flex-shrink-0 shadow-sm" aria-hidden="true">
                      <span className="text-sm font-medium text-white">我</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator - 使用更柔和的动画 */}
              {isTyping && (
                <div className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-200" role="status" aria-label="AI正在输入">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm" aria-hidden="true">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-neutral-200 rounded-2xl rounded-tl-md shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="bg-white border-t border-neutral-100 px-4 py-2" role="group" aria-label="附件预览">
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
                    type="button"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-error-600 active:bg-error-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-error-500/30"
                    onClick={() => removeAttachment(attachment.id)}
                    aria-label={`移除附件：${attachment.name || '预览图片'}`}
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
        <div className="bg-error-50 border-t border-error-100 px-4 py-2" role="alert" aria-live="assertive">
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
              aria-label="选择图片文件"
            />
            
            <button 
              type="button"
              className="p-2.5 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              onClick={() => fileInputRef.current?.click()}
              title="上传图片"
              aria-label="上传图片附件"
            >
              <Image className="w-5 h-5 text-neutral-500" />
            </button>
            
            <button 
              type="button"
              className={`p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 ${
                isRecording 
                  ? 'bg-error-100 text-error-500 ring-2 ring-error-500/30 animate-pulse' 
                  : 'hover:bg-neutral-100 active:bg-neutral-200 text-neutral-500 ring-primary-500/30'
              }`}
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              title={isRecording ? '停止录音' : '语音输入'}
              aria-label={isRecording ? '停止录音' : '开始语音输入'}
              aria-pressed={isRecording}
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
                disabled={isRecording}
                className="w-full px-4 py-2.5 bg-neutral-100 rounded-2xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white focus:shadow-sm transition-all resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                aria-label="消息输入框"
                aria-disabled={isRecording}
              />
              
              {isRecording && (
                <div className="absolute inset-0 bg-error-50 rounded-2xl flex items-center justify-center z-10" role="status" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-error-500 rounded-full animate-pulse" />
                    <span className="text-sm text-error-600 font-medium">正在录音...</span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && attachments.length === 0) || isRecording}
              title="发送消息"
              aria-label="发送消息"
              aria-disabled={(!inputText.trim() && attachments.length === 0) || isRecording}
              className={`p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 ${
                (inputText.trim() || attachments.length > 0) && !isRecording
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 focus:ring-primary-500/30'
                  : 'bg-neutral-100 text-neutral-300 cursor-not-allowed focus:ring-neutral-300/30'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-[10px] text-neutral-400 mt-2 text-center" role="note">
            按 Enter 发送 · Shift+Enter 换行 · 支持自定义输入病情描述
          </p>
        </div>
      </div>

      {/* Symptom Self-Check Modal */}
      {showSymptomCheck && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="症状自查">
          <div className="w-full max-w-md">
            <SymptomSelfCheck
              onAnalysisComplete={handleSymptomAnalysisComplete}
              onCancel={handleSymptomCheckCancel}
              onConfirmResult={handleSymptomCheckFinish}
            />
          </div>
        </div>
      )}
    </div>
  );
};
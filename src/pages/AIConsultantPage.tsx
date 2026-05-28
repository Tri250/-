
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Sparkles, MessageCircle, Clock, FileText } from 'lucide-react';
import { Card } from '../components/DesignSystem/Card';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  createdAt: string;
}

const quickQuestions = [
  '我的宠物最近食欲不好怎么办？',
  '如何给猫咪剪指甲？',
  '狗狗拉肚子应该注意什么？',
  '宠物疫苗多久打一次？',
];

const mockResponses: Record<string, { content: string; suggestions: string[] }> = {
  '我的宠物最近食欲不好怎么办？': {
    content: '您好！猫咪食欲不好可能有多种原因，包括：1) 环境变化或压力；2) 食物问题；3) 健康问题。建议您：首先观察猫咪的精神状态，如果精神好可能只是挑食，可以尝试更换食物或添加湿粮。如果精神萎靡、伴随呕吐腹泻，建议及时就医检查。',
    suggestions: ['观察排便情况', '测量体温', '检查口腔', '考虑驱虫'],
  },
  '如何给猫咪剪指甲？': {
    content: '给猫咪剪指甲需要耐心和技巧：1) 选择安静环境，让猫咪放松；2) 轻轻握住爪子，按压脚垫露出指甲；3) 只剪透明部分，避开粉色血线；4) 如果猫咪抗拒，可以分次进行，每次剪1-2个爪子。剪完后可以给零食奖励。',
    suggestions: ['使用专用指甲剪', '准备止血粉备用', '保持光线充足', '定期修剪'],
  },
  default: {
    content: '感谢您的提问！根据您的描述，我为您整理了一些建议：\n\n首先，请观察宠物的日常行为变化，注意饮食、排便和精神状态。如果问题持续超过24小时或伴有其他症状，建议及时咨询兽医进行专业检查。\n\n如需更详细的建议，请提供更多具体信息，比如宠物的年龄、品种、症状持续时间等。',
    suggestions: ['记录详细症状', '测量体温', '观察精神状态', '准备就医'],
  },
};

export default function AIConsultantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是您的AI健康顾问。请问有什么可以帮您的吗？您可以描述宠物的症状，我会为您提供专业的健康建议。',
      suggestions: ['食欲问题', '行为异常', '健康检查', '日常护理'],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = mockResponses[inputValue] || mockResponses.default;
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: response.content,
        suggestions: response.suggestions,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-800">AI健康顾问</h1>
          <p className="text-sm text-neutral-500 mt-1">专业宠物健康咨询服务</p>
        </div>
      </div>

      {/* 快捷问题 */}
      <div className="bg-white border-b">
        <div className="px-4 py-3">
          <p className="text-sm text-neutral-500 mb-2">常见问题</p>
          <div className="flex gap-2 overflow-x-auto">
            {quickQuestions.map((question, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleQuickQuestion(question)}
                className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-full text-sm whitespace-nowrap hover:bg-primary-100 hover:text-primary-700 transition-colors"
              >
                {question}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* 头像和名称 */}
              <div className={`flex items-center gap-2 mb-1 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-primary-500 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  {message.role === 'user' ? (
                    <MessageCircle size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </div>
                <span className="text-xs text-neutral-500">
                  {message.role === 'user' ? '我' : 'AI顾问'}
                </span>
                <span className="text-xs text-neutral-400">{formatTime(message.createdAt)}</span>
              </div>
              
              {/* 消息内容 */}
              <Card 
                className={`p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary-500 text-white rounded-2xl rounded-br-md' 
                    : 'bg-white rounded-2xl rounded-bl-md'
                }`}
              >
                <p className={`text-sm whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-white' : 'text-neutral-800'
                }`}>
                  {message.content}
                </p>
                
                {/* 建议标签 */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className={`flex flex-wrap gap-1.5 mt-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    {message.suggestions.map((suggestion, index) => (
                      <span 
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${
                          message.role === 'user' 
                            ? 'bg-white/20 text-white' 
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {suggestion}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </motion.div>
        ))}

        {/* 正在输入提示 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <span className="text-xs text-neutral-500">AI顾问</span>
              </div>
              <Card className="p-3 bg-white rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-3">
          <button className="p-2.5 text-neutral-500 hover:text-primary-500 transition-colors">
            <Paperclip size={20} />
          </button>
          <button className="p-2.5 text-neutral-500 hover:text-primary-500 transition-colors">
            <FileText size={20} />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="输入您的问题..."
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

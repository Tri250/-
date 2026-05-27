import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  ChevronLeft, 
  BarChart3,
  Zap,
  FileText,
  Activity,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge } from '../components/DesignSystem';
import { useAIConsultationStore } from '../store/aiConsultationStore';
import { usePetStore } from '../store/petStore';
import { QUICK_QUESTIONS } from '../types/ai-consultation';
import { motion, AnimatePresence } from 'framer-motion';

interface AIConsultantPageProps {
  onNavigate: (page: string) => void;
}

export const AIConsultantPage: React.FC<AIConsultantPageProps> = ({ onNavigate }) => {
  const { 
    consultations, currentConsultationId, isTyping, sendAIMessage, createConsultation, getCurrentMessages, getTrendReport } = useAIConsultationStore();
  const { currentPetId, getCurrentPet } = usePetStore();
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'report' | 'checkup'>('chat');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCheckupModal, setShowCheckupModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentPet = getCurrentPet();
  const messages = getCurrentMessages();

  const symptoms = [
    { id: 'loss_appetite', label: '食欲不振', icon: '🍽️' },
    { id: 'lethargy', label: '精神萎靡', icon: '😴' },
    { id: 'vomiting', label: '呕吐', icon: '🤢' },
    { id: 'diarrhea', label: '腹泻', icon: '💩' },
    { id: 'coughing', label: '咳嗽', icon: '🤧' },
    { id: 'sneezing', label: '打喷嚏', icon: '😤' },
    { id: 'itching', label: '皮肤瘙痒', icon: '🦟' },
    { id: 'hair_loss', label: '脱毛', icon: '🪶' },
    { id: 'weight_loss', label: '体重下降', icon: '⚖️' },
    { id: 'eye_discharge', label: '眼部分泌物', icon: '👀' },
    { id: 'bad_breath', label: '口臭', icon: '😷' },
    { id: 'urinary_issue', label: '排尿异常', icon: '🚽' },
  ];

  const trendReport = getTrendReport(currentPetId || '1', 'month');

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
    await sendAIMessage(currentConsultationId, text);
  };

  const handleQuickQuestion = async (question: string) => {
    if (!currentConsultationId) return;
    setInputText('');
    await sendAIMessage(currentConsultationId, question);
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
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              快速咨询
            </button>
            <button 
              onClick={() => setShowReportModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'report'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              健康报告
            </button>
            <button 
              onClick={() => setShowCheckupModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'checkup'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
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

      {/* 健康报告模态框 */}
      <AnimatePresence>
        {showReportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">健康报告</h3>
                <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4">
                    <span className="text-3xl">🐾</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{currentPet?.name}的月度健康报告</h2>
                  <p className="text-sm text-gray-500 mt-1">生成时间: {new Date().toLocaleDateString('zh-CN')}</p>
                </div>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">总体评估</h4>
                    <Badge variant="success" size="sm">优秀</Badge>
                  </div>
                  <p className="text-gray-600 text-sm">{trendReport.summary}</p>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{trendReport.weight.change >= 0 ? '+' : ''}{trendReport.weight.change}kg</div>
                    <div className="text-xs text-gray-500">体重变化</div>
                    <div className="text-xs text-gray-400 mt-1">趋势: {trendReport.weight.trend === 'stable' ? '稳定' : trendReport.weight.trend === 'up' ? '上升' : '下降'}</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{trendReport.activity.change}</div>
                    <div className="text-xs text-gray-500">活动时长(分钟)</div>
                    <div className="text-xs text-gray-400 mt-1">趋势: {trendReport.activity.trend === 'stable' ? '稳定' : trendReport.activity.trend === 'up' ? '增加' : '减少'}</div>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">AI建议</h4>
                  <ul className="space-y-2">
                    {trendReport.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </Card>

                <button
                  onClick={() => setShowReportModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium"
                >
                  关闭报告
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 症状自查模态框 */}
      <AnimatePresence>
        {showCheckupModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckupModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">症状自查</h3>
                <button onClick={() => setShowCheckupModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600">请选择{currentPet?.name}出现的症状（可多选）</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => setSelectedSymptoms(prev => 
                      prev.includes(symptom.id) 
                        ? prev.filter(id => id !== symptom.id)
                        : [...prev, symptom.id]
                    )}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      selectedSymptoms.includes(symptom.id)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{symptom.icon}</span>
                    <span className="text-xs font-medium">{symptom.label}</span>
                    {selectedSymptoms.includes(symptom.id) && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSymptoms([])}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  重置选择
                </button>
                <button
                  onClick={() => {
                    if (selectedSymptoms.length === 0) {
                      alert('请至少选择一个症状');
                      return;
                    }
                    const symptomLabels = selectedSymptoms.map(id => symptoms.find(s => s.id === id)?.label).join('、');
                    if (currentConsultationId) {
                      sendAIMessage(currentConsultationId, `我的宠物出现了以下症状：${symptomLabels}，请问是什么原因？应该怎么办？`);
                    }
                    setShowCheckupModal(false);
                    setSelectedSymptoms([]);
                    setActiveTab('chat');
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium"
                >
                  分析症状
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
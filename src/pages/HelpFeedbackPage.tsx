import React, { useState } from 'react';
import { 
  ChevronLeft, 
  HelpCircle, 
  MessageSquare, 
  Send,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Video,
  FileText,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Card, Button } from '../components/DesignSystem';

interface HelpFeedbackPageProps {
  onNavigate: (page: string) => void;
}

export const HelpFeedbackPage: React.FC<HelpFeedbackPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'help' | 'feedback'>('help');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tabs = [
    { id: 'help', label: '帮助中心', icon: HelpCircle },
    { id: 'feedback', label: '意见反馈', icon: MessageSquare },
  ];

  const faqs = [
    {
      question: '如何使用宠物翻译功能？',
      answer: '点击首页的翻译按钮，录制或上传宠物声音，AI将自动分析并翻译宠物的情绪和需求。支持猫咪、狗狗等多种宠物类型。'
    },
    {
      question: '会员有什么特权？',
      answer: 'Pro会员享有无限翻译次数、高级AI分析、健康报告导出、专属客服支持等特权。年费会员还可获得额外优惠。'
    },
    {
      question: '如何添加多只宠物？',
      answer: '进入"我的"页面，点击宠物卡片右上角的"+"按钮，填写宠物信息即可添加。您可以添加多只宠物并随时切换。'
    },
    {
      question: '数据安全吗？',
      answer: '我们采用银行级加密技术保护您的数据。所有数据存储在安全的云端服务器，未经您的授权不会与任何第三方共享。'
    },
    {
      question: '如何联系客服？',
      answer: '您可以通过本页面的"意见反馈"功能提交问题，或发送邮件至 support@pawsync.com，我们将在24小时内回复。'
    },
  ];

  const helpLinks = [
    { icon: BookOpen, label: '使用指南', description: '详细功能介绍' },
    { icon: Video, label: '视频教程', description: '新手入门视频' },
    { icon: FileText, label: '常见问题', description: 'FAQ快速解答' },
  ];

  const handleSubmitFeedback = () => {
    if (feedbackText.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFeedbackText('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('profile')}
            className="p-2 -ml-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">帮助与反馈</h1>
            <p className="text-sm text-white/80">我们随时为您服务</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'help' | 'feedback')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 space-y-6">
        {activeTab === 'help' ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {helpLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Card key={index} className="text-center p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                      <Icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-neutral-800">{link.label}</p>
                    <p className="text-xs text-neutral-500">{link.description}</p>
                  </Card>
                );
              })}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">常见问题</h2>
              <Card className="overflow-hidden">
                {faqs.map((faq, index) => (
                  <div 
                    key={index}
                    className={`border-b border-neutral-100 last:border-b-0`}
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="font-medium text-neutral-800 pr-4">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-4 pb-4 text-sm text-neutral-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </div>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-800">联系客服</p>
                  <p className="text-sm text-neutral-500">support@pawsync.com</p>
                </div>
                <ExternalLink className="w-5 h-5 text-neutral-400" />
              </div>
            </Card>
          </>
        ) : (
          <>
            {submitted ? (
              <Card className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">感谢您的反馈！</h3>
                <p className="text-sm text-neutral-500">我们会认真查看并尽快回复</p>
              </Card>
            ) : (
              <>
                <Card className="p-4">
                  <h3 className="font-semibold text-neutral-800 mb-4">反馈类型</h3>
                  <div className="flex gap-2">
                    {[
                      { id: 'bug', label: '问题反馈', emoji: '🐛' },
                      { id: 'suggestion', label: '功能建议', emoji: '💡' },
                      { id: 'other', label: '其他', emoji: '📝' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setFeedbackType(type.id as 'bug' | 'suggestion' | 'other')}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                          feedbackType === type.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        <span className="mr-1">{type.emoji}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold text-neutral-800 mb-4">详细描述</h3>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="请详细描述您遇到的问题或建议..."
                    rows={6}
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-neutral-800"
                  />
                  <p className="text-xs text-neutral-400 mt-2 text-right">{feedbackText.length}/500</p>
                </Card>

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackText.trim()}
                  className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    feedbackText.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                  提交反馈
                </Button>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};
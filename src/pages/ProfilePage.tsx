import { useState } from 'react';
import { User, Edit, History, Settings, Crown, Star, Heart, ChevronRight, Camera, X, Info, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { icon: History, label: '分析历史', description: '查看所有翻译记录', action: 'history' },
  { icon: Heart, label: '收藏', description: '收藏的精彩时刻', action: 'favorites' },
  { icon: Settings, label: '设置', description: '隐私、通知等设置', action: 'settings' },
  { icon: Star, label: '帮助与反馈', description: '使用帮助与问题反馈', action: 'help' },
];

export function ProfilePage() {
  const { currentPet, analyses } = useAppStore();
  const [showEdit, setShowEdit] = useState(false);
  const [petName, setPetName] = useState(currentPet?.name || '');
  const [petBreed, setPetBreed] = useState(currentPet?.breed || '');
  const [petAge, setPetAge] = useState(currentPet?.age.toString() || '');
  const [showModal, setShowModal] = useState<'history' | 'settings' | 'help' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const recentAnalyses = analyses.slice(-3).reverse();

  const emotionEmoji = {
    happy: '😸',
    anxious: '😰',
    angry: '😾',
    needs: '🥺',
    neutral: '😐',
  };

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'history':
        setShowModal('history');
        break;
      case 'settings':
        setShowModal('settings');
        break;
      case 'help':
        setShowModal('help');
        break;
      case 'favorites':
        alert('收藏功能正在开发中，敬请期待！');
        break;
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      alert('请输入反馈内容');
      return;
    }
    alert('感谢您的反馈！我们会认真处理您的意见。');
    setFeedbackText('');
    setShowModal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-white to-pink-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-purple-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 text-center">宠物档案</h1>
          <p className="text-xs text-gray-400 text-center">管理 {currentPet?.name} 的信息</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-peach-500 flex items-center justify-center text-4xl shadow-lg">
                {emotionEmoji[analyses.length > 0 ? analyses[analyses.length - 1].result.emotion : 'happy']}
              </div>
              <button 
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {showEdit ? (
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className="text-xl font-bold text-gray-800 bg-transparent border-b border-purple-300 focus:outline-none"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-800">{petName}</h2>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEdit(!showEdit);
                  }}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {showEdit ? <X className="w-4 h-4 text-gray-500" /> : <Edit className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {showEdit ? (
                  <input
                    type="text"
                    value={petBreed}
                    onChange={(e) => setPetBreed(e.target.value)}
                    className="text-sm text-gray-500 bg-transparent border-b border-gray-200 focus:outline-none"
                  />
                ) : (
                  <span className="text-sm text-gray-500">{petBreed}</span>
                )}
                <span className="text-gray-300">·</span>
                {showEdit ? (
                  <input
                    type="text"
                    value={petAge}
                    onChange={(e) => setPetAge(e.target.value)}
                    className="text-sm text-gray-500 bg-transparent border-b border-gray-200 focus:outline-none w-12"
                  />
                ) : (
                  <span className="text-sm text-gray-500">{petAge} 岁</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-xs">
                  <Crown className="w-3 h-3" />
                  Pro会员
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{analyses.length}</p>
              <p className="text-xs text-purple-100">翻译次数</p>
            </div>
            <div>
              <p className="text-2xl font-bold">128</p>
              <p className="text-xs text-purple-100">守护天数</p>
            </div>
            <div>
              <p className="text-2xl font-bold">98%</p>
              <p className="text-xs text-purple-100">健康率</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">最近翻译</h3>
          {recentAnalyses.length > 0 ? (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                    {emotionEmoji[analysis.result.emotion]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{analysis.result.translation}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(analysis.createdAt).toLocaleDateString('zh-CN', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{analysis.result.confidence}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">暂无翻译记录</p>
              <p className="text-xs text-gray-400 mt-1">快去使用翻译功能吧</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMenuClick(item.action);
                }}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-orange-100 to-peach-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Info className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">关于开发者</p>
              <p className="text-xs text-gray-500">带娃的小陈工 · 用心打造每一个功能</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400">PawSync Pro v1.0.0</p>
          <p className="text-xs text-gray-300 mt-1">爪印同频 · 守护版</p>
          <p className="text-xs text-gray-300 mt-1">🐾 带娃的小陈工 出品</p>
        </div>

        {/* 模态框 */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(null)}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">
                    {showModal === 'history' ? '分析历史' : showModal === 'settings' ? '设置' : '帮助与反馈'}
                  </h3>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowModal(null);
                    }} 
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {showModal === 'history' && (
                  <div className="space-y-3">
                    {analyses.length > 0 ? (
                      analyses.slice().reverse().map((analysis) => (
                        <div key={analysis.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                            {emotionEmoji[analysis.result.emotion]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">{analysis.result.translation}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(analysis.createdAt).toLocaleDateString('zh-CN', { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">{analysis.result.confidence}%</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">暂无分析记录</p>
                      </div>
                    )}
                  </div>
                )}

                {showModal === 'settings' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700">推送通知</span>
                      <div className="w-10 h-6 bg-primary-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700">深色模式</span>
                      <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700">语音提醒</span>
                      <div className="w-10 h-6 bg-primary-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                    >
                      清除缓存
                    </button>
                  </div>
                )}

                {showModal === 'help' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">使用帮助</h4>
                      <ul className="text-sm text-blue-700 space-y-2">
                        <li>• 点击首页的快捷入口可以快速进入各个功能</li>
                        <li>• 使用AI翻译机可以翻译宠物的叫声和表情</li>
                        <li>• 健康手册提供专业的宠物护理知识</li>
                        <li>• 设置智能提醒，不错过重要事项</li>
                      </ul>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">问题反馈</label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="请描述您遇到的问题或建议..."
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all resize-none"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSubmitFeedback();
                        }}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium"
                      >
                        提交反馈
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
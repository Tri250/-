import { useState, useMemo, memo, useCallback } from 'react';
import { Edit, History, Settings, Crown, Star, Heart, ChevronRight, Camera, X } from 'lucide-react';
import { useAppStore, Analysis } from '../store/appStore';

// Memoize menu items for performance
const menuItems = [
  { icon: History, label: '分析历史', description: '查看所有翻译记录' },
  { icon: Settings, label: '设置', description: '隐私、通知等设置' },
  { icon: Heart, label: '收藏', description: '收藏的精彩时刻' },
  { icon: Star, label: '帮助与反馈', description: '使用帮助与问题反馈' },
];

const emotionEmoji = {
  happy: '😸',
  anxious: '😰',
  angry: '😾',
  needs: '🥺',
  neutral: '😐',
};

// Memoized menu item component
const MenuItem = memo(function MenuItem({ 
  item 
}: { 
  item: typeof menuItems[0] 
}) {
  const Icon = item.icon;
  return (
    <button
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
});

// Memoized analysis card component
const RecentAnalysisItem = memo(function RecentAnalysisItem({ 
  analysis 
}: { 
  analysis: Analysis 
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
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
  );
});

export const ProfilePage = memo(function ProfilePage() {
  const { currentPet, analyses } = useAppStore();
  const [showEdit, setShowEdit] = useState(false);
  const [petName, setPetName] = useState(currentPet?.name || '');
  const [petBreed, setPetBreed] = useState(currentPet?.breed || '');
  const [petAge, setPetAge] = useState(currentPet?.age.toString() || '');

  // Memoize recent analyses to prevent unnecessary re-calculations
  const recentAnalyses = useMemo(() => 
    analyses.slice(-3).reverse(), 
  [analyses]);

  const currentEmotion = useMemo(() => 
    analyses.length > 0 ? analyses[analyses.length - 1].result.emotion : 'happy',
  [analyses]);

  const handleEditToggle = useCallback(() => {
    setShowEdit(prev => !prev);
  }, []);

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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-4xl shadow-lg">
                {emotionEmoji[currentEmotion]}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
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
                  onClick={handleEditToggle}
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
                <RecentAnalysisItem key={analysis.id} analysis={analysis} />
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
          {menuItems.map((item) => (
            <MenuItem key={item.label} item={item} />
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400">PawSync Pro v1.0.0</p>
          <p className="text-xs text-gray-300 mt-1">爪印同频 · 守护版</p>
          <div className="mt-4 px-4 py-3 bg-gradient-to-r from-orange-50 to-cyan-50 rounded-xl border border-orange-100/50">
            <p className="text-xs text-gray-600 font-medium">开发者：带娃的小陈工</p>
            <p className="text-[10px] text-gray-400 mt-1">专注AI驱动的宠物关爱 · 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
});

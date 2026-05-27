import React, { useState } from 'react';
import { 
  ChevronRight, 
  Heart, 
  Bot, 
  FileText, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Activity,
  Star,
  Clock,
  Settings,
  Plus
} from 'lucide-react';
import { Card, Button, ProgressRing, Badge } from '../components/DesignSystem';
import { useAppStore } from '../store/appStore';
import { useBondStore } from '../store/bondStore';
import { usePetStore } from '../store/petStore';
import { useReminderStore } from '../store/reminderStore';
import { useHealthRecordStore } from '../store/healthRecordStore';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// 卡片配置类型
type CardType = 'reminders' | 'recent_records' | 'bond_metrics' | 'quick_actions' | 'pet_status';

interface CardConfig {
  id: CardType;
  title: string;
  icon: any;
  visible: boolean;
  order: number;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentEmotion, healthScore } = useAppStore();
  const { metrics, badges, totalPoints, streakDays } = useBondStore();
  const { pets, currentPetId, setCurrentPet, getCurrentPet } = usePetStore();
  const { getUpcomingReminders } = useReminderStore();
  const { getFilteredRecords } = useHealthRecordStore();
  const [showCardSettings, setShowCardSettings] = useState(false);
  
  const currentPet = getCurrentPet();
  const unlockedBadges = badges.filter(b => b.isUnlocked).length;
  
  console.log('HomePage Debug:', {
    currentPet,
    pets,
    currentPetId,
    currentEmotion,
    healthScore,
    badgesCount: badges.length,
    totalPoints,
    streakDays,
  });
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>([
    { id: 'pet_status', title: '宠物状态', icon: Heart, visible: true, order: 0 },
    { id: 'quick_actions', title: '快捷操作', icon: Activity, visible: true, order: 1 },
    { id: 'reminders', title: '即将到来', icon: Calendar, visible: true, order: 2 },
    { id: 'recent_records', title: '最近记录', icon: FileText, visible: true, order: 3 },
    { id: 'bond_metrics', title: '亲密度指标', icon: Star, visible: true, order: 4 },
  ]);

  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];
  const recentRecords = currentPetId ? getFilteredRecords(currentPetId).slice(0, 3) : [];

  const quickActions = [
    {
      icon: Bot,
      label: 'AI健康顾问',
      description: '随时咨询',
      color: 'from-primary-500 to-primary-600',
      page: 'ai-consultant',
    },
    {
      icon: FileText,
      label: '健康记录',
      description: '记录状态',
      color: 'from-blue-500 to-blue-600',
      page: 'health-records',
    },
    {
      icon: Heart,
      label: '情绪翻译',
      description: '读懂毛孩',
      color: 'from-pink-500 to-pink-600',
      page: 'translator',
    },
    {
      icon: BookOpen,
      label: '健康手册',
      description: '专业知识',
      color: 'from-green-500 to-green-600',
      page: 'health-manual',
    },
    {
      icon: Calendar,
      label: '智能提醒',
      description: '重要日程',
      color: 'from-purple-500 to-purple-600',
      page: 'reminders',
    },
    {
      icon: Activity,
      label: '实时监控',
      description: '守护安全',
      color: 'from-orange-500 to-orange-600',
      page: 'monitor',
    },
  ];

  const bondMilestones = [
    { id: 1, date: '2024-03-15', title: '相遇第一天', description: '在宠物店第一次见到小橘', emoji: '👋', achieved: true },
    { id: 2, date: '2024-03-20', title: '回家纪念日', description: '小橘正式成为家庭成员', emoji: '🏠', achieved: true },
    { id: 3, date: '2024-04-01', title: '第一次互动', description: '小橘第一次主动蹭蹭', emoji: '❤️', achieved: true },
    { id: 4, date: '2024-04-15', title: '健康检查', description: '第一次带小橘去体检', emoji: '🏥', achieved: true },
    { id: 5, date: '2024-05-01', title: '户外探索', description: '第一次带小橘出门散步', emoji: '🌳', achieved: false },
    { id: 6, date: '2024-06-01', title: '百日纪念', description: '与小橘相处一百天', emoji: '🎂', achieved: false },
  ];

  const upcomingMilestones = bondMilestones.filter(m => !m.achieved).slice(0, 3);

  // 切换卡片可见性
  const toggleCardVisibility = (cardId: CardType) => {
    setCardConfigs(cards => 
      cards.map(card => 
        card.id === cardId ? { ...card, visible: !card.visible } : card
      )
    );
  };

  // 获取可见并按顺序排列的卡片
  const visibleCards = cardConfigs
    .filter(card => card.visible)
    .sort((a, b) => a.order - b.order);

  const getEmotionEmoji = (emotion: string) => {
    const map: Record<string, string> = {
      happy: '😸',
      curious: '🤔',
      anxious: '😰',
      angry: '😾',
      needs: '🥺',
    };
    return map[emotion] || '😐';
  };

  // 渲染单个卡片
  const renderCard = (cardConfig: CardConfig, index: number) => {
    const delay = 0.1 + index * 0.1;
    
    switch (cardConfig.id) {
      case 'pet_status':
        return (
          <div key={cardConfig.id} className="animate-slide-up" style={{ animationDelay: `${delay}s` }}>
            <Card variant="elevated" padding="lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center animate-bounce-gentle">
                  <span className="text-3xl">{getEmotionEmoji(currentEmotion)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-800">{currentPet?.name}</h3>
                  <p className="text-sm text-neutral-500 capitalize">{currentEmotion}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-400">健康评分</span>
                    <div className="flex items-center gap-1">
                      <div className="w-20 bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-success-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-success-600">{healthScore}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="success" size="sm">正常</Badge>
              </div>
            </Card>
          </div>
        );

      case 'quick_actions':
        return (
          <div key={cardConfig.id} className="animate-slide-up" style={{ animationDelay: `${delay}s` }}>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <div key={action.page} className="col-span-1">
                  <div 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Navigating to:', action.page);
                      onNavigate(action.page);
                    }}
                    className="rounded-2xl border border-neutral-200 bg-white shadow-card p-5 text-center cursor-pointer hover:-translate-y-1 hover:shadow-elevated hover:border-primary-200 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm text-neutral-800 mb-1">{action.label}</h4>
                    <p className="text-xs text-neutral-500">{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'reminders':
        return (
          <div key={cardConfig.id} className="animate-slide-up" style={{ animationDelay: `${delay}s` }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  情感里程碑
                </h3>
                <span className="text-xs text-neutral-500">
                  {bondMilestones.filter(m => m.achieved).length}/{bondMilestones.length} 已达成
                </span>
              </div>
              <div className="space-y-3">
                {upcomingMilestones.length > 0 ? (
                  upcomingMilestones.map((milestone) => (
                    <div 
                      key={milestone.id}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl hover:from-pink-100 hover:to-orange-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-xl">
                        {milestone.emoji}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-neutral-800">{milestone.title}</h4>
                        <p className="text-xs text-neutral-500">{milestone.description}</p>
                      </div>
                      <div className="text-xs text-neutral-400">{milestone.date}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Heart className="w-10 h-10 text-pink-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">所有里程碑都已达成！</p>
                  </div>
                )}
              </div>
              {/* 进度条 */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                  <span>情感成长进度</span>
                  <span>{Math.round((bondMilestones.filter(m => m.achieved).length / bondMilestones.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-gradient-to-r from-pink-200 to-orange-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(bondMilestones.filter(m => m.achieved).length / bondMilestones.length) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        );

      case 'recent_records':
        return (
          <div key={cardConfig.id} className="animate-slide-up" style={{ animationDelay: `${delay}s` }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  最近记录
                </h3>
                <button 
                  className="text-xs text-primary-500 font-medium flex items-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigate('health-records');
                  }}
                >
                  更多
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentRecords.length > 0 ? recentRecords.map((record) => (
                  <div 
                    key={record.id}
                    className="p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <h4 className="font-medium text-sm text-neutral-800">{record.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{record.content}</p>
                  </div>
                )) : (
                  <div className="text-center py-6">
                    <Activity className="w-10 h-10 text-green-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">还没有记录哦</p>
                    <p className="text-xs text-neutral-400 mt-1">点击"健康记录"开始记录</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'bond_metrics':
        return (
          <div key={cardConfig.id} className="animate-slide-up" style={{ animationDelay: `${delay}s` }}>
            <Card className="p-5 bg-gradient-to-br from-green-50 via-white to-emerald-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500 fill-green-500" />
                  {currentPet?.name}健康评分
                </h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-full shadow-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-neutral-600">连续 {streakDays} 天</span>
                </div>
              </div>
              
              {/* 主健康评分展示 */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">❤️</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-400 flex items-center justify-center text-xs font-bold shadow-md">
                    {healthScore}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-neutral-600">健康状态</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                      {healthScore >= 90 ? '非常健康' : healthScore >= 80 ? '健康良好' : healthScore >= 70 ? '基本健康' : '需要关注'}
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 详细指标 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-white rounded-xl shadow-sm">
                  <div className="text-lg font-bold text-green-500">{unlockedBadges}</div>
                  <div className="text-xs text-neutral-500">已获徽章</div>
                </div>
                <div className="text-center p-2 bg-white rounded-xl shadow-sm">
                  <div className="text-lg font-bold text-emerald-500">{totalPoints}</div>
                  <div className="text-xs text-neutral-500">爱心积分</div>
                </div>
                <div className="text-center p-2 bg-white rounded-xl shadow-sm">
                  <div className="text-lg font-bold text-primary-500">{badges.length - unlockedBadges}</div>
                  <div className="text-xs text-neutral-500">待解锁</div>
                </div>
              </div>

              {/* 健康建议 */}
              <div className="mt-4 p-3 bg-white/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">💡 今日建议：</span>
                  <span className="text-sm text-neutral-700">
                    {healthScore < 70 ? '记得按时记录' + (currentPet?.name || '宠物') + '的健康状态哦！' : 
                     healthScore < 85 ? '继续保持良好的健康习惯~' : 
                     '太棒了！继续保持健康快乐的生活！'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header with Gradient */}
      <header className="bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        
        <div className="max-w-md mx-auto px-4 pt-6 pb-12 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 fill-current" />
                PawSync Pro
              </h1>
              <p className="text-xs text-white/80 mt-1">温暖守护 · 陪伴成长</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCardSettings(!showCardSettings);
                }}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate('health');
                }}
              >
                <Activity className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pet Selector */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentPet(pet.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  pet.id === currentPetId
                    ? 'bg-white/30 backdrop-blur border border-white/30'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                  {pet.avatar ? (
                    <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      {pet.type === 'dog' ? '🐕' : '🐱'}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{pet.name}</span>
              </button>
            ))}
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigate('pets');
              }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">添加</span>
            </button>
          </div>

          {/* Health Score & Quick Stats */}
          <div className="flex items-center gap-6">
            <ProgressRing 
              progress={healthScore} 
              size={120} 
              strokeWidth={12}
              label="健康评分"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm">{unlockedBadges} 徽章</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-200" />
                  <span className="text-sm">{streakDays} 天</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
                <span className="text-xs">{healthScore} 分</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-8 space-y-5">
        {/* 卡片设置模态框 */}
        {showCardSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCardSettings(false)}>
            <div className="bg-white rounded-2xl p-6 w-80 max-w-[90%]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-neutral-800">自定义首页</h3>
                <button onClick={() => setShowCardSettings(false)} className="text-neutral-500">✕</button>
              </div>
              <div className="space-y-3">
                {cardConfigs.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="text-neutral-400">
                        <card.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-neutral-800">{card.title}</span>
                    </div>
                    <button 
                      onClick={() => toggleCardVisibility(card.id)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        card.visible ? 'bg-primary-500' : 'bg-neutral-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        card.visible ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowCardSettings(false)}
                className="w-full mt-4 py-3 bg-primary-500 text-white rounded-xl font-medium"
              >
                完成
              </button>
            </div>
          </div>
        )}

        {/* 动态渲染卡片 */}
        {visibleCards.map((cardConfig, index) => renderCard(cardConfig, index))}
      </main>
    </div>
  );
};

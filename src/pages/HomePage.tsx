import React from 'react';
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
  ArrowUpRight,
  Mic,
  Utensils,
  Shield
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

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet, currentEmotion, healthScore } = useAppStore();
  const { metrics, badges, totalPoints, streakDays } = useBondStore();
  const unlockedBadges = badges.filter(b => b.isUnlocked).length;
  const { pets, currentPetId, setCurrentPet } = usePetStore();
  const { getUpcomingReminders } = useReminderStore();
  const { getFilteredRecords } = useHealthRecordStore();

  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];
  const recentRecords = currentPetId ? getFilteredRecords(currentPetId).slice(0, 3) : [];

  const quickActions = [
    {
      icon: Mic,
      label: '声音分析',
      description: '倾听心声',
      color: 'from-purple-500 to-pink-600',
      page: 'voice-analysis',
    },
    {
      icon: Activity,
      label: '行为分析',
      description: 'AI监测',
      color: 'from-blue-500 to-cyan-600',
      page: 'behavior-analysis',
    },
    {
      icon: Shield,
      label: '健康管理',
      description: '智能预警',
      color: 'from-green-500 to-emerald-600',
      page: 'health-management',
    },
    {
      icon: Utensils,
      label: '营养分析',
      description: '科学喂养',
      color: 'from-orange-500 to-amber-600',
      page: 'food-analysis',
    },
    {
      icon: Bot,
      label: 'AI顾问',
      description: '随时咨询',
      color: 'from-primary-500 to-primary-600',
      page: 'ai-consultant',
    },
    {
      icon: Calendar,
      label: '智能提醒',
      description: '重要日程',
      color: 'from-indigo-500 to-purple-600',
      page: 'reminders',
    },
  ];

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
            <button 
              className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
              onClick={() => onNavigate('health')}
            >
              <div className="w-6 h-6" />
            </button>
          </div>

          {/* Pet Selector */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setCurrentPet(pet.id)}
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
              onClick={() => onNavigate('pets')}
            >
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
                <div className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">添加</span>
            </button>
          </div>

          {/* Bond Score & Quick Stats */}
          <div className="flex items-center gap-6">
            <ProgressRing 
              progress={metrics.overall} 
              size={120} 
              strokeWidth={12}
              label="亲密度"
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
                    className="bg-yellow-400 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((totalPoints / 2000) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs">{totalPoints} 积分</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-8 space-y-5">
        {/* Status Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
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

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {quickActions.map((action, index) => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className="col-span-1"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              <Card className="text-center h-full">
                <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-sm text-neutral-800 mb-1">{action.label}</h4>
                <p className="text-xs text-neutral-500">{action.description}</p>
              </Card>
            </button>
          ))}
        </div>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  即将到来
                </h3>
                <button 
                  className="text-xs text-primary-500 font-medium flex items-center gap-1"
                  onClick={() => onNavigate('reminders')}
                >
                  全部
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {upcomingReminders.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-neutral-800">{reminder.title}</h4>
                      <p className="text-xs text-neutral-500">{reminder.date} {reminder.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Recent Records */}
        {recentRecords.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  最近记录
                </h3>
                <button 
                  className="text-xs text-primary-500 font-medium flex items-center gap-1"
                  onClick={() => onNavigate('health-records')}
                >
                  更多
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentRecords.map((record, index) => (
                  <div 
                    key={record.id}
                    className="p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <h4 className="font-medium text-sm text-neutral-800">{record.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{record.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

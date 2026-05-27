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
  Camera,
  Video,
  MessageCircle
} from 'lucide-react';
import { GlassCard, GlassButton } from '../components/DesignSystem';
import { useAppStore } from '../store/appStore';
import { useBondStore } from '../store/bondStore';
import { usePetStore } from '../store/petStore';
import { useReminderStore } from '../store/reminderStore';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { cameraAdapterService } from '../services/cameraAdapterService';
import { useState, useEffect } from 'react';
import type { CameraDevice } from '../types/camera';

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
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cameraAdapterService.getDevices().then((devices) => {
      setCameras(devices);
      setIsLoading(false);
    });
  }, []);

  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];
  const recentRecords = currentPetId ? getFilteredRecords(currentPetId).slice(0, 3) : [];
  const onlineCameras = cameras.filter(c => c.status === 'online');

  const quickActions = [
    {
      icon: Video,
      label: '实时监控',
      description: '查看毛孩',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      page: 'camera-monitor',
    },
    {
      icon: Bot,
      label: 'AI健康顾问',
      description: '随时咨询',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      page: 'ai-consultant',
    },
    {
      icon: MessageCircle,
      label: '情绪翻译',
      description: '读懂毛孩',
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      page: 'translator',
    },
    {
      icon: FileText,
      label: '健康记录',
      description: '记录状态',
      color: 'bg-gradient-to-br from-teal-500 to-green-500',
      page: 'health-records',
    },
    {
      icon: BookOpen,
      label: '健康手册',
      description: '专业知识',
      color: 'bg-gradient-to-br from-indigo-500 to-purple-500',
      page: 'health-manual',
    },
    {
      icon: Calendar,
      label: '智能提醒',
      description: '重要日程',
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
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
      relaxed: '😌',
      excited: '🤩',
      sleepy: '😴',
      calm: '🧘',
    };
    return map[emotion] || '😐';
  };

  const getEmotionLabel = (emotion: string) => {
    const map: Record<string, string> = {
      happy: '开心',
      curious: '好奇',
      anxious: '焦虑',
      angry: '生气',
      needs: '需要关注',
      relaxed: '放松',
      excited: '兴奋',
      sleepy: '困倦',
      calm: '平静',
    };
    return map[emotion] || '未知';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-blue-950/30 pb-24">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-500 to-secondary-500" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-white/10 to-transparent" />
        
        <div className="max-w-md mx-auto px-4 pt-6 pb-14 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 fill-current" />
                PawSync Pro
              </h1>
              <p className="text-xs text-white/70 mt-1">温暖守护 · 陪伴成长</p>
            </div>
            <button 
              className="p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all active-scale"
              onClick={() => onNavigate('profile')}
              aria-label="个人中心"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                {currentPet?.name?.charAt(0) || 'P'}
              </div>
            </button>
          </div>

          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setCurrentPet(pet.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all backdrop-blur-md ${
                  pet.id === currentPetId
                    ? 'bg-white/30 border border-white/40 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30">
                  {pet.avatar ? (
                    <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {pet.type === 'dog' ? '🐕' : '🐱'}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-white whitespace-nowrap">{pet.name}</span>
              </button>
            ))}
            <button 
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md"
              onClick={() => onNavigate('pets')}
              aria-label="添加宠物"
            >
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
                <div className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-white">添加</span>
            </button>
          </div>

          <GlassCard className="bg-white/10 backdrop-blur-xl border-white/20">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                  <span className="text-4xl animate-bounce-gentle">{getEmotionEmoji(currentEmotion)}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success-500 border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{currentPet?.name}</h3>
                <p className="text-sm text-white/70 capitalize">{getEmotionLabel(currentEmotion)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs text-white/80">{unlockedBadges} 徽章</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-200" />
                    <span className="text-xs text-white/80">{streakDays} 天</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{healthScore}</div>
                <div className="text-xs text-white/60">健康评分</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-6 space-y-4">
        {onlineCameras.length > 0 && (
          <GlassCard variant="elevated" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-500" />
                在线设备
              </h3>
              <button 
                className="text-xs text-primary-500 font-medium flex items-center gap-1"
                onClick={() => onNavigate('camera-monitor')}
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {onlineCameras.slice(0, 2).map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => onNavigate('camera-monitor')}
                  className="relative aspect-video rounded-xl overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-xs text-white font-medium px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                      {camera.name}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {quickActions.map((action, index) => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className="col-span-1 animate-fade-in active-scale"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              aria-label={action.label}
            >
              <GlassCard padding="sm" className="text-center h-full hover-lift">
                <div className={`w-12 h-12 mx-auto rounded-2xl ${action.color} flex items-center justify-center mb-3 shadow-lg shadow-black/5 transition-transform group-hover:scale-110`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 mb-1">{action.label}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{action.description}</p>
              </GlassCard>
            </button>
          ))}
        </div>

        {upcomingReminders.length > 0 && (
          <GlassCard variant="default" className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
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
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <div 
                  key={reminder.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-neutral-50 to-white hover:from-primary-50 hover:to-primary-100/50 transition-all cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-neutral-800 dark:text-neutral-100">{reminder.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{reminder.date} {reminder.time}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {recentRecords.length > 0 && (
          <GlassCard variant="default" className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
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
            <div className="space-y-2">
              {recentRecords.map((record) => (
                <div 
                  key={record.id}
                  className="p-3 rounded-xl bg-gradient-to-r from-neutral-50 to-white hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-neutral-800 dark:text-neutral-100">{record.title}</h4>
                  <span className="text-xs text-neutral-400">{record.createdAt?.split('T')[0]}</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{record.content}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {totalPoints} 积分
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {metrics.overall}% 亲密度
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

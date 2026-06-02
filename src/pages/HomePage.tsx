import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  MessageCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Shield,
  Bell,
  Stethoscope,
  PawPrint,
  Brain,
  ScanLine,
  ClipboardList,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { GlassCard, GlassButton, SkeletonCard, SkeletonQuickActions } from '../components/DesignSystem';
import '../styles/animations.css';
import { useAppStore } from '../store/appStore';
import { useBondStore } from '../store/bondStore';
import { usePetStore } from '../store/petStore';
import { useReminderStore } from '../store/reminderStore';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { cameraAdapterService } from '../services/cameraAdapterService';
import type { CameraDevice } from '../types/camera';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgGradient: string;
  page: string;
  badge?: string;
  badgeColor?: string;
  isPrimary?: boolean;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const devices = await cameraAdapterService.getDevices();
    setCameras(devices);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await loadData();
    setIsRefreshing(false);
    setPullDistance(0);
  }, [loadData]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      const resistance = 0.5;
      const newDistance = Math.min(diff * resistance, 100);
      setPullDistance(newDistance);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    setIsPulling(false);
    if (pullDistance > 60 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, handleRefresh]);

  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];
  const recentRecords = currentPetId ? getFilteredRecords(currentPetId).slice(0, 3) : [];
  const onlineCameras = cameras.filter(c => c.status === 'online');

  const quickActions: QuickAction[] = [
    {
      icon: Video,
      label: '实时监控',
      description: '查看毛孩动态',
      color: '#3B82F6',
      bgGradient: 'from-blue-500 via-blue-600 to-cyan-500',
      page: 'camera-monitor',
      badge: onlineCameras.length > 0 ? `${onlineCameras.length}台` : undefined,
      badgeColor: 'bg-blue-500',
      isPrimary: true,
    },
    {
      icon: Bot,
      label: 'AI健康顾问',
      description: '智能问诊咨询',
      color: '#8B5CF6',
      bgGradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
      page: 'ai-consultant',
      badge: 'AI',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
      isPrimary: true,
    },
    {
      icon: MessageCircle,
      label: '情绪翻译',
      description: '读懂宠物心声',
      color: '#F97316',
      bgGradient: 'from-orange-500 via-red-400 to-rose-500',
      page: 'translator',
      badge: '95%+',
      badgeColor: 'bg-orange-500',
      isPrimary: true,
    },
    {
      icon: FileText,
      label: '健康记录',
      description: '追踪健康状况',
      color: '#10B981',
      bgGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      page: 'health-records',
      isPrimary: false,
    },
    {
      icon: BookOpen,
      label: '健康手册',
      description: '专业养宠知识',
      color: '#6366F1',
      bgGradient: 'from-indigo-500 via-purple-500 to-blue-500',
      page: 'health-manual',
      badge: '60+篇',
      badgeColor: 'bg-indigo-500',
      isPrimary: false,
    },
    {
      icon: Calendar,
      label: '智能提醒',
      description: '重要日程管理',
      color: '#F59E0B',
      bgGradient: 'from-amber-500 via-yellow-500 to-orange-500',
      page: 'reminders',
      badge: upcomingReminders.length > 0 ? `${upcomingReminders.length}条` : undefined,
      badgeColor: 'bg-amber-500',
      isPrimary: false,
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

  const handleCardClick = useCallback((page: string) => {
    onNavigate(page);
  }, [onNavigate]);

  const refreshProgress = Math.min(pullDistance / 60, 1);
  const refreshRotation = pullDistance * 2;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-950/50 pb-24 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${isRefreshing ? 60 : pullDistance * 0.5}px)` }}
      >
        <div 
          className={`absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center transition-all duration-300 ${
            pullDistance > 20 || isRefreshing ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          style={{ 
            top: isRefreshing ? 10 : -40 + pullDistance * 0.5,
          }}
        >
          <div 
            className={`w-11 h-11 rounded-full bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center border border-neutral-100 dark:border-neutral-700 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{ transform: isRefreshing ? undefined : `rotate(${refreshRotation}deg)` }}
          >
            <RefreshCw className={`w-5 h-5 text-primary-500 dark:text-primary-400 transition-transform duration-200`} />
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-medium px-2 py-0.5 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm">
            {isRefreshing ? '刷新中...' : pullDistance > 60 ? '释放刷新' : '下拉刷新'}
          </span>
        </div>

        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#EC4899]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-white/5 rounded-full animate-breathe" />
          
          <div className="max-w-md mx-auto px-4 pt-8 pb-16 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="animate-stagger-fade card-stagger-1">
                <h1 className="text-xl font-bold text-white flex items-center gap-2.5 tracking-tight">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <Heart className="w-[18px] h-[18px] text-white fill-current" />
                  </div>
                  PawSync Pro
                </h1>
                <p className="text-xs text-white/70 mt-1.5 ml-[42px]">温暖守护 · 陪伴成长</p>
              </div>
              <button 
                className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md hover:bg-white/25 transition-all active-scale overflow-hidden border border-white/10"
                onClick={() => onNavigate('profile')}
                aria-label="个人中心"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {currentPet?.name?.charAt(0) || 'P'}
                </div>
              </button>
            </div>

            <div className="flex gap-2.5 mb-6 overflow-x-auto pb-1 scrollbar-thin animate-stagger-fade card-stagger-2">
              {pets.map((pet, index) => (
                <button
                  key={pet.id}
                  onClick={() => setCurrentPet(pet.id)}
                  className={`flex items-center gap-2.5 pl-1 pr-4 py-2 rounded-2xl transition-all backdrop-blur-md active-scale group ${
                    pet.id === currentPetId
                      ? 'bg-white/25 border border-white/30 shadow-lg shadow-black/10 scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/[0.18] border border-transparent hover:border-white/20'
                  }`}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl overflow-hidden ring-2 transition-all ${
                    pet.id === currentPetId ? 'ring-white/50 scale-110' : 'ring-white/20'
                  } ${pet.avatar ? '' : 'bg-white/15'}`}>
                    {pet.avatar ? (
                      <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        {pet.type === 'dog' ? '🐕' : '🐱'}
                      </div>
                    )}
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                    pet.id === currentPetId ? 'text-white' : 'text-white/80'
                  }`}>{pet.name}</span>
                </button>
              ))}
              <button 
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/[0.18] transition-all backdrop-blur-md active-scale border border-dashed border-white/20 hover:border-white/30"
                onClick={() => onNavigate('pets')}
                aria-label="添加宠物"
              >
                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center group-hover:border-white/50 transition-colors">
                  <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/70">添加</span>
              </button>
            </div>

            <GlassCard 
              className="bg-white/12 backdrop-blur-2xl border-white/20 shadow-2xl shadow-black/10"
              enable3D={true}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                    <span className="text-4xl drop-shadow-lg">{getEmotionEmoji(currentEmotion)}</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white shadow-lg flex items-center justify-center animate-pulse-indicator">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white">{currentPet?.name}</h3>
                  <p className="text-sm text-white/70 mt-0.5">{getEmotionLabel(currentEmotion)}</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/10">
                      <Star className="w-3.5 h-3.5 text-yellow-300 fill-current" />
                      <span className="text-xs text-yellow-200 font-medium">{unlockedBadges} 徽章</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-400/20 border border-blue-400/10">
                      <Clock className="w-3.5 h-3.5 text-blue-200" />
                      <span className="text-xs text-blue-200 font-medium">{streakDays} 天</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-black text-white tabular-nums tracking-tight drop-shadow-sm">{healthScore}</div>
                  <div className="text-xs text-white/50 font-medium">健康分</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 -mt-8 space-y-5">
          {isLoading ? (
            <>
              <SkeletonCard className="animate-card-enter card-stagger-1" />
              <SkeletonQuickActions count={6} />
              <SkeletonCard className="animate-card-enter card-stagger-4" />
            </>
          ) : (
            <>
              {onlineCameras.length > 0 && (
                <GlassCard 
                  variant="elevated" 
                  className="animate-card-enter card-stagger-1 overflow-hidden"
                  enable3D={true}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Camera className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" />
                      </div>
                      在线设备
                    </h3>
                    <button 
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors active-scale"
                      onClick={() => onNavigate('camera-monitor')}
                    >
                      查看全部
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {onlineCameras.slice(0, 2).map((camera, index) => (
                      <button
                        key={camera.id}
                        onClick={() => onNavigate('camera-monitor')}
                        className="relative aspect-video rounded-xl overflow-hidden group active-scale"
                        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                          <Video className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <span className="text-xs text-white font-medium px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                            {camera.name}
                          </span>
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <ArrowRight className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </GlassCard>
              )}

              <div className="space-y-3 animate-card-enter card-stagger-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 text-base">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    快捷功能
                  </h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {quickActions.map((action, index) => (
                    <button
                      key={action.page}
                      onClick={() => handleCardClick(action.page)}
                      className="group relative col-span-1 active-scale overflow-hidden rounded-2xl"
                      style={{ animationDelay: `${0.15 + index * 0.06}s` }}
                      aria-label={action.label}
                    >
                      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-3.5 h-full border border-neutral-100 dark:border-neutral-800 group-hover:border-neutral-200 dark:group-hover:border-neutral-700 group-hover:shadow-xl dark:group-hover:shadow-black/30 transition-all duration-300">
                        <div className="relative mb-3">
                          <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${action.bgGradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300`}>
                            <action.icon className="w-6 h-6 text-white" strokeWidth={2} />
                          </div>
                          {action.badge && (
                            <div className={`absolute -top-1 -right-1 ${action.badgeColor || 'bg-red-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md leading-none`}>
                              {action.badge}
                            </div>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-100 text-center mb-0.5 truncate">{action.label}</h4>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center truncate">{action.description}</p>
                        
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full bg-gradient-to-r opacity-0 group-hover:w-4/5 group-hover:opacity-100 transition-all duration-300" style={{ backgroundImage: `linear-gradient(to right, transparent, ${action.color}, transparent)` }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {upcomingReminders.length > 0 && (
                <GlassCard 
                  variant="default" 
                  className="animate-card-enter card-stagger-4 overflow-hidden"
                  enable3D={true}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Bell className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" />
                      </div>
                      即将到来
                    </h3>
                    <button 
                      className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors active-scale"
                      onClick={() => onNavigate('reminders')}
                    >
                      全部
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {upcomingReminders.map((reminder, index) => (
                      <div 
                        key={reminder.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/10 hover:from-amber-100/80 hover:to-orange-100/50 dark:hover:from-amber-900/30 dark:hover:to-orange-900/20 transition-all cursor-pointer active-scale group"
                        style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                        onClick={() => onNavigate('reminders')}
                      >
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate">{reminder.title}</h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{reminder.date} {reminder.time}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {recentRecords.length > 0 && (
                <GlassCard 
                  variant="default" 
                  className="animate-card-enter card-stagger-5 overflow-hidden"
                  enable3D={true}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Activity className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" />
                      </div>
                      最近记录
                    </h3>
                    <button 
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors active-scale"
                      onClick={() => onNavigate('health-records')}
                    >
                      更多
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentRecords.map((record, index) => (
                      <div 
                        key={record.id}
                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/10 hover:shadow-sm dark:hover:shadow-none hover:from-emerald-100/80 hover:to-teal-100/50 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/20 transition-all cursor-pointer active-scale group"
                        style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                        onClick={() => onNavigate('health-records')}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate pr-2">{record.title}</h4>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">{record.createdAt?.split('T')[0]}</span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{record.content}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <div className="flex items-center justify-center py-6 animate-stagger-fade card-stagger-6">
                <div className="flex items-center gap-5 text-xs text-neutral-400 dark:text-neutral-500">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors cursor-default">
                    <Star className="w-3 h-3 text-amber-400 animate-pulse-glow" />
                    <span className="font-medium">{totalPoints} 积分</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors cursor-default">
                    <Heart className="w-3 h-3 text-rose-400 animate-pulse-glow" />
                    <span className="font-medium">{metrics.overall}% 亲密度</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
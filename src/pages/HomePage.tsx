// ============================================
// HomePage - 首页（优化版）
// P0-1: 首页信息架构简化
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  RefreshCw,
  Star,
  Clock
} from 'lucide-react';
import { GlassCard, SkeletonQuickActions } from '../components/DesignSystem';
import { SmartTodayCard, CoreFeatures, PersonalizedFeed } from '../components/home';
import '../styles/animations.css';
import { useAppStore } from '../store/appStore';
import { useBondStore } from '../store/bondStore';
import { usePetStore } from '../store/petStore';
import { cameraAdapterService } from '../services/cameraAdapterService';
import type { CameraDevice } from '../types/camera';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet, currentEmotion, healthScore } = useAppStore();
  const { metrics, totalPoints, streakDays } = useBondStore();
  const { pets, currentPetId, setCurrentPet } = usePetStore();
  const [, setCameras] = useState<CameraDevice[]>([]);
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

  const refreshRotation = pullDistance * 2;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-950/50 pb-24 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${isRefreshing ? 60 : pullDistance * 0.5}px)` }}
      >
        {/* 下拉刷新指示器 */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center transition-all duration-300 ${
            pullDistance > 20 || isRefreshing ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          style={{ 
            top: isRefreshing ? 10 : -40 + pullDistance * 0.5,
          }}
        >
          <div 
            className={`w-11 h-11 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl flex items-center justify-center border border-white/30 dark:border-neutral-700/50 shadow-xl ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{ transform: isRefreshing ? undefined : `rotate(${refreshRotation}deg)` }}
          >
            <RefreshCw className={`w-5 h-5 text-orange-500 dark:text-orange-400 transition-transform duration-200`} />
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-medium px-2 py-0.5 rounded-full bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md">
            {isRefreshing ? '刷新中...' : pullDistance > 60 ? '释放刷新' : '下拉刷新'}
          </span>
        </div>

        {/* 头部区域 */}
        <header className="relative overflow-hidden">
          {/* ColorOS 16 液态玻璃背景渐变 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A65] via-[#FFB74D] to-[#FFCC80]" />
          
          {/* 液态玻璃纹理背景 */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          
          {/* 液态玻璃浮动光斑 */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl animate-liquid-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/15 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl animate-liquid-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-amber-300/20 rounded-full blur-2xl animate-liquid-morph" />
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-orange-200/25 rounded-full blur-2xl animate-glass-breathe" />
          
          <div className="max-w-md mx-auto px-4 pt-8 pb-16 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="animate-liquid-fade-in liquid-card-enter-1">
                <h1 className="text-xl font-bold text-white flex items-center gap-2.5 tracking-tight">
                  <div className="w-8 h-8 rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                    <Heart className="w-[18px] h-[18px] text-white fill-current" />
                  </div>
                  爪爪连心❤️
                </h1>
                <p className="text-xs text-white/80 mt-1.5 ml-[42px] font-medium">温暖守护 · 陪伴成长</p>
              </div>
              <button 
                className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-all active-scale overflow-hidden border border-white/20 shadow-lg"
                onClick={() => onNavigate('profile')}
                aria-label="个人中心"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {currentPet?.name?.charAt(0) || 'P'}
                </div>
              </button>
            </div>

            {/* 宠物选择器 */}
            <div className="flex gap-2.5 mb-6 overflow-x-auto pb-1 scrollbar-thin animate-liquid-fade-in liquid-card-enter-2">
              {pets.map((pet, index) => (
                <button
                  key={pet.id}
                  onClick={() => setCurrentPet(pet.id)}
                  className={`flex items-center gap-2.5 pl-1 pr-4 py-2 rounded-2xl transition-all backdrop-blur-xl active-scale group ${
                    pet.id === currentPetId
                      ? 'bg-white/30 border border-white/30 shadow-xl scale-[1.02]'
                      : 'bg-white/15 hover:bg-white/25 border border-transparent hover:border-white/20'
                  }`}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl overflow-hidden ring-2 transition-all ${
                    pet.id === currentPetId ? 'ring-white/50 scale-110' : 'ring-white/20'
                  } ${pet.avatar ? '' : 'bg-white/20'}`}>
                    {pet.avatar ? (
                      <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        {pet.type === 'dog' ? '🐕' : '🐱'}
                      </div>
                    )}
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                    pet.id === currentPetId ? 'text-white' : 'text-white/85'
                  }`}>{pet.name}</span>
                </button>
              ))}
              <button 
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 transition-all backdrop-blur-xl active-scale border border-dashed border-white/25 hover:border-white/35"
                onClick={() => onNavigate('pets')}
                aria-label="添加宠物"
              >
                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-white/35 flex items-center justify-center group-hover:border-white/50 transition-colors">
                  <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/75">添加</span>
              </button>
            </div>

            {/* Hero 卡片 - 宠物状态 */}
            <div className="animate-liquid-fade-in liquid-card-enter-3">
              <div className="relative p-4 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-sm">
                      <span className="text-4xl drop-shadow-lg">{getEmotionEmoji(currentEmotion)}</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white shadow-lg flex items-center justify-center animate-pulse-indicator">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white">{currentPet?.name}</h3>
                    <p className="text-sm text-white/80 mt-0.5">{getEmotionLabel(currentEmotion)}</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-400/25 border border-yellow-400/15 backdrop-blur-sm">
                        <Star className="w-3.5 h-3.5 text-yellow-200 fill-current" />
                        <span className="text-xs text-yellow-100 font-medium">{0} 徽章</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-400/25 border border-blue-400/15 backdrop-blur-sm">
                        <Clock className="w-3.5 h-3.5 text-blue-200" />
                        <span className="text-xs text-blue-100 font-medium">{streakDays} 天</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-black text-white tabular-nums tracking-tight drop-shadow-sm">{healthScore}</div>
                    <div className="text-xs text-white/60 font-medium">健康分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区 - 新架构 */}
        <main className="max-w-md mx-auto px-4 -mt-8 space-y-5">
          {isLoading ? (
            <>
              <GlassCard variant="liquid" className="animate-liquid-fade-in">
                <div className="space-y-3">
                  <div className="h-4 w-3/4 skeleton rounded-lg" />
                  <div className="h-3 w-full skeleton rounded-lg" />
                  <div className="h-3 w-5/6 skeleton rounded-lg" />
                  <div className="h-20 w-full skeleton rounded-xl mt-2" />
                </div>
              </GlassCard>
              <SkeletonQuickActions count={4} />
              <GlassCard variant="liquid" className="animate-liquid-fade-in">
                <div className="space-y-3">
                  <div className="h-4 w-2/3 skeleton rounded-lg" />
                  <div className="h-16 w-full skeleton rounded-xl" />
                  <div className="h-16 w-full skeleton rounded-xl" />
                </div>
              </GlassCard>
            </>
          ) : (
            <>
              {/* 1. 智能今日卡片 */}
              <div className="animate-liquid-fade-in">
                <SmartTodayCard onNavigate={onNavigate} />
              </div>

              {/* 2. 核心功能入口（精简为4个） */}
              <div className="animate-liquid-fade-in">
                <CoreFeatures onNavigate={onNavigate} />
              </div>

              {/* 3. 个性化内容流 */}
              <div className="animate-liquid-fade-in">
                <PersonalizedFeed onNavigate={onNavigate} />
              </div>

              {/* 底部统计 */}
              <div className="flex items-center justify-center py-6 animate-liquid-fade-in">
                <div className="flex items-center gap-5 text-xs text-neutral-400 dark:text-neutral-500">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200/90 dark:hover:bg-neutral-700/90 transition-colors cursor-default backdrop-blur-sm">
                    <Star className="w-3 h-3 text-amber-400 animate-pulse-glow" />
                    <span className="font-medium">{totalPoints} 积分</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200/90 dark:hover:bg-neutral-700/90 transition-colors cursor-default backdrop-blur-sm">
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
